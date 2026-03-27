"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { MODULES, PACKAGE_ID, TYPES } from "../lib/contracts";
import {
  extractCreatedObjectId,
  getOneWalletClient,
  normalizeOwnedObjects,
  type OwnedObject,
} from "../lib/onewallet";
import { useCurrentAccount } from '@onelabs/dapp-kit';

type InventoryState = {
  herbs: OwnedObject[];
  ammo: OwnedObject[];
  fragments: OwnedObject[];
};

type ZombieState = {
  objectId: string;
  hp: number;
  speedTier: number;
  threatTier: "small" | "big";
};

type RaidParticipant = {
  address: string;
  ready: boolean;
};

type RaidState = {
  bossHp: number;
  participants: RaidParticipant[];
  allReady: boolean;
};

type WalletContextValue = {
  connected: boolean;
  address: string | null;
  hunterId: string | null;
  sessionKeyId: string | null;
  sessionExpiresAtMs: number;
  selectedAmmoId: string | null;
  inventory: InventoryState;
  zombies: ZombieState[];
  raidState: RaidState;
  infectionRate: number;
  isHunterCheckPending: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  createHunter: (classId: number) => Promise<void>;
  createOrRefreshSession: (durationEpochs?: number) => Promise<void>;
  refreshInventory: () => Promise<void>;
  refreshZombies: () => Promise<void>;
  refreshRaidState: () => Promise<void>;
  attackSmall: (zombieId: string) => Promise<void>;
  consumeHerb: (herbId: string) => Promise<void>;
  setSelectedAmmoId: (ammoId: string | null) => void;
  readyUp: () => Promise<void>;
  executeRaid: () => Promise<void>;
  setInfectionRate: (rate: number) => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

function parseObjectFieldNumber(obj: OwnedObject, keys: string[], fallback = 0): number {
  const content = obj.content ?? {};
  for (const key of keys) {
    const value = content[key];
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }
  return fallback;
}

async function getOwnedByType(owner: string, structType: string): Promise<OwnedObject[]> {
  const client = getOneWalletClient();
  if (!client) {
    return [];
  }

  return normalizeOwnedObjects(
    client.getOwnedObjects({
      owner,
      filter: { StructType: structType },
    }),
  );
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const currentAccount = useCurrentAccount();
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [hunterId, setHunterId] = useState<string | null>(null);
  const [sessionKeyId, setSessionKeyId] = useState<string | null>(null);
  const sessionKeyRef = useRef<string | null>(null);
  const [sessionExpiresAtMs, setSessionExpiresAtMs] = useState(0);
  const [selectedAmmoId, setSelectedAmmoId] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryState>({
    herbs: [],
    ammo: [],
    fragments: [],
  });
  const [zombies, setZombies] = useState<ZombieState[]>([]);
  const [raidState, setRaidState] = useState<RaidState>({
    bossHp: 0,
    participants: [],
    allReady: false,
  });
  const [infectionRate, setInfectionRate] = useState(0);
  const [isHunterCheckPending, setIsHunterCheckPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withErrorBoundary = useCallback(async (fn: () => Promise<void>) => {
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet action failed");
    }
  }, []);

  const refreshInventory = useCallback(async () => {
    if (!address) {
      return;
    }

    const [herbs, ammo, fragments] = await Promise.all([
      getOwnedByType(address, TYPES.greenHerb),
      getOwnedByType(address, TYPES.ammo),
      getOwnedByType(address, TYPES.vaccineFragment),
    ]);

    setInventory({ herbs, ammo, fragments });

    if (!selectedAmmoId && ammo.length > 0) {
      setSelectedAmmoId(ammo[0].objectId);
    }
  }, [address, selectedAmmoId]);

  const refreshZombies = useCallback(async () => {
    if (!address) {
      return;
    }

    const [small, big] = await Promise.all([
      getOwnedByType(address, TYPES.smallZombie),
      getOwnedByType(address, TYPES.bigZombie),
    ]);

    const mappedSmall: ZombieState[] = small.map((z) => ({
      objectId: z.objectId,
      hp: parseObjectFieldNumber(z, ["hp"]),
      speedTier: parseObjectFieldNumber(z, ["speed_tier", "speedTier"], 1),
      threatTier: "small",
    }));

    const mappedBig: ZombieState[] = big.map((z) => ({
      objectId: z.objectId,
      hp: parseObjectFieldNumber(z, ["hp"]),
      speedTier: 1,
      threatTier: "big",
    }));

    setZombies([...mappedSmall, ...mappedBig]);
  }, [address]);

  const refreshRaidState = useCallback(async () => {
    if (!address) {
      return;
    }

    const lobbies = await getOwnedByType(address, TYPES.raidLobby);
    const lobby = lobbies[0];

    if (!lobby) {
      setRaidState({ bossHp: 0, participants: [], allReady: false });
      return;
    }

    const content = lobby.content ?? {};
    const participants = (content.participants as string[] | undefined) ?? [];
    const readyFlags = (content.ready_flags as boolean[] | undefined) ?? [];

    const merged: RaidParticipant[] = participants.map((participant, index) => ({
      address: participant,
      ready: Boolean(readyFlags[index]),
    }));

    setRaidState({
      bossHp: parseObjectFieldNumber(lobby, ["boss_hp", "bossHp"]),
      participants: merged,
      allReady: merged.length > 0 && merged.every((p) => p.ready),
    });
  }, [address]);

  const isCreatingHunter = useRef(false);

  const createHunterIfMissing = useCallback(async (owner: string) => {
    const client = getOneWalletClient();
    if (!client || !PACKAGE_ID || isCreatingHunter.current) {
      return;
    }

    setIsHunterCheckPending(true);
    try {
      const existing = await getOwnedByType(owner, TYPES.hunter);
      if (existing.length > 0) {
        setHunterId(existing[0].objectId);
      }
    } finally {
      setIsHunterCheckPending(false);
    }
  }, []);

  const createHunter = useCallback(async (classId: number) => {
    await withErrorBoundary(async () => {
      const client = getOneWalletClient();
      if (!client || !PACKAGE_ID) {
        throw new Error("Wallet client or package id is not configured");
      }

      isCreatingHunter.current = true;
      try {
        const timer = setTimeout(() => {
          if (isCreatingHunter.current) {
            setError("REGISTRATION TIMEOUT: CHECK WALLET POPUP");
          }
        }, 30000);

        const result = await client.moveCall({
          packageId: PACKAGE_ID,
          module: MODULES.hunter,
          func: "create_hunter",
          args: [classId],
        });

        clearTimeout(timer);
        const createdId = extractCreatedObjectId(result);
        if (createdId) {
          setHunterId(createdId);
          await Promise.all([refreshInventory(), refreshZombies(), refreshRaidState()]);
        } else {
          // If extraction failed but transaction succeeded, try manual refresh
          if (address) await createHunterIfMissing(address);
        }
      } finally {
        isCreatingHunter.current = false;
      }
    });
  }, [withErrorBoundary, refreshInventory, refreshZombies, refreshRaidState, createHunterIfMissing, address]);

  const connect = useCallback(async () => {
    // Connection handled by dapp-kit ConnectButton
  }, []);

  // Sync wallet state when dapp-kit detects OneWallet connection
  useEffect(() => {
    const syncState = async () => {
      if (currentAccount?.address && currentAccount.address !== address) {
        setAddress(currentAccount.address);
        setConnected(true);
        await createHunterIfMissing(currentAccount.address);
        await Promise.all([refreshInventory(), refreshZombies(), refreshRaidState()]);
      } else if (!currentAccount && address) {
        setAddress(null);
        setConnected(false);
        setHunterId(null);
        setSessionKeyId(null);
        sessionKeyRef.current = null;
        setSessionExpiresAtMs(0);
        setSelectedAmmoId(null);
        setInventory({ herbs: [], ammo: [], fragments: [] });
        setZombies([]);
        setRaidState({ bossHp: 0, participants: [], allReady: false });
      }
    };
    void syncState();
  }, [currentAccount, address, createHunterIfMissing, refreshInventory, refreshZombies, refreshRaidState]);

  const disconnect = useCallback(async () => {
    await withErrorBoundary(async () => {
      const client = getOneWalletClient();
      if (client?.disconnect) await client.disconnect();
      setAddress(null);
      setConnected(false);
      setHunterId(null);
      setSessionKeyId(null);
      sessionKeyRef.current = null;
      setSessionExpiresAtMs(0);
      setSelectedAmmoId(null);
      setInventory({ herbs: [], ammo: [], fragments: [] });
      setZombies([]);
      setRaidState({ bossHp: 0, participants: [], allReady: false });
    });
  }, [withErrorBoundary]);

  const createOrRefreshSession = useCallback(async (durationEpochs = 600) => {
    await withErrorBoundary(async () => {
      if (!address) {
        throw new Error("Connect wallet first");
      }

      const client = getOneWalletClient();
      if (!client || !PACKAGE_ID) {
        throw new Error("Wallet client or package id is not configured");
      }

      const result = await client.moveCall({
        packageId: PACKAGE_ID,
        module: MODULES.sessionKey,
        func: "create_session",
        args: [durationEpochs],
      });

      let createdId = extractCreatedObjectId(result);
      
      // Fallback: Manually scan if ID parsing failed
      if (!createdId && address) {
        console.warn("[WalletContext] Failed to parse session ID from response, performing manual scan...");
        const sessionKeys = await getOwnedByType(address, TYPES.sessionKey);
        if (sessionKeys.length > 0) {
          // Take the most recently created session key (last in list)
          createdId = sessionKeys[sessionKeys.length - 1].objectId;
        }
      }

      if (!createdId) {
        throw new Error("Session key created but id could not be synchronized. Please refresh.");
      }

      sessionKeyRef.current = createdId;
      setSessionKeyId(createdId);

      const epochDurationMs = (await client.getEpochDurationMs?.()) ?? 1000;
      setSessionExpiresAtMs(Date.now() + durationEpochs * epochDurationMs);
    });
  }, [address, withErrorBoundary]);

  const attackSmall = useCallback(async (zombieId: string) => {
    await withErrorBoundary(async () => {
      if (!hunterId || !sessionKeyRef.current || !selectedAmmoId) {
        throw new Error("Missing hunter, session key, or ammo selection");
      }

      const client = getOneWalletClient();
      const VIRUS_STATE_ID = process.env.NEXT_PUBLIC_VIRUS_STATE_ID;
      if (!client || !PACKAGE_ID || !VIRUS_STATE_ID) {
        throw new Error("Wallet client, package id, or virus state id not configured");
      }

      await client.moveCall({
        packageId: PACKAGE_ID,
        module: MODULES.survival,
        func: "attack_small_with_session",
        args: [
           sessionKeyRef.current, 
           hunterId, 
           zombieId, 
           selectedAmmoId,
           VIRUS_STATE_ID,  // Global Virus State
           "0x8"            // Global Random Generator
        ],
      });

      await Promise.all([refreshInventory(), refreshZombies(), refreshRaidState()]);
    });
  }, [hunterId, refreshInventory, refreshZombies, selectedAmmoId, withErrorBoundary]);

  const consumeHerb = useCallback(async (herbId: string) => {
    await withErrorBoundary(async () => {
      if (!hunterId || !sessionKeyRef.current) {
        throw new Error("Missing hunter or session key");
      }

      const client = getOneWalletClient();
      if (!client || !PACKAGE_ID) {
        throw new Error("Wallet client or package id is not configured");
      }

      await client.moveCall({
        packageId: PACKAGE_ID,
        module: MODULES.survival,
        func: "use_herb_with_session",
        args: [sessionKeyRef.current, hunterId, herbId],
      });

      await refreshInventory();
    });
  }, [hunterId, refreshInventory, withErrorBoundary]);

  const readyUp = useCallback(async () => {
    await withErrorBoundary(async () => {
      const client = getOneWalletClient();
      if (!client || !PACKAGE_ID) {
        throw new Error("Wallet client or package id is not configured");
      }

      await client.moveCall({
        packageId: PACKAGE_ID,
        module: MODULES.raid,
        func: "ready_up",
      });

      await refreshRaidState();
    });
  }, [refreshRaidState, withErrorBoundary]);

  const executeRaid = useCallback(async () => {
    await withErrorBoundary(async () => {
      const client = getOneWalletClient();
      if (!client || !PACKAGE_ID) {
        throw new Error("Wallet client or package id is not configured");
      }

      await client.moveCall({
        packageId: PACKAGE_ID,
        module: MODULES.raid,
        func: "execute_raid",
      });

      await Promise.all([refreshRaidState(), refreshInventory()]);
    });
  }, [refreshInventory, refreshRaidState, withErrorBoundary]);

  useEffect(() => {
    if (!connected || !address) {
      return;
    }

    const interval = window.setInterval(() => {
      void refreshZombies();
    }, 4000);

    return () => {
      window.clearInterval(interval);
    };
  }, [address, connected, refreshZombies]);

  useEffect(() => {
    const client = getOneWalletClient();
    if (!client?.subscribe) {
      return;
    }

    let unsubscribe: (() => void) | undefined;

    void Promise.resolve(
      client.subscribe("CombatEvent", () => {
        void refreshZombies();
      }),
    ).then((fn) => {
      unsubscribe = typeof fn === "function" ? fn : undefined;
    });

    return () => {
      unsubscribe?.();
    };
  }, [refreshZombies]);

  const value = useMemo<WalletContextValue>(
    () => ({
      connected,
      address,
      hunterId,
      sessionKeyId,
      sessionExpiresAtMs,
      selectedAmmoId,
      inventory,
      zombies,
      raidState,
      infectionRate,
      isHunterCheckPending,
      error,
      connect,
      disconnect,
      createHunter,
      createOrRefreshSession,
      refreshInventory,
      refreshZombies,
      refreshRaidState,
      attackSmall,
      consumeHerb,
      setSelectedAmmoId,
      readyUp,
      executeRaid,
      setInfectionRate,
    }),
    [
      address,
      attackSmall,
      connect,
      connected,
      createHunter,
      createOrRefreshSession,
      disconnect,
      error,
      executeRaid,
      hunterId,
      infectionRate,
      inventory,
      raidState,
      readyUp,
      refreshInventory,
      refreshRaidState,
      refreshZombies,
      selectedAmmoId,
      sessionExpiresAtMs,
      sessionKeyId,
      consumeHerb,
      zombies,
      isHunterCheckPending,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used inside WalletProvider");
  }

  return context;
}
