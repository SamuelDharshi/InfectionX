import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, AlertTriangle } from 'lucide-react';
import { Zombie } from '../types';

interface ScannerProps {
  zombies: Zombie[];
}

export const Scanner: React.FC<ScannerProps> = ({ zombies }) => {
  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
      {/* Scanner Grid Overlay */}
      <div className="absolute inset-0 border-[40px] border-black/20 pointer-events-none">
        <div className="w-full h-full border border-hud-blue/10 grid grid-cols-6 grid-rows-6">
          {Array.from({ length: 36 }).map((_, i) => (
            <div key={i} className="border-[0.5px] border-hud-blue/5" />
          ))}
        </div>
      </div>

      {/* Detected Entities */}
      <div className="relative w-full h-full overflow-hidden">
        <AnimatePresence>
          {zombies.map((zombie) => {
            // Calculate scale and opacity based on distance (closer = larger/more opaque)
            // Assuming distance range is roughly 1 to 30
            const scale = Math.max(0.2, 2.5 - (zombie.distance / 10));
            const opacity = Math.min(1, 1.5 - (zombie.distance / 20));
            const blur = Math.max(0, (zombie.distance - 5) / 2);

            return (
              <motion.div
                key={zombie.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ 
                  opacity: opacity, 
                  scale: scale * 0.6, // Constrain scale to keep them "far away"
                  filter: `blur(${blur}px)`,
                  x: (Math.sin(Date.now() / 500 + parseInt(zombie.id.split('-')[1])) * 20), 
                }}
                exit={{ opacity: 0, scale: 1.5 }}
                transition={{ type: 'spring', stiffness: 100, damping: 25 }}
                className="absolute flex flex-col items-center gap-2"
                style={{
                  left: `${50 + (parseInt(zombie.id.split('-')[1]) * 20 - 30)}%`,
                  top: `${45 + (zombie.distance * 0.4)}%`,
                  zIndex: Math.floor(100 - zombie.distance),
                }}
              >
                {/* Abstract Bio-Signature Icon */}
                <div className={`relative p-2 border ${zombie.type === 'Big' ? 'border-red-500 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'border-hud-blue bg-hud-blue/20 shadow-[0_0_10px_rgba(0,242,255,0.2)]'} rounded-sm backdrop-blur-sm`}>
                  <Target className={`w-10 h-10 ${zombie.type === 'Big' ? 'text-red-500' : 'text-hud-blue'}`} />
                  
                  {zombie.type === 'Big' && (
                    <motion.div 
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="absolute -top-8 left-1/2 -translate-x-1/2"
                    >
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </motion.div>
                  )}

                  {/* Distance Indicator Overlay */}
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 px-1 border border-hud-blue/20 text-[7px] uppercase tracking-tighter">
                    RNG: {zombie.distance.toFixed(1)}m
                  </div>
                </div>
                
                {/* Target Data Box (Smaller) */}
                <div className="bg-black/90 border border-hud-blue/30 p-1.5 min-w-[110px] backdrop-blur-md">
                  <div className={`text-[9px] font-bold uppercase mb-1 truncate ${zombie.type === 'Big' ? 'text-red-500' : 'text-hud-blue'}`}>
                    {zombie.name}
                  </div>
                  <div className="h-1 w-full bg-white/10 mb-1">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${zombie.health}%` }}
                      className={`h-full ${zombie.type === 'Big' ? 'bg-red-500' : 'bg-hud-blue'}`} 
                    />
                  </div>
                  <div className="flex justify-between text-[7px] uppercase font-bold opacity-70">
                    <span>Threat</span>
                    <span>LVL {zombie.threatLevel}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Center Reticle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none">
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-hud-blue/50" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-hud-blue/50" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-hud-blue/50" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-hud-blue/50" />
        
        {/* Animated Scanning Ring */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
          className="absolute inset-4 border border-dashed border-hud-blue/20 rounded-full"
        />
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-hud-blue rounded-full shadow-[0_0_10px_#00f2ff]" />
      </div>
    </div>
  );
};
