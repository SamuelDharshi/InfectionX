import React from 'react';
import { motion } from 'motion/react';
import { Globe, Users, Zap } from 'lucide-react';
import { CityState } from '../../lib/gameTypes';

interface CityStatusProps {
  state: CityState;
}

export const CityStatus: React.FC<CityStatusProps> = ({ state }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 text-right flex flex-col items-end gap-4">
      <div className="hud-border bg-hud-bg p-4 rounded-sm min-w-[250px] backdrop-blur-md">
        <div className="flex items-center justify-end gap-2 mb-4 border-b border-hud-blue/20 pb-2 text-hud-blue">
          <span className="text-xs uppercase tracking-widest">Raccoon City Live Feed</span>
          <Globe className="w-4 h-4" />
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-[10px] mb-1 uppercase tracking-tighter text-hud-blue/70">
              <span>Global Infection Rate</span>
              <span className="text-red-500">{state.infectionRate.toFixed(2)}%</span>
            </div>
            <div className="h-1.5 w-full bg-red-950/30 border border-red-900/30 overflow-hidden">
              <motion.div 
                className="h-full bg-red-600"
                animate={{ width: `${state.infectionRate}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-hud-blue">
            <div>
              <div className="flex items-center justify-end gap-1 text-[9px] uppercase opacity-50">
                <Users className="w-3 h-3" />
                <span>Survivors</span>
              </div>
              <div className="text-sm font-bold">{state.totalSurvivors.toLocaleString()}</div>
            </div>
            <div>
              <div className="flex items-center justify-end gap-1 text-[9px] uppercase opacity-50">
                <Zap className="w-3 h-3" />
                <span>Active Raids</span>
              </div>
              <div className="text-sm font-bold">{state.activeRaids}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button className="px-4 py-2 bg-hud-blue/10 border border-hud-blue/40 text-[10px] uppercase tracking-widest hover:bg-hud-blue/30 transition-all cursor-pointer pointer-events-auto text-hud-blue">
          Join Raid
        </button>
        <button className="px-4 py-2 bg-red-500/10 border border-red-500/40 text-[10px] uppercase tracking-widest hover:bg-red-500/30 transition-all cursor-pointer pointer-events-auto text-red-500">
          Emergency Signal
        </button>
      </div>
    </div>
  );
};
