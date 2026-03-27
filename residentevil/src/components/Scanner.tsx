import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, AlertTriangle } from 'lucide-react';
import { Zombie } from '../types';

interface ScannerProps {
  zombies: Zombie[];
  mousePos: { x: number, y: number };
}

export const Scanner: React.FC<ScannerProps> = ({ zombies, mousePos }) => {
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

            const zLeft = 50 + zombie.xOffset;
            const zTop = 45 + (zombie.distance * 0.4);
            const dx = mousePos.x - zLeft;
            const dy = mousePos.y - zTop;
            const isTargeted = Math.sqrt(dx * dx + dy * dy) < 8;

            // Variant colors for small zombies
            const variantColors = [
              'border-hud-blue bg-hud-blue/20', // Default
              'border-emerald-500 bg-emerald-500/20', // Variant 1
              'border-purple-500 bg-purple-500/20', // Variant 2
              'border-amber-500 bg-amber-500/20', // Variant 3
            ];
            const variantColor = zombie.type === 'Big' ? 'border-red-500 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : variantColors[(zombie.variant || 0) % variantColors.length];

            return (
              <motion.div
                key={zombie.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ 
                  opacity: zombie.isDead ? 0 : opacity, 
                  scale: (zombie.isDead ? scale * 1.2 : scale * 0.6) * (zombie.isAttacking ? 1.4 : 1), 
                  filter: `blur(${zombie.isDead ? 10 : blur}px)`,
                  x: zombie.isHit ? [0, -10, 10, 0] : (Math.sin(Date.now() / 500 + parseInt(zombie.id.split('-')[1] || '0')) * 20),
                  y: zombie.isAttacking ? -30 : (zombie.isDead ? 50 : 0),
                  rotate: zombie.isDead ? 45 : 0,
                }}
                exit={{ opacity: 0, scale: 1.5 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: zombie.isHit ? 500 : 100, 
                  damping: 25,
                  duration: zombie.isDead ? 1 : 0.3
                }}
                className="absolute flex flex-col items-center gap-2"
                style={{
                  left: `${zLeft}%`,
                  top: `${zTop}%`,
                  zIndex: Math.floor(100 - zombie.distance),
                }}
              >
                {/* Abstract Bio-Signature */}
                <motion.div 
                  animate={zombie.isHit ? { 
                    scale: [1, 1.2, 1],
                    backgroundColor: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0)']
                  } : {}}
                  className={`relative p-1 border ${isTargeted ? 'border-white scale-110' : variantColor} rounded-sm backdrop-blur-sm transition-all`}
                >
                  {isTargeted && (
                    <div className="absolute -inset-2 border border-white/50 animate-ping rounded-sm pointer-events-none" />
                  )}
                  {zombie.isAttacking && (
                    <div className="absolute -inset-4 border-2 border-red-500/50 animate-pulse rounded-sm pointer-events-none" />
                  )}
                  <div className={`relative ${zombie.type === 'Big' ? 'w-8 h-8' : 'w-5 h-5'} flex items-center justify-center`}>
                    {/* Pulsing Core */}
                    <motion.div 
                      animate={{ 
                        scale: zombie.isAttacking ? [1, 1.5, 1] : [1, 1.2, 1],
                        opacity: zombie.isAttacking ? [0.6, 1, 0.6] : [0.4, 0.8, 0.4]
                      }}
                      transition={{ repeat: Infinity, duration: zombie.isAttacking ? 0.3 : 1.5 }}
                      className={`w-full h-full border ${zombie.type === 'Big' ? 'border-red-500 bg-red-500/40' : 'border-current bg-current/40'} rotate-45`}
                      style={{ color: variantColor.split(' ')[0].replace('border-', '') }}
                    />
                    
                    {/* Scanning Line Effect */}
                    <motion.div 
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="absolute left-0 right-0 h-[1px] bg-white/50 z-10"
                    />
                  </div>
                  
                  {zombie.type === 'Big' && (
                    <motion.div 
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="absolute -top-6 left-1/2 -translate-x-1/2"
                    >
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    </motion.div>
                  )}

                  {/* Distance Indicator Overlay */}
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 px-1 border border-hud-blue/20 text-[6px] uppercase tracking-tighter">
                    {zombie.distance.toFixed(1)}m
                  </div>
                </motion.div>
                
                {/* Target Data Box (Smaller) */}
                <div className="bg-black/90 border border-hud-blue/30 p-1 min-w-[80px] backdrop-blur-md">
                  <div className={`text-[7px] font-bold uppercase mb-0.5 truncate ${zombie.type === 'Big' ? 'text-red-500' : 'text-hud-blue'}`}>
                    {zombie.name}
                  </div>
                  <div className="h-0.5 w-full bg-white/10 mb-0.5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${zombie.health}%` }}
                      className={`h-full ${zombie.type === 'Big' ? 'bg-red-500' : 'bg-hud-blue'}`} 
                    />
                  </div>
                  <div className="flex justify-between text-[6px] uppercase font-bold opacity-70">
                    <span>Threat</span>
                    <span>{zombie.threatLevel}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Mouse Reticle */}
      <motion.div 
        className="absolute w-48 h-48 pointer-events-none"
        animate={{ 
          left: `${mousePos.x}%`, 
          top: `${mousePos.y}%`,
          x: '-50%',
          y: '-50%'
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
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
      </motion.div>
    </div>
  );
};
