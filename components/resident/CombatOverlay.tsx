import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zombie } from '../../lib/gameTypes';

interface CombatOverlayProps {
  zombies: Zombie[];
}

export const CombatOverlay: React.FC<CombatOverlayProps> = ({ zombies }) => {
  // Show ALL alive zombies — they start far (small) and grow as they approach
  const visibleZombies = zombies.filter(z => !z.isDead);

  return (
    <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
      <AnimatePresence>
        {visibleZombies.map((zombie) => {
          // distance 95 = tiny + near top; distance 0 = huge + at bottom center
          const progress = 1 - (zombie.distance / 95); // 0 (far) → 1 (close)
          const scale = 0.1 + progress * 2.5;           // 0.1 → 2.6
          const opacity = 0.2 + progress * 0.8;          // barely visible → full
          const yPos = 5 + progress * 60;                // 5% top → 65% down screen
          const xPos = 50 + zombie.xOffset * (1 - progress * 0.5); // converge center

          const colors = [
            'text-hud-blue',
            'text-emerald-500',
            'text-purple-500',
            'text-amber-500',
          ];
          const color = zombie.type === 'Big' ? 'text-red-600' : colors[(zombie.variant || 0) % colors.length];

          return (
            <motion.div
              key={zombie.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: zombie.isDead ? 0 : opacity,
                scale: zombie.isAttacking ? scale * 1.3 : scale,
                filter: `blur(${zombie.distance / 20}px) brightness(${zombie.isHit ? 2.5 : 1})`,
              }}
              exit={{ opacity: 0, scale: 3 }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
              className={`absolute flex flex-col items-center ${color}`}
              style={{
                left: `${xPos}%`,
                top: `${yPos}%`,
                transform: `translate(-50%, -50%) scale(${zombie.isAttacking ? scale * 1.3 : scale})`,
                zIndex: Math.floor(100 - zombie.distance),
              }}
            >
              <div className="relative">
                <motion.div 
                  animate={zombie.isAttacking ? { y: [-10, 0] } : { y: 0 }}
                  transition={{ type: 'tween', duration: 0.15, ease: 'easeOut' }}
                  className="w-12 h-14 bg-current rounded-full mb-1 opacity-80"
                  style={{ borderRadius: '40% 40% 50% 50%' }}
                />
                <div className="w-32 h-40 bg-current opacity-60" style={{ borderRadius: '50% 50% 20% 20%' }} />
                
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

              <div className="absolute inset-0 flex items-center justify-center opacity-20 mix-blend-overlay">
                <div className="w-full h-full bg-white animate-pulse" />
              </div>

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
