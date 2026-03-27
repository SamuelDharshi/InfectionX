/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HUD } from './components/HUD';
import { Scanner } from './components/Scanner';
import { Inventory } from './components/Inventory';
import { CityStatus } from './components/CityStatus';
import { CombatOverlay } from './components/CombatOverlay';
import { Archetype, PlayerStats, Zombie, GameItem, CityState } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Terminal } from 'lucide-react';

export default function App() {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [stats, setStats] = useState<PlayerStats>({
    hp: 85,
    maxHp: 100,
    infectionLevel: 12.4,
    kills: 142,
    ammo: 24,
    fragments: 2,
    archetype: Archetype.SHARPSHOOTER,
    oneId: "0x7a2...f4e1.oneid",
    isDead: false
  });

  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);

  const [zombies, setZombies] = useState<Zombie[]>([
    { id: 'z-1', type: 'Small', name: 'Viral Sprinter', health: 45, threatLevel: 4, distance: 55, xOffset: -25 },
    { id: 'z-2', type: 'Small', name: 'Fast Crawler', health: 80, threatLevel: 7, distance: 45, xOffset: -5 },
    { id: 'z-3', type: 'Big', name: 'The Goliath', health: 100, threatLevel: 10, distance: 60, xOffset: 20 },
    { id: 'z-4', type: 'Small', name: 'Viral Sprinter', health: 60, threatLevel: 5, distance: 50, xOffset: 35 },
    { id: 'z-5', type: 'Small', name: 'Fast Crawler', health: 70, threatLevel: 6, distance: 40, xOffset: 10 },
  ]);

  const [items, setItems] = useState<GameItem[]>([
    { id: 'i-1', name: 'Green Herb', type: 'herb', count: 3 },
    { id: 'i-2', name: 'Shotgun Shells', type: 'ammo', count: 12 },
    { id: 'i-3', name: 'Vaccine Fragment', type: 'fragment', count: 2 },
    { id: 'i-4', name: 'Riot Shield', type: 'ammo', count: 1 },
  ]);

  const [city, setCity] = useState<CityState>({
    infectionRate: 72.15,
    totalSurvivors: 8421,
    activeRaids: 28
  });

  const [logs, setLogs] = useState<string[]>([
    "PERIMETER SECURED. SCANNING...",
    "ONEID AUTHENTICATED: 0x7a2...f4e1",
    "LONG-RANGE TARGETS DETECTED",
    "SYSTEM STATUS: NOMINAL"
  ]);

  const [screenShake, setScreenShake] = useState(false);
  const [muzzleFlash, setMuzzleFlash] = useState(false);
  const [damageFlash, setDamageFlash] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Simulate game loop
  useEffect(() => {
    if (stats.isDead) return;

    const interval = setInterval(() => {
      setZombies(prev => prev.map(z => ({
        ...z,
        health: Math.max(0, z.health - (Math.random() > 0.98 ? 1 : 0)),
        distance: Math.max(5, z.distance - (Math.random() * 0.2 + 0.05))
      })));

      setStats(prev => {
        let newHp = prev.hp;
        let newInfection = prev.infectionLevel + 0.01;
        
        // Small zombie attacks (Frequent, low damage)
        const smallZombiesInRange = zombies.filter(z => z.type === 'Small' && z.distance < 10 && !z.isDead && !z.isAttacking);
        if (smallZombiesInRange.length > 0 && Math.random() > 0.8) {
          const attackerId = smallZombiesInRange[0].id;
          
          // Wind-up phase
          setZombies(prevZ => prevZ.map(z => z.id === attackerId ? { ...z, isAttacking: true } : z));
          setIsWarning(true);
          
          // Damage phase after wind-up
          setTimeout(() => {
            setStats(curr => {
              const damage = 2;
              setDamageFlash(true);
              setTimeout(() => setDamageFlash(false), 100);
              triggerScreenShake();
              addLog("WARNING: MINOR BIO-SIGNATURE BREACH (-2 HP)");
              return { ...curr, hp: Math.max(0, curr.hp - damage) };
            });
            setIsWarning(false);
            setZombies(prevZ => prevZ.map(z => z.id === attackerId ? { ...z, isAttacking: false } : z));
          }, 600);
        }

        // Big zombie attacks (Infrequent, high damage)
        const bigZombiesInRange = zombies.filter(z => z.type === 'Big' && z.distance < 12 && !z.isDead && !z.isAttacking);
        if (bigZombiesInRange.length > 0 && Math.random() > 0.95) {
          const attackerId = bigZombiesInRange[0].id;
          
          // Wind-up phase
          setZombies(prevZ => prevZ.map(z => z.id === attackerId ? { ...z, isAttacking: true } : z));
          setIsWarning(true);
          
          // Damage phase after wind-up
          setTimeout(() => {
            setStats(curr => {
              const damage = 15;
              setDamageFlash(true);
              setTimeout(() => setDamageFlash(false), 200);
              triggerScreenShake(true); // Enhanced shake
              addLog("CRITICAL: MAJOR BIO-SIGNATURE BREACH (-15 HP)");
              return { ...curr, hp: Math.max(0, curr.hp - damage) };
            });
            setIsWarning(false);
            setZombies(prevZ => prevZ.map(z => z.id === attackerId ? { ...z, isAttacking: false } : z));
          }, 1000);
        }

        if (newHp <= 0 && !prev.isDead) {
          addLog("SYSTEM FAILURE: VITAL SIGNS LOST");
          return { ...prev, hp: 0, isDead: true };
        }

        return { ...prev, hp: newHp, infectionLevel: newInfection };
      });

      setCity(prev => ({
        ...prev,
        infectionRate: Math.min(100, prev.infectionRate + 0.005),
        totalSurvivors: Math.max(0, prev.totalSurvivors - (zombies.length > 8 ? 1 : 0))
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [zombies, stats.isDead]);

  // Random Spawning Logic
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      setZombies(prev => {
        if (prev.length >= 12) return prev; // Increased max zombies to 12

        const newX = (Math.random() * 80) - 40; 
        const newDist = 55 + (Math.random() * 25); // Random distance between 55 and 80

        // Proximity check: existing zombies
        const isTooCloseToZombies = prev.some(z => {
          const dx = z.xOffset - newX;
          const dy = z.distance - newDist;
          return Math.sqrt(dx * dx + dy * dy) < 10; // Increased buffer to 10
        });

        // Proximity check: player (at distance 0, xOffset 0)
        const isTooCloseToPlayer = newDist < 20;

        if (isTooCloseToZombies || isTooCloseToPlayer) return prev;

        const names = ['Viral Sprinter', 'Fast Crawler', 'Lurking Shadow', 'Bio-Hulk', 'Infected Guard', 'Stalker', 'Shambler'];
        const isBig = Math.random() > 0.90; // Slightly rarer big zombies to favor small ones

        const newZombie: Zombie = {
          id: `z-spawn-${Math.floor(Math.random() * 10000)}`,
          type: isBig ? 'Big' : 'Small',
          variant: isBig ? 0 : Math.floor(Math.random() * 3), // 3 variants for small
          name: isBig ? 'The Goliath' : names[Math.floor(Math.random() * names.length)],
          health: isBig ? 150 : 100,
          threatLevel: isBig ? 10 : Math.floor(Math.random() * 4) + 3,
          distance: newDist,
          xOffset: newX
        };

        addLog(`NEW ${newZombie.type.toUpperCase()} SIGNATURE DETECTED`);
        return [...prev, newZombie];
      });
    }, 3000); // Increased spawn rate (every 3 seconds)

    return () => clearInterval(spawnInterval);
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-4), `> ${msg}`]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    setMousePos({ x, y });
  };

  const simulateTx = (action: string) => {
    setTxStatus('pending');
    setTxHash(`0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`);
    
    setTimeout(() => {
      setTxStatus('success');
      setTimeout(() => setTxStatus('idle'), 2000);
    }, 800);
  };

  const handleReload = () => {
    if (stats.ammo < 24) {
      simulateTx("RELOAD_WEAPON");
      addLog("RELOADING SYSTEM... STAND BY");
      setTimeout(() => {
        setStats(prev => ({ ...prev, ammo: 24 }));
        addLog("RELOAD COMPLETE: SHELLS LOADED");
      }, 1500);
    }
  };

  const triggerScreenShake = (isHeavy = false) => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), isHeavy ? 600 : 300);
  };

  const triggerMuzzleFlash = () => {
    setMuzzleFlash(true);
    setTimeout(() => setMuzzleFlash(false), 50);
  };

  const handleUseItem = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item || item.count <= 0) return;

    if (item.type === 'herb') {
      simulateTx("USE_HERB");
      setStats(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + 30) }));
      addLog(`USED ${item.name.toUpperCase()}: +30 HP`);
    } else if (item.type === 'ammo') {
      simulateTx("USE_AMMO_PACK");
      setStats(prev => ({ ...prev, ammo: prev.ammo + 12 }));
      addLog(`USED ${item.name.toUpperCase()}: +12 SHELLS`);
    } else if (item.type === 'fragment') {
      addLog("VACCINE FRAGMENTS MUST BE SYNTHESIZED AT THE LAB");
      return;
    } else {
      addLog(`ERROR: ${item.name.toUpperCase()} CANNOT BE USED NOW`);
      return;
    }

    setItems(prev => prev.map(i => i.id === itemId ? { ...i, count: i.count - 1 } : i));
  };

  const handleSwitchArchetype = (type: Archetype) => {
    if (stats.archetype === type) return;
    
    setStats(prev => ({
      ...prev,
      archetype: type,
      maxHp: type === Archetype.MEDIC ? 120 : 100,
      hp: Math.min(prev.hp, type === Archetype.MEDIC ? 120 : 100)
    }));
    
    addLog(`ARCHETYPE SWITCHED: ${type.toUpperCase()}`);
  };

  const handleRestart = () => {
    setStats({
      hp: 100,
      maxHp: 100,
      infectionLevel: 0,
      kills: 0,
      ammo: 24,
      fragments: 0,
      archetype: Archetype.SHARPSHOOTER,
      oneId: "0x7a2...f4e1.oneid",
      isDead: false
    });
    setZombies([
      { id: 'z-1', type: 'Small', name: 'Viral Sprinter', health: 45, threatLevel: 4, distance: 55, xOffset: -25 },
      { id: 'z-2', type: 'Small', name: 'Fast Crawler', health: 80, threatLevel: 7, distance: 45, xOffset: -5 },
      { id: 'z-3', type: 'Big', name: 'The Goliath', health: 100, threatLevel: 10, distance: 60, xOffset: 20 },
    ]);
    addLog("SYSTEM REBOOTED. PERIMETER SCANNING...");
  };

  const handleConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnected(true);
      setIsConnecting(false);
      addLog("ONEWALLET CONNECTED: 0x7a2...f4e1");
    }, 1500);
  };

  const handleShoot = () => {
    if (stats.isDead) return;
    if (stats.ammo > 0) {
      simulateTx("FIRE_WEAPON");
      triggerMuzzleFlash();
      setStats(prev => ({ ...prev, ammo: prev.ammo - 1 }));
      
      // Find a zombie near the mouse position
      const targetIndex = zombies.findIndex(z => {
        const zLeft = 50 + z.xOffset;
        const zTop = 45 + (z.distance * 0.4);
        
        const dx = mousePos.x - zLeft;
        const dy = mousePos.y - zTop;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        return dist < 8;
      });

      if (targetIndex !== -1) {
        const target = zombies[targetIndex];
        if (target.isDead) return; // Cannot hit dead zombies

        const damage = stats.archetype === Archetype.SHARPSHOOTER ? 25 : 15;
        
        setZombies(prev => {
          const newZombies = [...prev];
          const updatedTarget = { 
            ...newZombies[targetIndex], 
            health: Math.max(0, newZombies[targetIndex].health - damage),
            isHit: true
          };
          
          if (updatedTarget.health <= 0) {
            addLog(`TARGET NEUTRALIZED: ${updatedTarget.name}`);
            setStats(s => ({ ...s, kills: s.kills + 1 }));
            updatedTarget.isDead = true;
            
            // Drop loot simulation
            if (Math.random() > 0.6) {
              const isFragment = Math.random() > 0.7;
              if (isFragment) {
                setStats(s => ({ ...s, fragments: s.fragments + 1 }));
                addLog("LOOT ACQUIRED: VACCINE FRAGMENT COLLECTED");
              } else {
                setStats(s => ({ ...s, ammo: s.ammo + 4 }));
                addLog("LOOT ACQUIRED: AMMO RECOVERED");
              }
            }

            // Remove after death animation
            setTimeout(() => {
              setZombies(curr => curr.filter(z => z.id !== target.id));
            }, 1000);
          } else {
            addLog(`HIT CONFIRMED: ${updatedTarget.name} (-${damage} HP)`);
          }
          
          newZombies[targetIndex] = updatedTarget;
          return newZombies;
        });

        // Reset hit state after a short delay
        setTimeout(() => {
          setZombies(prev => prev.map(z => z.id === target.id ? { ...z, isHit: false } : z));
        }, 200);
      } else {
        addLog("MISS: NO TARGET AT COORDINATES");
      }
    } else {
      addLog("ERROR: OUT OF AMMO - RELOAD REQUIRED");
    }
  };

  const handleSynthesize = () => {
    if (stats.fragments >= 10) {
      simulateTx("SYNTHESIZE_CURE");
      addLog("SYNTHESIZING CURE... MINTING SURVIVOR BADGE");
      setStats(prev => ({ ...prev, fragments: prev.fragments - 10 }));
      setTimeout(() => {
        addLog("SUCCESS: CURE SYNTHESIZED. SURVIVOR BADGE MINTED (NFT)");
      }, 2000);
    } else {
      addLog(`ERROR: INSUFFICIENT FRAGMENTS (${stats.fragments}/10 REQUIRED)`);
    }
  };

  return (
    <motion.div 
      animate={screenShake ? { x: [-10, 10, -10, 10, 0], y: [-5, 5, -5, 5, 0] } : {}}
      className={`relative w-screen h-screen bg-black overflow-hidden select-none cursor-none ${stats.hp < 40 ? 'distortion-effect' : ''}`}
      onMouseMove={handleMouseMove}
      onClick={(e) => {
        if (!isConnected || stats.isDead) return;
        if ((e.target as HTMLElement).closest('button')) return;
        handleShoot();
      }}
    >
      {/* Wallet Connection Overlay */}
      <AnimatePresence>
        {!isConnected && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[300] flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/cyberpunk/1920/1080')] bg-cover bg-center opacity-20 grayscale" />
            <div className="absolute inset-0 bg-black/60" />
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="hud-border bg-hud-bg p-12 rounded-sm max-w-lg relative z-10"
            >
              <div className="w-20 h-20 border-2 border-hud-blue rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <ShieldAlert className="w-10 h-10 text-hud-blue" />
              </div>
              <h1 className="text-5xl font-black text-white mb-2 uppercase italic tracking-tighter glitch-text">Resident System</h1>
              <p className="text-hud-blue/60 text-sm uppercase tracking-widest mb-8">Survive the Outbreak. Purify the Virus.</p>
              
              <div className="space-y-4 mb-8 text-left border-l-2 border-hud-blue/20 pl-6">
                <div className="text-[10px] uppercase opacity-50">Mission Briefing</div>
                <p className="text-xs leading-relaxed opacity-80">
                  The city has fallen. Bio-signatures are approaching your perimeter. 
                  Connect your OneWallet to authenticate your OneID and begin the purification protocol.
                </p>
              </div>

              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full py-4 bg-hud-blue text-black font-black uppercase tracking-[0.2em] hover:bg-white transition-colors disabled:opacity-50"
              >
                {isConnecting ? 'Authenticating...' : 'Connect OneWallet'}
              </motion.button>
              
              <div className="mt-6 flex items-center justify-center gap-4 opacity-30">
                <div className="text-[8px] uppercase tracking-widest">OneChain Ecosystem</div>
                <div className="w-1 h-1 bg-white rounded-full" />
                <div className="text-[8px] uppercase tracking-widest">OneID Protocol</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Low HP Red Vignette */}
      {stats.hp < 40 && <div className="fixed inset-0 pointer-events-none z-[80] vignette-red" />}
      {/* Muzzle Flash Overlay */}
      <AnimatePresence>
        {muzzleFlash && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white pointer-events-none z-[110]"
          />
        )}
      </AnimatePresence>

      {/* Damage Flash Overlay */}
      <AnimatePresence>
        {damageFlash && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-red-600 pointer-events-none z-[110]"
          />
        )}
      </AnimatePresence>

      {/* Background Ambience */}
      <div className="absolute inset-0 bg-hud-bg/20 pointer-events-none" />
      
      {/* CRT Effects */}
      <div className="scanline" />
      <div className="absolute inset-0 pointer-events-none crt-flicker bg-hud-blue/5" />

      {/* Transaction Status */}
      <AnimatePresence>
        {txStatus !== 'idle' && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 bg-hud-bg/80 border border-hud-blue/30 px-4 py-2 rounded-sm backdrop-blur-sm"
          >
            <div className={`w-2 h-2 rounded-full ${txStatus === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-widest">
                {txStatus === 'pending' ? 'Transaction Pending' : 'Transaction Success'}
              </span>
              <span className="text-[8px] font-mono opacity-50">{txHash}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Game Components */}
      <HUD stats={stats} isWarning={isWarning} onSwitchArchetype={handleSwitchArchetype} />
      <CombatOverlay zombies={zombies} />
      <Scanner zombies={zombies} mousePos={mousePos} />
      <Inventory items={items} onUseItem={handleUseItem} />
      <CityStatus state={city} />

      {/* Bottom Center: Action & Logs */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[400px] flex flex-col gap-4 items-center z-50">
        <div className="hud-border bg-hud-bg p-3 rounded-sm w-full font-mono text-[10px] space-y-1">
          <div className="flex items-center gap-2 opacity-50 mb-1">
            <Terminal className="w-3 h-3" />
            <span>Session Logs</span>
          </div>
          {logs.map((log, i) => (
            <div key={i} className={i === logs.length - 1 ? 'text-hud-blue animate-pulse' : 'opacity-40'}>
              {log}
            </div>
          ))}
        </div>

        <div className="flex gap-4 items-center">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={handleShoot}
            className="w-24 h-24 rounded-full border-4 border-hud-blue/30 bg-hud-blue/5 flex items-center justify-center group hover:border-hud-blue transition-all cursor-pointer pointer-events-auto"
          >
            <div className="w-16 h-16 rounded-full border border-hud-blue/50 flex items-center justify-center group-hover:bg-hud-blue/20">
              <span className="text-xs font-bold uppercase tracking-widest">Fire</span>
            </div>
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={handleReload}
            className="w-16 h-16 rounded-full border-2 border-hud-blue/20 bg-hud-blue/5 flex items-center justify-center group hover:border-hud-blue/50 transition-all cursor-pointer pointer-events-auto"
          >
            <div className="text-[8px] font-bold uppercase tracking-tighter">Reload</div>
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={handleSynthesize}
            className={`w-16 h-16 rounded-full border-2 flex items-center justify-center group transition-all cursor-pointer pointer-events-auto ${stats.fragments >= 10 ? 'border-green-500/50 bg-green-500/10 hover:border-green-500' : 'border-hud-blue/10 bg-hud-blue/5 opacity-50'}`}
          >
            <div className="text-[8px] font-bold uppercase tracking-tighter text-center">Synthesize<br/>Cure</div>
          </motion.button>
        </div>
      </div>

      {/* Warning Overlay if HP low */}
      <AnimatePresence>
        {stats.hp < 40 && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0.2] }}
              className="fixed inset-0 pointer-events-none z-[90] bg-[radial-gradient(circle_at_center,transparent_30%,rgba(153,0,0,0.4)_100%)]"
            />
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.4, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="fixed inset-0 bg-red-900/20 pointer-events-none z-[100] flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-4">
                <ShieldAlert className="w-24 h-24 text-red-500" />
                <h2 className="text-4xl font-black text-red-500 glitch-text uppercase italic">Critical Condition</h2>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Death State Overlay */}
      <AnimatePresence>
        {stats.isDead && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/90 z-[200] flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="hud-border bg-hud-bg p-12 rounded-sm max-w-md"
            >
              <ShieldAlert className="w-24 h-24 text-red-500 mx-auto mb-6" />
              <h2 className="text-6xl font-black text-red-500 mb-2 uppercase italic tracking-tighter">System Offline</h2>
              <p className="text-hud-blue/60 text-sm uppercase tracking-widest mb-8">Vital signs terminated. Sector lost.</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-hud-blue/5 p-4 border border-hud-blue/20">
                  <div className="text-[10px] uppercase opacity-50">Kills</div>
                  <div className="text-2xl font-bold">{stats.kills}</div>
                </div>
                <div className="bg-hud-blue/5 p-4 border border-hud-blue/20">
                  <div className="text-[10px] uppercase opacity-50">Infection</div>
                  <div className="text-2xl font-bold">{stats.infectionLevel.toFixed(1)}%</div>
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRestart}
                className="w-full py-4 bg-hud-blue text-black font-black uppercase tracking-[0.2em] hover:bg-white transition-colors"
              >
                Reboot System
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Corner Accents */}
      <div className="fixed top-0 left-0 w-32 h-32 border-t border-l border-hud-blue/20 pointer-events-none" />
      <div className="fixed top-0 right-0 w-32 h-32 border-t border-r border-hud-blue/20 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-32 h-32 border-b border-l border-hud-blue/20 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-32 h-32 border-b border-r border-hud-blue/20 pointer-events-none" />
    </motion.div>
  );
}
