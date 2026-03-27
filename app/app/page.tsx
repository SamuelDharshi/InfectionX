"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
    attackSmall, 
    consumeHerb, 
    infectionRate,
    raidState,
    isHunterCheckPending,
    error: walletError
  } = useWallet();

  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [logs, setLogs] = useState<string[]>([
    "PERIMETER SECURED. SCANNING...",
    "SYSTEM STATUS: NOMINAL"
  ]);

  const [screenShake, setScreenShake] = useState(false);
  const [muzzleFlash, setMuzzleFlash] = useState(false);
  const [damageFlash] = useState(false);
  const [isWarning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSessionCreating, setIsSessionCreating] = useState(false);

  // Local visual state for zombies to maintain positions/animations
  const [visualZombies, setVisualZombies] = useState<Zombie[]>([]);

  // Sync wallet zombies with visual zombies
  useEffect(() => {
    if (!walletZombies) return;

    setVisualZombies(prev => {
      // Create a map of existing visual zombies for easier lookup
      const prevMap = new Map(prev.map(z => [z.id, z]));
      
      return walletZombies.map(wz => {
        const existing = prevMap.get(wz.objectId);
        if (existing) {
          // Update HP and other dynamic stats, keep position
          return {
            ...existing,
            health: wz.hp,
            type: wz.threatTier === 'big' ? 'Big' : 'Small',
          };
        } else {
          // New zombie detected - generate random position seeded by objectId
          const seed = wz.objectId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const xOffset = ((seed % 80) - 40);
          const distance = 40 + (seed % 40);
          
          return {
            id: wz.objectId,
            type: wz.threatTier === 'big' ? 'Big' : 'Small',
            name: wz.threatTier === 'big' ? 'The Tyrant' : 'Viral Infected',
            health: wz.hp,
            threatLevel: wz.threatTier === 'big' ? 10 : wz.speedTier + 2,
            distance,
            xOffset,
            variant: seed % 3,
            isDead: wz.hp <= 0
          };
        }
      });
    });
  }, [walletZombies]);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev.slice(-10), `> ${msg}`]);
  }, []);

  // Monitor for wallet errors
  useEffect(() => {
    if (walletError) {
      addLog(`SYSTEM ERROR: ${walletError.toUpperCase()}`);
    }
  }, [walletError, addLog]);

  // Lifecycle logging
  useEffect(() => {
    if (connected) {
      addLog(`WALK-ID CONNECTED: ${address?.slice(0, 10)}...`);
    } else {
      addLog("WALK-ID DISCONNECTED");
    }
  }, [connected, address, addLog]);

  useEffect(() => {
    if (hunterId) {
      addLog(`HUNTER PROFILE DETECTED: [${hunterId.slice(0, 8)}...]`);
      addLog("ENTERING TACTICAL INTERFACE...");
    } else if (connected) {
      addLog("NO HUNTER PROFILE FOUND. REGISTRATION REQUIRED.");
    }
  }, [hunterId, connected, addLog]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    setMousePos({ x, y });
  };

  const triggerScreenShake = (isHeavy = false) => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), isHeavy ? 600 : 300);
  };

  const triggerMuzzleFlash = () => {
    setMuzzleFlash(true);
    setTimeout(() => setMuzzleFlash(false), 50);
  };

  const handleShoot = useCallback(async () => {
    if (!connected || !hunterId || !sessionKeyId) {
      if (!sessionKeyId && connected) addLog("ERROR: NO SESSION KEY ACTIVE");
      return;
    }

    if (walletInventory.ammo.length === 0) {
      addLog("ERROR: OUT OF AMMO - RELOAD REQUIRED");
      return;
    }

    // Find closest zombie near cursor
    const target = visualZombies.find(z => {
      if (z.isDead) return false;
      const zLeft = 50 + z.xOffset;
      const zTop = 45 + (z.distance * 0.4);
      const dx = mousePos.x - zLeft;
      const dy = mousePos.y - zTop;
      return Math.sqrt(dx * dx + dy * dy) < 10;
    });

    triggerMuzzleFlash();
    triggerScreenShake();
    
    if (target) {
      addLog(`ENGAGING TARGET: ${target.name}`);
      // Mark as hit locally for immediate feedback
      setVisualZombies(prev => prev.map(z => z.id === target.id ? { ...z, isHit: true } : z));
      setTimeout(() => {
        setVisualZombies(prev => prev.map(z => z.id === target.id ? { ...z, isHit: false } : z));
      }, 200);

      try {
        await attackSmall(target.id);
        addLog(`HIT CONFIRMED: ${target.id.slice(0, 8)}...`);
      } catch (err) {
        addLog(`ERROR: ATTACK FAILED - ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } else {
      addLog("MISS: NO TARGET AT COORDINATES");
    }
  }, [connected, hunterId, sessionKeyId, walletInventory.ammo.length, visualZombies, mousePos.x, mousePos.y, addLog, attackSmall]);

  // Keyboard shortcut: Press Space or F to shoot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f' || e.code === 'Space') {
        void handleShoot();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleShoot]);

  const handleUseItem = async (itemId: string) => {
    const item = walletInventory.herbs.find(h => h.objectId === itemId) || 
                 walletInventory.ammo.find(a => a.objectId === itemId) ||
                 walletInventory.fragments.find(f => f.objectId === itemId);
    
    if (!item) return;

    if (walletInventory.herbs.some(h => h.objectId === itemId)) {
      addLog("USING GREEN HERB... STAND BY");
      await consumeHerb(itemId);
      addLog("BIO-SIGNATURE STABILIZED: +HP");
    } else {
      addLog("ITEM CANNOT BE USED DIRECTLY FROM HUD");
    }
  };

  const handleCreateHunter = async (classId: number) => {
    setIsInitializing(true);
    addLog(`INITIATING HUNTER REGISTRATION: ARCHETYPE_${classId}`);
    try {
      await createHunter(classId);
      // hunterId should update automatically via context, re-rendering this component
    } catch (err) {
      addLog(`REGISTRATION FAILED: ${err instanceof Error ? err.message : 'UNKNOWN ERROR'}`);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCreateSession = async () => {
    setIsSessionCreating(true);
    try {
      await createOrRefreshSession(600);
      addLog("ON-CHAIN SESSION ESTABLISHED");
    } finally {
      setIsSessionCreating(false);
    }
  };

  // Convert wallet state to UI props
  const stats: PlayerStats = {
    hp: 100 - (infectionRate / 2), // Mock HP logic based on infection
    maxHp: 100,
    infectionLevel: infectionRate,
    kills: 0, // Need to track this or get it from somewhere
    ammo: walletInventory.ammo.length,
    fragments: walletInventory.fragments.length,
    archetype: Archetype.POINTMAN, // Default or fetch from hunter object
    oneId: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "NOT_AUTHENTICATED",
    isDead: (100 - (infectionRate / 2)) <= 0
  };

  const items: GameItem[] = [
    { id: 'herbs-grp', name: 'Green Herb', type: 'herb' as const, count: walletInventory.herbs.length },
    { id: 'ammo-grp', name: 'Ammo Pack', type: 'ammo' as const, count: walletInventory.ammo.length },
    { id: 'frag-grp', name: 'Vaccine Fragment', type: 'fragment' as const, count: walletInventory.fragments.length },
  ].filter(i => i.count > 0);

  const city: CityState = {
    infectionRate: infectionRate,
    totalSurvivors: 8421 - Math.floor(infectionRate * 10),
    activeRaids: raidState.participants.length
  };

  return (
    <motion.div 
      animate={screenShake ? { x: [-10, 10, -10, 10, 0], y: [-5, 5, -5, 5, 0] } : {}}
      className={`relative w-screen h-screen bg-black overflow-hidden select-none cursor-none ${stats.hp < 40 ? 'distortion-effect' : ''}`}
      onMouseMove={handleMouseMove}
      onClick={(e) => {
        if (!connected || stats.isDead) return;
        if ((e.target as HTMLElement).closest('button')) return;
        void handleShoot();
      }}
    >
      {/* Wallet Connection Overlay */}
      <AnimatePresence>
        {!connected && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-300 flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/cyberpunk/1920/1080')] bg-cover bg-center opacity-20 grayscale" />
            <div className="absolute inset-0 bg-black/60" />
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="hud-border bg-hud-bg p-12 rounded-sm max-w-lg relative z-10 backdrop-blur-xl"
            >
              <div className="w-20 h-20 border-2 border-hud-blue rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <ShieldAlert className="w-10 h-10 text-hud-blue" />
              </div>
              <h1 className="text-5xl font-black text-white mb-2 uppercase italic tracking-tighter glitch-text">Resident System</h1>
              <p className="text-hud-blue/60 text-sm uppercase tracking-widest mb-8">Survive the Outbreak. Purify the Virus.</p>
              
              <div className="space-y-4 mb-8 text-left border-l-2 border-hud-blue/20 pl-6">
                <div className="text-[10px] uppercase opacity-50">Mission Briefing</div>
                <p className="text-xs leading-relaxed opacity-80 text-hud-blue/80">
                  The city has fallen. Bio-signatures are approaching your perimeter. 
                  Connect your OneWallet to authenticate your OneID and begin the purification protocol.
                </p>
              </div>

              <div className="w-full flex justify-center">
                 <ConnectButton />
              </div>
              
              <div className="mt-6 flex items-center justify-center gap-4 opacity-30">
                <div className="text-[8px] uppercase tracking-widest text-hud-blue">OneChain Ecosystem</div>
                <div className="w-1 h-1 bg-hud-blue rounded-full" />
                <div className="text-[8px] uppercase tracking-widest text-hud-blue">OneID Protocol</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hunter Registration / Loading Overlay */}
      <AnimatePresence>
        {connected && !hunterId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 z-250 flex flex-col items-center justify-center p-8 backdrop-blur-md"
          >
            {isHunterCheckPending ? (
              <div className="flex flex-col items-center gap-6">
                <div className="w-20 h-20 border-4 border-hud-blue/20 border-t-hud-blue rounded-full animate-spin" />
                <div className="text-hud-blue font-black uppercase tracking-[0.4em] animate-pulse">Scanning Bio-Grid...</div>
                <div className="text-[10px] text-hud-blue/40 uppercase">Authenticating Class Signatures</div>
              </div>
            ) : (
              <div className="hud-border bg-hud-bg p-8 rounded-sm max-w-4xl w-full">
                <h1 className="text-4xl font-black text-white mb-2 uppercase text-center glitch-text">Initialize Hunter Profile</h1>
                <p className="text-hud-blue/60 text-center uppercase tracking-widest mb-12">Select your Officer Archetype</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button onClick={() => handleCreateHunter(0)} disabled={isInitializing} className="hud-border bg-hud-bg/40 p-6 hover:bg-hud-blue/10 transition-all text-left group">
                    <div className="text-hud-blue mb-4 group-hover:scale-110 transition-transform">
                       <Zap className="w-10 h-10" />
                    </div>
                    <div className="text-xl font-bold text-white uppercase mb-2">Pointman</div>
                    <p className="text-[10px] text-hud-blue/60 uppercase">High Vitality. Tank Swarm encounters.</p>
                  </button>
                  <button onClick={() => handleCreateHunter(1)} disabled={isInitializing} className="hud-border bg-hud-bg/40 p-6 hover:bg-hud-blue/10 transition-all text-left group">
                    <div className="text-hud-blue mb-4 group-hover:scale-110 transition-transform">
                       <Terminal className="w-10 h-10" />
                    </div>
                    <div className="text-xl font-bold text-white uppercase mb-2">Medic</div>
                    <p className="text-[10px] text-hud-blue/60 uppercase">Virus Treatments Specialist.</p>
                  </button>
                  <button onClick={() => handleCreateHunter(2)} disabled={isInitializing} className="hud-border bg-hud-bg/40 p-6 hover:bg-hud-blue/10 transition-all text-left group">
                    <div className="text-hud-blue mb-4 group-hover:scale-110 transition-transform">
                       <ShieldAlert className="w-10 h-10" />
                    </div>
                    <div className="text-xl font-bold text-white uppercase mb-2">Sharpshooter</div>
                    <p className="text-[10px] text-hud-blue/60 uppercase">Critical Hit Precision.</p>
                  </button>
                </div>

                {isInitializing && (
                  <div className="mt-8 text-center text-hud-blue animate-pulse uppercase tracking-widest text-xs">
                    Transmitting Registration Protocol...
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Key Overlay */}
      <AnimatePresence>
        {connected && hunterId && !sessionKeyId && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-100 flex flex-col items-center gap-4"
          >
            <div className="bg-red-500/20 border border-red-500 p-4 text-center backdrop-blur-md shadow-[0_0_20px_rgba(255,0,0,0.3)]">
               <div className="text-red-500 font-bold tracking-widest mb-1 animate-pulse uppercase text-xs">No-Click Session Offline</div>
               <div className="text-[8px] text-red-500/80 uppercase">Enable session for smooth combat processing</div>
            </div>
            <motion.button 
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={handleCreateSession}
               disabled={isSessionCreating}
               className="bg-red-500 text-black px-8 py-2 font-black tracking-widest text-xs hover:bg-white transition-all shadow-[0_0_15px_rgba(255,0,0,0.5)] uppercase"
            >
                {isSessionCreating ? "Establishing..." : "Establish Session (10 Mins)"}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Low HP Red Vignette */}
      {stats.hp < 40 && <div className="vignette-red" />}

      {/* Muzzle Flash Overlay */}
      <AnimatePresence>
        {muzzleFlash && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white pointer-events-none z-110"
          />
        )}
      </AnimatePresence>

      {/* CRT Effects */}
      <div className="scanline" />
      <div className="absolute inset-0 pointer-events-none crt-flicker bg-hud-blue/5 z-40" />

      {/* Main Game Components */}
      {connected && hunterId && (
        <>
          <HUD stats={stats} isWarning={isWarning} onSwitchArchetype={() => {}} />
          <CombatOverlay zombies={visualZombies} />
          <Scanner zombies={visualZombies} mousePos={mousePos} />
          <Inventory items={items} onUseItem={handleUseItem} />
          <CityStatus state={city} />
        </>
      )}

      {/* Bottom Center: Action & Logs */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[400px] flex flex-col gap-4 items-center z-50">
        <div className="hud-border bg-hud-bg p-3 rounded-sm w-full font-mono text-[10px] space-y-1 backdrop-blur-md">
          <div className="flex items-center gap-2 opacity-50 mb-1 text-hud-blue">
            <Terminal className="w-3 h-3" />
            <span>Session Logs</span>
          </div>
          {logs.map((log, i) => (
            <div key={i} className={i === logs.length - 1 ? 'text-hud-blue animate-pulse' : 'text-hud-blue/40'}>
              {log}
            </div>
          ))}
        </div>

        <div className="flex gap-4 items-center">
          <motion.button 
            whileHover={{ scale: 1.05, borderColor: '#00f2ff' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShoot}
            className="w-24 h-24 rounded-full border-4 border-hud-blue/30 bg-hud-blue/5 flex items-center justify-center group transition-all cursor-none pointer-events-auto"
          >
            <div className="w-16 h-16 rounded-full border border-hud-blue/50 flex items-center justify-center group-hover:bg-hud-blue/20">
              <span className="text-xs font-bold uppercase tracking-widest text-hud-blue">Fire</span>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Death State Overlay */}
      <AnimatePresence>
        {stats.isDead && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/90 z-400 flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="hud-border bg-hud-bg p-12 rounded-sm max-w-md backdrop-blur-xl"
            >
              <ShieldAlert className="w-24 h-24 text-red-500 mx-auto mb-6" />
              <h2 className="text-6xl font-black text-red-500 mb-2 uppercase italic tracking-tighter glitch-text">System Offline</h2>
              <p className="text-hud-blue/60 text-sm uppercase tracking-widest mb-8">Vital signs terminated. Sector lost.</p>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-hud-blue text-black font-black uppercase tracking-[0.2em] hover:bg-white transition-colors"
              >
                Reboot System
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Corner Accents */}
      <div className="fixed top-0 left-0 w-32 h-32 border-t border-l border-hud-blue/20 pointer-events-none z-50" />
      <div className="fixed top-0 right-0 w-32 h-32 border-t border-r border-hud-blue/20 pointer-events-none z-50" />
      <div className="fixed bottom-0 left-0 w-32 h-32 border-b border-l border-hud-blue/20 pointer-events-none z-50" />
      <div className="fixed bottom-0 right-0 w-32 h-32 border-b border-r border-hud-blue/20 pointer-events-none z-50" />
    </motion.div>
  );
}
