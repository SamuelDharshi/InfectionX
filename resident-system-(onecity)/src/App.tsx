/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HUD } from './components/HUD';
import { Scanner } from './components/Scanner';
import { Inventory } from './components/Inventory';
import { CityStatus } from './components/CityStatus';
import { Archetype, PlayerStats, Zombie, GameItem, CityState } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Terminal } from 'lucide-react';

export default function App() {
  const [stats, setStats] = useState<PlayerStats>({
    hp: 85,
    maxHp: 100,
    infectionLevel: 12.4,
    kills: 142,
    ammo: 24,
    archetype: Archetype.SHARPSHOOTER,
    oneId: "0x7a2...f4e1.oneid"
  });

  const [zombies, setZombies] = useState<Zombie[]>([
    { id: 'z-1', type: 'Small', name: 'Fast Crawler', health: 45, threatLevel: 4, distance: 45, image: '' },
    { id: 'z-2', type: 'Small', name: 'Viral Sprinter', health: 80, threatLevel: 7, distance: 35, image: '' },
    { id: 'z-3', type: 'Big', name: 'The Goliath', health: 100, threatLevel: 10, distance: 60, image: '' },
  ]);

  const [items] = useState<GameItem[]>([
    { id: 'i-1', name: 'Green Herb', type: 'herb', count: 3 },
    { id: 'i-2', name: 'Shotgun Shells', type: 'ammo', count: 12 },
    { id: 'i-3', name: 'Vaccine Fragment', type: 'fragment', count: 2 },
    { id: 'i-4', name: 'Riot Shield', type: 'ammo', count: 1 },
  ]);

  const [city] = useState<CityState>({
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

  // Simulate game loop
  useEffect(() => {
    const interval = setInterval(() => {
      setZombies(prev => prev.map(z => ({
        ...z,
        health: Math.max(0, z.health - (Math.random() > 0.98 ? 1 : 0)),
        // Slower, more consistent movement from a distance
        distance: Math.max(5, z.distance - (Math.random() * 0.2 + 0.05))
      })));

      setStats(prev => {
        const closestZombie = Math.min(...zombies.map(z => z.distance));
        if (closestZombie < 10 && Math.random() > 0.8) {
          return { ...prev, hp: Math.max(0, prev.hp - 2) };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [zombies]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-4), `> ${msg}`]);
  };

  const handleShoot = () => {
    if (stats.ammo > 0) {
      setStats(prev => ({ ...prev, ammo: prev.ammo - 1, kills: prev.kills + (Math.random() > 0.9 ? 1 : 0) }));
      addLog("TRANSACTION: AMMO_CONSUMED (0.0001 ONE)");
    } else {
      addLog("ERROR: OUT OF AMMO");
    }
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/raccoon-city/1920/1080?blur=10')] bg-cover bg-center opacity-20 grayscale mix-blend-overlay" />
      
      {/* CRT Effects */}
      <div className="scanline" />
      <div className="absolute inset-0 pointer-events-none crt-flicker bg-hud-blue/5" />

      {/* Main Game Components */}
      <HUD stats={stats} />
      <Scanner zombies={zombies} />
      <Inventory items={items} />
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

        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={handleShoot}
          className="w-24 h-24 rounded-full border-4 border-hud-blue/30 bg-hud-blue/5 flex items-center justify-center group hover:border-hud-blue transition-all cursor-pointer pointer-events-auto"
        >
          <div className="w-16 h-16 rounded-full border border-hud-blue/50 flex items-center justify-center group-hover:bg-hud-blue/20">
            <span className="text-xs font-bold uppercase tracking-widest">Fire</span>
          </div>
        </motion.button>
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

      {/* Corner Accents */}
      <div className="fixed top-0 left-0 w-32 h-32 border-t border-l border-hud-blue/20 pointer-events-none" />
      <div className="fixed top-0 right-0 w-32 h-32 border-t border-r border-hud-blue/20 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-32 h-32 border-b border-l border-hud-blue/20 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-32 h-32 border-b border-r border-hud-blue/20 pointer-events-none" />
    </div>
  );
}
