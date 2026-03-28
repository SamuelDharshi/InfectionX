"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Terminal, Zap } from 'lucide-react';
import { HUD } from '../components/resident/HUD';
import { Scanner } from '../components/resident/Scanner';
import { Inventory } from '../components/resident/Inventory';
import { CityStatus } from '../components/resident/CityStatus';
import { CombatOverlay } from '../components/resident/CombatOverlay';
import { Archetype, PlayerStats, Zombie, GameItem, CityState } from '../lib/gameTypes';
import { useWallet } from "../context/WalletContext";
import { ConnectButton } from "../components/ConnectButton";
import { ONECHAIN_RPC } from "../lib/contracts";

// ── Real Data Implementation ──────────────────────────────────────────────────
export default function Home() {
  const { 
    connected, 
    address,
    hunterId, 
    createHunter, 
    sessionKeyId, 
    createOrRefreshSession, 
    zombies: walletZombies, 
    inventory: walletInventory, 
    spawnZombie,
    attackSmall, 
    consumeHerb, 
    infectionRate,
    raidState,
    error: walletError
  } = useWallet();

  // ── Local Game State ────────────────────────────────────────────────────────
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedArchetype, setSelectedArchetype] = useState<Archetype>(Archetype.POINTMAN);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [reloadProgress, setReloadProgress] = useState(0);

  // ── Visual Zombie Management (Client-Side Interpolation of On-Chain Objects) ──
  const [visualZombies, setVisualZombies] = useState<Zombie[]>([]);
  const visualZombiesRef = useRef<Zombie[]>([]);
  visualZombiesRef.current = visualZombies;

  // ── UI State ────────────────────────────────────────────────────────────────
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [logs, setLogs] = useState<string[]>(["PERIMETER SECURED. SCANNING...", "AUTHENTICATING BIO-SIGNATURES..."]);
  const [screenShake, setScreenShake] = useState(false);
  const [muzzleFlash, setMuzzleFlash] = useState(false);
  const [damageFlash, setDamageFlash] = useState(false);
  const [isWarning, setIsWarning] = useState(false);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev.slice(-8), `> ${msg}`]);
  }, []);

  // ── Sync Visual Zombies with Blockchain Objects ─────────────────────────────
  useEffect(() => {
    setVisualZombies(prev => {
      // 1. Remove visual zombies no longer on-chain
      const confirmed = prev.filter(vz => walletZombies.some(wz => wz.objectId === vz.id));
      
      // 2. Add new on-chain zombies to visual state
      const existingIds = confirmed.map(z => z.id);
      const newZombies: Zombie[] = walletZombies
        .filter(wz => !existingIds.includes(wz.objectId))
        .map(wz => {
          const seed = wz.objectId.slice(-4);
          const nameHash = parseInt(seed, 16) || 0;
          return {
            id: wz.objectId,
            type: wz.threatTier === 'big' ? 'Big' : 'Small',
            name: wz.threatTier === 'big' ? 'TYRANT' : ['LICKER', 'STALKER', 'PUNISHER'][nameHash % 3],
            health: wz.hp,
            threatLevel: wz.threatTier === 'big' ? 10 : wz.speedTier,
            distance: 95, // Start at max distance
            xOffset: (nameHash % 60) - 30,
            variant: nameHash % 3,
            isDead: false,
          };
        });

      if (newZombies.length > 0) {
        addLog(`BIO-SIG DETECTED: ${newZombies[0].name} ENGAGING PERIMETER`);
      }

      // 3. Update health of existing zombies from chain
      return [...confirmed.map(vz => {
        const wz = walletZombies.find(w => w.objectId === vz.id);
        if (wz) vz.health = wz.hp;
        return vz;
      }), ...newZombies];
    });
  }, [walletZombies, addLog]);

  // ── Distance Approach Interval (Client-Side Feel) ───────────────────────────
  useEffect(() => {
    if (!gameStarted || visualZombies.length === 0) return;

    const moveInterval = setInterval(() => {
      setVisualZombies(prev => {
        return prev.map(z => {
          if (z.isDead) return z;
          // Slowly approach: Big is slow, small is faster
          const speed = z.type === 'Big' ? 0.08 : 0.15;
          const newDist = Math.max(0, z.distance - speed);
          const isNowAttacking = newDist < 8;

          // If they reach hit range, trigger warning
          if (isNowAttacking && !z.isAttacking) {
             setIsWarning(true);
             setTimeout(() => setIsWarning(false), 2000);
          }
          
          return { ...z, distance: newDist, isAttacking: isNowAttacking };
        });
      });
    }, 100);

    return () => clearInterval(moveInterval);
  }, [gameStarted, visualZombies.length]);

  // ── Real Action Handlers ────────────────────────────────────────────────────
  const handleShoot = useCallback(async () => {
    if (!gameStarted || !hunterId || isReloading) return;
    
    // Find nearest target in HUD focus
    const target = visualZombiesRef.current
      .filter(z => !z.isDead)
      .sort((a, b) => a.distance - b.distance)[0];

    if (!target) {
      addLog("NO TARGET IN RANGE");
      return;
    }

    // Ammo Check
    const ammoCount = walletInventory.ammo.length;
    if (ammoCount === 0) {
      addLog("OUT OF AMMO! RELOAD REQUIRED");
      return;
    }

    // UI Effects
    setMuzzleFlash(true);
    setTimeout(() => setMuzzleFlash(false), 60);
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 300);

    addLog(`INIT SCAN-ENGAGEMENT: ${target.name}`);
    
    try {
      if (!sessionKeyId) {
        addLog("ESTABLISHING ONE-CLICK SESSION...");
        await createOrRefreshSession(600);
      }
      
      // CALL REAL BLOCKCHAIN BATTLE!
      await attackSmall(target.id);
      addLog(`ON-CHAIN CONFIRMED: ${target.name} HIT!`);
    } catch (err) {
      addLog(`ERROR: ${err instanceof Error ? err.message : "TRANSACTION FAILED"}`);
    }
  }, [gameStarted, hunterId, isReloading, walletInventory.ammo.length, sessionKeyId, createOrRefreshSession, attackSmall, addLog]);

  const handleScan = useCallback(async () => {
    if (!gameStarted || !connected) return;
    addLog("SCANNING SECTOR FOR BIO-SIGS...");
    try {
      if (!sessionKeyId) await createOrRefreshSession(600);
      await spawnZombie();
      addLog("NEW CONTACT CONFIRMED — ENGAGE!");
    } catch (err) {
      addLog("SCAN ERROR: SIGNAL INTERFERENCE");
    }
  }, [gameStarted, connected, sessionKeyId, createOrRefreshSession, spawnZombie, addLog]);

  const handleReload = useCallback(() => {
    if (isReloading || !gameStarted) return;
    setIsReloading(true);
    setReloadProgress(0);
    addLog("SYNCHRONIZING AMMO STORES...");
    
    const start = Date.now();
    const tick = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / 1500) * 100);
      setReloadProgress(pct);
      if (pct >= 100) {
        clearInterval(tick);
        setIsReloading(false);
        setReloadProgress(0);
        addLog("AMMO CACHE SECURED.");
      }
    }, 50);
  }, [isReloading, gameStarted, addLog]);

  const handleUseItem = useCallback(async (itemId: string, type: string) => {
    if (type === 'herb') {
      addLog("PURIFYING VIRUS: CONSUMING GREEN HERB...");
      try {
        await consumeHerb(itemId);
        addLog("BIO-SIGNALS STABILIZED.");
      } catch (err) {
        addLog(`HEAL FAILED: ${err instanceof Error ? err.message : "UNABLE TO PROCESS"}`);
      }
    }
  }, [consumeHerb, addLog]);

  // ── Keyboard Controls ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameStarted) return;
    const down = (e: KeyboardEvent) => {
       if (e.code === 'Space' || e.key === 'f') handleShoot();
       if (e.key === 'r') handleReload();
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [gameStarted, handleShoot, handleReload]);

  // ── Game Data Objects ───────────────────────────────────────────────────────
  const stats: PlayerStats = {
     // HP is fetched from the hunter object in WalletContext (or mocked if not found)
     hp: 100 - (infectionRate / 100), // Real calculation: 100% - scaled infection
     maxHp: 100,
     infectionLevel: infectionRate,
     kills: walletZombies.filter(z => z.hp === 0).length, // Real on-chain kills logic
     ammo: walletInventory.ammo.length,
     fragments: walletInventory.fragments.length,
     archetype: selectedArchetype,
     oneId: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "NOT_AUTHENTICATED",
     isDead: (100 - (infectionRate / 100)) <= 0
  };

  const city: CityState = {
    infectionRate: (infectionRate / 100),
    totalSurvivors: 8421 - (infectionRate / 10),
    activeRaids: raidState.participants.length
  };

  const visibleItems = [
    ...walletInventory.herbs.map(h => ({ id: h.objectId, name: "GREEN HERB", type: "herb" as const, count: 1 })),
    ...walletInventory.ammo.slice(0, 1).map(a => ({ id: a.objectId, name: "SHOTGUN SHELLS", type: "ammo" as const, count: walletInventory.ammo.length })),
    ...walletInventory.fragments.map(f => ({ id: f.objectId, name: "VACCINE FRAGMENT", type: "fragment" as const, count: 1 }))
  ];

  // ── Archetype Entry ──────────────────────────────────────────────────────────
  const handleSelectArchetype = async (classId: number) => {
    const map: Record<number, Archetype> = {
      0: Archetype.POINTMAN,
      1: Archetype.MEDIC,
      2: Archetype.SHARPSHOOTER,
    };
    setSelectedArchetype(map[classId]);
    setGameStarted(true); // Immediate entry logic remains for premium feel
    setIsInitializing(true);
    addLog(`INIT HUNTER REGISTRATION: ${map[classId].toUpperCase()}...`);
    try {
      await createHunter(classId);
      addLog("ON-CHAIN PROFILE ESTABLISHED ✅");
    } catch (err) {
      addLog("REBOOTING PROFILE FROM EXISTING CACHE...");
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <motion.div
      animate={screenShake ? { x: [-8, 8, -8, 8, 0], y: [-4, 4, -4, 4, 0] } : { x: 0, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`relative w-screen h-screen bg-black overflow-hidden select-none cursor-crosshair ${damageFlash ? 'brightness-150' : ''}`}
      onMouseMove={e => setMousePos({ x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 })}
      onClick={e => {
        if (!gameStarted || stats.isDead) return;
        if ((e.target as HTMLElement).closest('button')) return;
        handleShoot();
      }}
    >
      <div className="scanline pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none crt-flicker bg-hud-blue/5 z-40" />

      {/* ── Landing Screen ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!connected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black z-300 flex flex-col items-center justify-center p-8 text-center">
            <h1 className="text-6xl font-black text-white mb-2 uppercase italic tracking-tighter glitch-text">Resident System</h1>
            <p className="text-hud-blue/60 text-sm uppercase tracking-widest mb-8">Outbreak Live Monitor • OneChain Mesh</p>
            <ConnectButton />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Archetype Screen ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {connected && !hunterId && !gameStarted && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/90 z-250 flex flex-col items-center justify-center p-8">
             <div className="hud-border bg-hud-bg p-8 max-w-lg w-full text-center">
                <h2 className="text-3xl font-bold text-white mb-8 uppercase">Select Archetype</h2>
                <div className="grid grid-cols-1 gap-4">
                   <button onClick={() => handleSelectArchetype(0)} className="hud-border border-hud-blue p-4 hover:bg-hud-blue/10 text-hud-blue uppercase font-bold">Pointman (Tank)</button>
                   <button onClick={() => handleSelectArchetype(1)} className="hud-border border-green-500 p-4 hover:bg-green-500/10 text-green-500 uppercase font-bold">Medic (Healer)</button>
                   <button onClick={() => handleSelectArchetype(2)} className="hud-border border-red-500 p-4 hover:bg-red-500/10 text-red-500 uppercase font-bold">Sharpshooter (DPS)</button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TACTICAL INTERFACE (REAL DATA) ───────────────────────────────────── */}
      {connected && (gameStarted || hunterId) && (
        <>
          <HUD stats={stats} isWarning={isWarning} onSwitchArchetype={() => {}} />
          <CombatOverlay zombies={visualZombies} />
          <Scanner zombies={visualZombies} mousePos={mousePos} />
          <Inventory items={visibleItems} onUseItem={(id) => handleUseItem(id, 'herb')} />
          <CityStatus state={city} />

          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[420px] flex flex-col gap-3 items-center z-50">
             <div className="hud-border bg-hud-bg p-3 rounded-sm w-full font-mono text-[10px] space-y-1 backdrop-blur-md">
                <div className="flex items-center justify-between mb-1">
                   <div className="flex items-center gap-2 text-hud-blue">
                      <Terminal className="w-3 h-3" />
                      <span>Bio-Data Interface</span>
                   </div>
                   <button onClick={handleScan} className="text-[9px] border border-hud-blue/40 px-2 hover:bg-hud-blue/20 text-hud-blue uppercase">Scan Sector [S]</button>
                </div>
                {logs.map((log, i) => (
                   <div key={i} className={i === logs.length - 1 ? 'text-hud-blue animate-pulse' : 'text-hud-blue/40'}>{log}</div>
                ))}
             </div>

             <div className="flex gap-6 items-center">
                <motion.button onClick={handleReload} disabled={isReloading} className="relative w-20 h-20 rounded-full border-4 border-yellow-500/30 flex items-center justify-center overflow-hidden">
                   {isReloading && (
                      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="36" fill="none" stroke="rgb(234,179,8)" strokeWidth="4" strokeDasharray="226" strokeDashoffset={`${226 * (1 - reloadProgress / 100)}`} />
                      </svg>
                   )}
                   <span className="text-[10px] font-bold uppercase text-yellow-500">{isReloading ? "LOADING" : "RELOAD"}</span>
                </motion.button>

                <motion.button whileTap={{ scale: 0.9 }} onClick={handleShoot} className="w-24 h-24 rounded-full border-4 border-hud-blue bg-hud-blue/10 flex items-center justify-center">
                   <span className="text-xl font-black text-hud-blue">FIRE</span>
                </motion.button>
             </div>
          </div>
        </>
      )}

      {/* ── Death Screen ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {stats.isDead && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-red-950/90 z-400 flex flex-col items-center justify-center text-center">
             <h2 className="text-7xl font-black text-red-500 glitch-text">MUTATION COMPLETE</h2>
             <p className="text-white tracking-[0.5em] mb-12">SECTOR OVERRUN</p>
             <button onClick={() => window.location.reload()} className="hud-border border-white p-6 px-12 text-white font-bold hover:bg-white hover:text-black transition-all">REBOOT SYSTEM</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed top-6 right-6 z-50 text-[10px] text-hud-blue/50 font-mono">
         ONECHAIN TESTNET :: {ONECHAIN_RPC}
      </div>
    </motion.div>
  );
}
