"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type OneIDProfile = {
  address: string;
  hunterName: string;
  infectionLevel: number;
};

type OneIDSDKProfile = {
  address?: string;
  hunterName?: string;
  username?: string;
  displayName?: string;
  infectionLevel?: number | string;
};

type OneIDClient = {
  connect?: () => Promise<unknown>;
  disconnect?: () => Promise<void>;
  getProfile?: () => Promise<unknown>;
};

type OneIDContextValue = {
  profile: OneIDProfile | null;
  loading: boolean;
  error: string | null;
  available: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
};

const OneIDContext = createContext<OneIDContextValue | null>(null);

declare global {
  interface Window {
    oneid?: OneIDClient;
  }
}

function getOneIDClient(): OneIDClient | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.oneid ?? null;
}

function toOneIDProfile(input: unknown): OneIDProfile {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid OneID profile response");
  }

  const raw = input as OneIDSDKProfile;
  const address = typeof raw.address === "string" ? raw.address : "";
  const hunterName =
    typeof raw.hunterName === "string"
      ? raw.hunterName
      : typeof raw.displayName === "string"
        ? raw.displayName
        : typeof raw.username === "string"
          ? raw.username
          : "OneID User";
  const levelValue = raw.infectionLevel;
  const infectionLevel =
    typeof levelValue === "number"
      ? levelValue
      : typeof levelValue === "string"
        ? Number(levelValue) || 0
        : 0;

  return {
    address,
    hunterName,
    infectionLevel,
  };
}

export function OneIDProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<OneIDProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState(false);

  const refresh = useCallback(async () => {
    const client = getOneIDClient();
    setAvailable(Boolean(client));

    if (!client?.getProfile) {
      setProfile(null);
      setError("OneID SDK not detected in browser context");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const raw = await client.getProfile();
      const nextProfile = toOneIDProfile(raw);
      setProfile(nextProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load OneID profile");
    } finally {
      setLoading(false);
    }
  }, []);

  const connect = useCallback(async () => {
    const client = getOneIDClient();
    setAvailable(Boolean(client));
    if (!client?.connect) {
      throw new Error("OneID connect method is unavailable");
    }

    setLoading(true);
    setError(null);
    try {
      await client.connect();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to connect OneID");
      setLoading(false);
      throw err;
    }
  }, [refresh]);

  const disconnect = useCallback(async () => {
    const client = getOneIDClient();
    if (client?.disconnect) {
      await client.disconnect();
    }
    setProfile(null);
    setError(null);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ profile, loading, error, available, connect, disconnect, refresh }),
    [profile, loading, error, available, connect, disconnect, refresh],
  );

  return <OneIDContext.Provider value={value}>{children}</OneIDContext.Provider>;
}

export function useOneID() {
  const context = useContext(OneIDContext);

  if (!context) {
    throw new Error("useOneID must be used inside OneIDProvider");
  }

  return context;
}
