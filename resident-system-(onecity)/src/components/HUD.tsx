import React from 'react';
import { motion } from 'motion/react';
import { Activity, Shield, Crosshair, Zap } from 'lucide-react';
import { PlayerStats, Archetype } from '../types';

interface HUDProps {
  stats: PlayerStats;
}

export const HUD: React.FC<HUDProps> = ({ stats }) => {
  const hpPercentage = (stats.hp / stats.maxHp) * 100;
  
  return (
    <div className="fixed top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none z-50">
      {/* Left Side: Player Info & HP */}
      <div className="flex flex-col gap-4 pointer-events-auto">
        <div className="hud-border bg-hud-bg p-4 rounded-sm min-w-[250px]">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-hud-blue" />
            <span className="text-xs uppercase tracking-widest opacity-70">System Status</span>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-[10px] mb-1 uppercase tracking-tighter">
              <span>Vitality</span>
              <span>{stats.hp} / {stats.maxHp}</span>
            </div>
            <div className="h-2 w-full bg-hud-blue/10 border border-hud-blue/30 overflow-hidden">
              <motion.div 
                className="h-full bg-hud-blue shadow-[0_0_10px_#00f2ff]"
                initial={{ width: 0 }}
                animate={{ width: `${hpPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[9px] uppercase opacity-50 block">Infection</span>
              <span className={`text-sm font-bold ${stats.infectionLevel > 50 ? 'text-red-500' : 'text-hud-blue'}`}>
                {stats.infectionLevel.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase opacity-50 block">Confirmed Kills</span>
              <span className="text-sm font-bold">{stats.kills}</span>
            </div>
          </div>
        </div>

        <div className="hud-border bg-hud-bg p-3 rounded-sm flex items-center gap-3">
          <div className="p-2 bg-hud-blue/10 border border-hud-blue/30">
            {stats.archetype === Archetype.POINTMAN && <Shield className="w-5 h-5" />}
            {stats.archetype === Archetype.MEDIC && <Zap className="w-5 h-5" />}
            {stats.archetype === Archetype.SHARPSHOOTER && <Crosshair className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-[10px] uppercase opacity-50">Active Archetype</div>
            <div className="text-xs font-bold tracking-widest uppercase">{stats.archetype}</div>
          </div>
        </div>
      </div>

      {/* Right Side: OneID & Wallet */}
      <div className="flex flex-col items-end gap-4 pointer-events-auto">
        <div className="hud-border bg-hud-bg p-3 rounded-sm text-right">
          <div className="text-[9px] uppercase opacity-50">OneID Authenticated</div>
          <div className="text-xs font-bold tracking-tighter">{stats.oneId}</div>
          <div className="flex items-center justify-end gap-1 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[8px] uppercase tracking-widest text-green-500">On-Chain Session Active</span>
          </div>
        </div>
        
        <div className="hud-border bg-hud-bg p-4 rounded-sm min-w-[150px]">
          <div className="text-[9px] uppercase opacity-50 mb-1">Ammo Reserves</div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tighter">{stats.ammo}</span>
            <span className="text-[10px] opacity-50 uppercase">Shells</span>
          </div>
        </div>
      </div>
    </div>
  );
};
