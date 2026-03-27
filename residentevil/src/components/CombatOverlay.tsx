import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zombie } from '../types';

interface CombatOverlayProps {
  zombies: Zombie[];
}

export const CombatOverlay: React.FC<CombatOverlayProps> = ({ zombies }) => {
  // Only show zombies that are relatively close
  const visibleZombies = zombies.filter(z => z.distance < 25);

  return (
    <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden flex items-center justify-center">
      <AnimatePresence>
        {visibleZombies.map((zombie) => {
          // Calculate scale based on distance (1 is far, 10 is right in your face)
          const scale = Math.max(0.1, (25 - zombie.distance) / 2);
          const opacity = Math.min(0.8, (25 - zombie.distance) / 15);
          
          // Variant colors
          const colors = [
            'text-hud-blue',    // Default
            'text-emerald-500', // Variant 1
            'text-purple-500',  // Variant 2
            'text-amber-500',   // Variant 3
          ];
          const color = zombie.type === 'Big' ? 'text-red-600' : colors[(zombie.variant || 0) % colors.length];

          return (
            <motion.div
              key={zombie.id}
              initial={{ opacity: 0, scale: 0.2, y: 100 }}
              animate={{ 
                opacity: zombie.isDead ? 0 : opacity,
                scale: zombie.isAttacking ? scale * 1.5 : scale,
                x: `${zombie.xOffset * 5}px`,
                y: zombie.isAttacking ? -50 : (zombie.isDead ? 200 : 0),
                filter: `blur(${zombie.distance / 5}px) brightness(${zombie.isHit ? 2 : 1})`,
              }}
              exit={{ opacity: 0, scale: 2 }}
              transition={{ 
                type: 'spring', 
                stiffness: zombie.isAttacking ? 300 : 50, 
                damping: 20 
              }}
              className={`absolute flex flex-col items-center ${color}`}
            >
              {/* Stylized Zombie Silhouette */}
              <div className="relative">
                {/* Head */}
                <motion.div 
                  animate={zombie.isAttacking ? { y: [0, -10, 0] } : {}}
                  className="w-12 h-14 bg-current rounded-full mb-1 opacity-80"
                  style={{ borderRadius: '40% 40% 50% 50%' }}
                />
                {/* Shoulders/Torso */}
                <div className="w-32 h-40 bg-current opacity-60" style={{ borderRadius: '50% 50% 20% 20%' }} />
                
                {/* Glitchy Eyes */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-4">
                  <motion.div 
                    animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.1 }}
                    className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" 
                  />
                  <motion.div 
                    animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.1, delay: 0.05 }}
                    className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" 
                  />
                </div>

                {/* Attack Claws/Arms (Visible when attacking) */}
                {zombie.isAttacking && (
                  <>
                    <motion.div 
                      initial={{ x: -100, opacity: 0 }}
                      animate={{ x: -60, opacity: 1, rotate: -20 }}
                      className="absolute top-20 left-0 w-20 h-4 bg-current origin-right"
                    />
                    <motion.div 
                      initial={{ x: 100, opacity: 0 }}
                      animate={{ x: 60, opacity: 1, rotate: 20 }}
                      className="absolute top-20 right-0 w-20 h-4 bg-current origin-left"
                    />
                  </>
                )}
              </div>

              {/* Bio-Signature Glitch Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-20 mix-blend-overlay">
                <div className="w-full h-full bg-white animate-pulse" />
              </div>

              {/* Zombie HP Bar */}
              {!zombie.isDead && (
                <div className="absolute -bottom-10 w-24 h-1 bg-black/50 border border-current/30 overflow-hidden">
                  <motion.div 
                    initial={{ width: '100%' }}
                    animate={{ width: `${(zombie.health / (zombie.type === 'Big' ? 150 : 100)) * 100}%` }}
                    className="h-full bg-current shadow-[0_0_5px_currentColor]"
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
