import React from 'react';
import { Package, Database } from 'lucide-react';
import { GameItem } from '../types';

interface InventoryProps {
  items: GameItem[];
}

export const Inventory: React.FC<InventoryProps> = ({ items }) => {
  return (
    <div className="fixed bottom-6 left-6 z-50">
      <div className="hud-border bg-hud-bg p-4 rounded-sm min-w-[300px]">
        <div className="flex items-center gap-2 mb-4 border-b border-hud-blue/20 pb-2">
          <Package className="w-4 h-4" />
          <span className="text-xs uppercase tracking-widest">Move Object Inventory</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {items.map((item) => (
            <div 
              key={item.id} 
              className="aspect-square border border-hud-blue/30 bg-hud-blue/5 flex flex-col items-center justify-center p-1 relative group cursor-pointer hover:bg-hud-blue/20 transition-colors"
            >
              <div className="text-[8px] uppercase opacity-50 absolute top-1 left-1">x{item.count}</div>
              {item.type === 'herb' && <div className="w-6 h-6 bg-green-500/40 rounded-full blur-sm" />}
              {item.type === 'ammo' && <div className="w-4 h-6 bg-hud-blue/40 border border-hud-blue/60" />}
              {item.type === 'fragment' && <div className="w-5 h-5 bg-purple-500/40 rotate-45 border border-purple-500/60" />}
              <div className="text-[7px] uppercase mt-1 text-center leading-tight opacity-0 group-hover:opacity-100 transition-opacity">
                {item.name}
              </div>
            </div>
          ))}
          {Array.from({ length: 8 - items.length }).map((_, i) => (
            <div key={i} className="aspect-square border border-hud-blue/10 bg-hud-blue/2" />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between text-[8px] uppercase opacity-50">
          <div className="flex items-center gap-1">
            <Database className="w-3 h-3" />
            <span>Storage: Move Child Objects</span>
          </div>
          <span>8 / 24 Slots</span>
        </div>
      </div>
    </div>
  );
};
