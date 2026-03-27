"use client";

import { useWallet } from "../context/WalletContext";
import { ConnectButton } from "../components/ConnectButton";
import { useEffect, useState, useCallback, useMemo } from "react";

export default function Home() {
  const { connected, hunterId, zombies, inventory, attackSmall, consumeHerb, infectionRate } = useWallet();
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"MAP" | "BIO" | "INV">("MAP");
  
  // Track currently targeted zombie
  const target = zombies.length > 0 ? zombies[0] : null;

  const handleFire = useCallback(() => {
    if (activeTab !== "MAP") return;
    
    if (target && inventory.ammo.length > 0) {
      void attackSmall(target.objectId);
      setLogs(prev => [...prev.slice(-4), `> TRANSACTION: ENGAGED ${target.objectId.slice(0,6)}`]);
    } else if (target && inventory.ammo.length === 0) {
      setLogs(prev => [...prev.slice(-4), `> ERROR: NO AMMO`]);
    }
  }, [target, inventory.ammo.length, attackSmall, activeTab]);

  // Press F to shoot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f') {
        handleFire();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFire]);

  useEffect(() => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] BIO_SYNC ESTABLISHED`]);
  }, []);

  // Extended Mock Inventory for Simulation Vibe
  const mockGear = useMemo(() => [
    { id: "WPN-AK47-01", type: "ASSAULT_RIFLE", name: "AK-47 CUSTOM", icon: "ads_click", dp: 45, color: "text-red-400", border: "border-red-400" },
    { id: "WPN-SNP-02", type: "SNIPER_RIFLE", name: "MK22_GHOST", icon: "gps_fixed", dp: 120, color: "text-red-500", border: "border-red-500" },
    { id: "WPN-PST-03", type: "SIDEARM", name: "M1911_TACTICAL", icon: "hardware", dp: 15, color: "text-red-300", border: "border-red-300" },
    { id: "PWR-EP-01", type: "ENERGY_CELL", name: "HIGH_DENSITY_EP", icon: "battery_charging_full", dp: null, color: "text-blue-400", border: "border-blue-400" },
    { id: "MOD-XP-01", type: "EXPERIENCE", name: "COMBAT_DATA_XP", icon: "military_tech", dp: null, color: "text-yellow-500", border: "border-yellow-500" },
  ], []);

  return (
    <div className="bg-background text-on-surface font-body selection:bg-primary-container selection:text-white overflow-hidden h-screen w-screen relative select-none">
      
      {/* Global Overlays */}
      <div className="fixed inset-0 z-0 scanner-grid opacity-40 mix-blend-screen pointer-events-none"></div>
      <div className="fixed inset-0 z-10 scanline-overlay pointer-events-none"></div>
      <div className="fixed inset-0 z-20 vignette pointer-events-none"></div>
      
      <div className="fixed inset-0 z-[-1] overflow-hidden">
        <img 
            className="w-full h-full object-cover grayscale contrast-125 brightness-[0.3]" 
            alt="First-person POV tactical view" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFsltHXocZ6su-xilYaHD4Le4VOLU6VX6_tjyhGiVJGeHsUfEtxsyUI4wooPoAPsg01jA_N6pAxb_DrPqzWqUiVzWspdKYnnLaj2m9e1oDoXaYux6eL5LjwcqXhvRuUhZ2r5des_ufKUXWtC7MGBdjOewlm7aU6KugjqKw5zNZ_zxhrdU9SHTJPKDENKhDozZ5wHqb4yDCmnfgA4qm2Jm6S-uqoJosfwzdJ0HGDG1YYot-4i-lBpoGg244uE11N_qpvxz7MwX99Uc"
        />
      </div>

      {/* SideNavBar */}
      <nav className="flex flex-col fixed left-0 top-0 h-full z-40 bg-[#2a1616] font-headline text-sm border-r border-red-900/15 w-64 pt-20 hidden md:flex">
        <div className="px-6 py-4 mb-6">
          <div className="text-lg font-black text-red-500 font-headline uppercase">SECTOR_07</div>
          <div className="text-[10px] font-mono text-red-400/60 uppercase tracking-widest flex items-center gap-2 mt-1">
             <span className="w-2 h-2 bg-red-600 animate-pulse"></span>
             QUARANTINE_ACTIVE
          </div>
        </div>
        
        <div className="flex flex-col flex-1">
          <button 
            onClick={() => setActiveTab('MAP')}
            className={`font-mono text-sm flex items-center gap-4 transition-all duration-150 py-3 pl-4 ${
              activeTab === 'MAP' ? 'text-red-400 border-l-4 border-red-600 bg-red-950/30' : 'text-red-900 hover:bg-red-900/20 hover:text-red-300'
            }`}
          >
            <span className="material-symbols-outlined">map</span>
            TACTICAL_MAP
          </button>
          <button 
            onClick={() => setActiveTab('BIO')}
            className={`font-mono text-sm flex items-center gap-4 transition-all duration-150 py-3 pl-4 ${
              activeTab === 'BIO' ? 'text-red-400 border-l-4 border-red-600 bg-red-950/30' : 'text-red-900 hover:bg-red-900/20 hover:text-red-300'
            }`}
          >
            <span className="material-symbols-outlined">biotech</span>
            BIO_DATA
          </button>
          <button 
            onClick={() => setActiveTab('INV')}
            className={`font-mono text-sm flex items-center gap-4 transition-all duration-150 py-3 pl-4 ${
              activeTab === 'INV' ? 'text-red-400 border-l-4 border-red-600 bg-red-950/30' : 'text-red-900 hover:bg-red-900/20 hover:text-red-300'
            }`}
          >
            <span className="material-symbols-outlined">inventory_2</span>
            INVENTORY
          </button>
        </div>
        
        <div className="p-6">
          <button 
           onClick={() => consumeHerb(inventory.herbs[0]?.objectId)}
           disabled={inventory.herbs.length === 0}
           className="w-full py-4 bg-primary-container text-white font-bold tracking-widest hover:bg-primary transition-all active:scale-95 text-xs text-center disabled:opacity-40"
          >
            CONSUME HERB [{inventory.herbs.length}]
          </button>
        </div>
      </nav>

      {/* TopNavBar */}
      <header className="flex justify-between items-center w-full px-6 py-4 fixed top-0 right-0 z-50 bg-[#200e0e] shadow-[0_0_15px_rgba(255,180,172,0.05)] border-b-0 md:pl-72">
        <div className="text-xl font-bold text-red-600 dark:text-red-500 tracking-widest font-headline uppercase">
            SYSTEM_BIO_SYNC_v3.0 
            <span className="text-xs ml-2 opacity-50 tracking-tighter">[{hunterId ? hunterId.slice(0, 8) : "INITIALIZING"}]</span>
        </div>
        <div className="flex items-center gap-6">
          <ConnectButton />
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="md:ml-64 pt-20 p-8 h-screen relative flex flex-col justify-between overflow-hidden">
        
        {/* VIEW: MAP */}
        {activeTab === 'MAP' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] pointer-events-none flex items-center justify-center">
            {/* HUD Corners */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary"></div>
            
            {target ? (
              <>
                <div className="absolute -top-12 left-0 right-0 text-center">
                  <div className="inline-block bg-primary-container text-white px-4 py-1 text-xs font-black tracking-[0.2em] glitch-border">
                    THREAT_IDENTIFIED: {target.threatTier}
                  </div>
                </div>

                <div className="absolute inset-4 border border-primary/20 flex items-center justify-center">
                  <div className="w-full h-[1px] bg-primary/30"></div>
                  <div className="h-full w-[1px] bg-primary/30 absolute"></div>
                  <div className="w-16 h-16 border border-primary animate-pulse flex items-center justify-center">
                    <div className="w-1 h-1 bg-primary"></div>
                  </div>
                  
                  <div className="absolute top-1/4 right-[-140px] flex flex-col items-start gap-2 bg-surface-container-high p-4 border-l-2 border-primary w-40">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-sm">radar</span>
                      <span className="text-[10px] font-mono tracking-tighter text-primary">SCANNING_THREAT</span>
                    </div>
                    <div className="text-sm font-black text-primary font-headline truncate w-full">{target.objectId.slice(0, 10)}...</div>
                    <div className="flex gap-4">
                      <div>
                          <span className="text-xl font-black text-primary leading-none">{target.hp}</span>
                          <span className="text-[10px] font-mono text-primary/60 pb-1 ml-1">HP</span>
                      </div>
                      <div>
                          <span className="text-xl font-black text-primary leading-none">{target.speedTier}</span>
                          <span className="text-[10px] font-mono text-primary/60 pb-1 ml-1">SPD</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-primary/40 font-headline italic tracking-[0.2em] text-sm animate-pulse">
                  {connected ? "NO_THREATS_DETECTED" : "AWAITING_WALLET_SYNC"}
              </div>
            )}
          </div>
        )}

        {/* Action Button for MAP */}
        {activeTab === 'MAP' && target && (
           <div className="absolute bottom-40 left-1/2 -translate-x-1/2 z-30 group">
              <button 
                 onClick={handleFire}
                 className="bg-primary-container text-white px-8 py-3 font-black font-headline tracking-widest text-sm hover:bg-primary hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-4 border-none shadow-[0_0_20px_rgba(178,34,34,0.4)]"
              >
                  <span className="bg-white text-primary-container px-2 py-1 text-xs font-mono">F</span>
                  PRESS [F] TO INTERACT
              </button>
           </div>
        )}

        {/* VIEW: BIO */}
        {activeTab === 'BIO' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-12">
            <div className="bg-surface-container-low/80 backdrop-blur-md border border-primary/20 p-8 w-full max-w-3xl">
              <div className="flex items-center gap-4 mb-8 border-b border-primary/20 pb-4">
                <span className="material-symbols-outlined text-primary text-4xl">biotech</span>
                <div>
                  <h2 className="text-2xl font-black text-primary tracking-widest font-headline">BIOMETRIC DATA</h2>
                  <p className="text-sm font-mono text-primary/60 uppercase">HUNTER [{hunterId ?? "UNKNOWN"}]</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <div className="text-[10px] font-mono tracking-widest text-primary/60 mb-2 uppercase">Core Body Temp</div>
                  <div className="text-3xl font-black text-primary font-headline">38.4°C <span className="text-sm text-error animate-pulse uppercase">Elevated</span></div>
                </div>
                <div>
                  <div className="text-[10px] font-mono tracking-widest text-primary/60 mb-2 uppercase">Blood Toxicology (Infection)</div>
                  <div className="text-3xl font-black text-primary font-headline">{infectionRate.toFixed(2)}%</div>
                </div>
              </div>

              <div className="w-full">
                <div className="flex justify-between text-[10px] font-mono text-primary/80 mb-2">
                  <span>Viral Progression History</span>
                  <span>[Live Sync]</span>
                </div>
                <div className="w-full h-32 border border-primary/20 bg-surface-container-highest/50 relative overflow-hidden flex items-end px-2 gap-1 pb-2">
                   {/* Fake graph simulating history */}
                   {[...Array(40)].map((_, i) => {
                     const height = Math.min((infectionRate * 0.5) + (Math.random() * 20) + (i * 0.5), 100);
                     return (
                       <div key={i} className={`flex-1 ${height > 70 ? 'bg-error' : 'bg-primary'} opacity-60`} style={{ height: `${height}%` }}></div>
                     );
                   })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: INV */}
        {activeTab === 'INV' && (
          <div className="w-full h-full flex items-center justify-center p-12 relative z-[60]">
            <div className="bg-surface-container-low/95 backdrop-blur-md border border-primary/20 p-8 w-full max-w-4xl h-full flex flex-col">
              <div className="flex items-center gap-4 mb-6 border-b border-primary/20 pb-4 shrink-0">
                <span className="material-symbols-outlined text-primary text-4xl">inventory_2</span>
                <div>
                  <h2 className="text-2xl font-black text-primary tracking-widest font-headline">TACTICAL INVENTORY</h2>
                  <p className="text-sm font-mono text-primary/60 uppercase">STORAGE_CAPACITY: {inventory.ammo.length + inventory.herbs.length + inventory.fragments.length + mockGear.length} ITEMS</p>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[120px] pb-32">
                 
                 {/* Advanced Weapons & Gear */}
                 {mockGear.map(gear => (
                   <div key={gear.id} className={`bg-surface-container border ${gear.border}/30 p-4 flex flex-col justify-between hover:${gear.border} hover:bg-surface-container-high transition-all shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] cursor-pointer group`}>
                      <div className="flex justify-between items-start">
                         <span className={`material-symbols-outlined ${gear.color} group-hover:scale-110 transition-transform`}>{gear.icon}</span>
                         {gear.dp && <span className={`text-[10px] ${gear.color}/60 font-mono`}>DP: {gear.dp}</span>}
                      </div>
                      <div>
                         <div className={`text-sm font-bold ${gear.color} tracking-widest`}>{gear.name}</div>
                         <div className={`text-[8px] font-mono ${gear.color}/40 truncate`}>{gear.id}</div>
                      </div>
                   </div>
                 ))}

                 {/* Ammo Blocks */}
                 {inventory.ammo.map(a => (
                   <div key={a.objectId} className="bg-surface-container border border-primary/20 p-4 flex flex-col justify-between hover:border-primary hover:bg-primary/5 transition-all">
                      <div className="flex justify-between items-start">
                         <span className="material-symbols-outlined text-primary">electric_bolt</span>
                         <span className="text-[10px] text-primary/60 font-mono">DP: {a.damage}</span>
                      </div>
                      <div>
                         <div className="text-sm font-bold text-primary tracking-widest">AMMO_CELL</div>
                         <div className="text-[8px] font-mono text-primary/40 truncate">{a.objectId}</div>
                      </div>
                   </div>
                 ))}

                 {/* Herb Blocks */}
                 {inventory.herbs.map(h => (
                   <div key={h.objectId} className="bg-surface-container border border-error/40 p-4 flex flex-col justify-between hover:border-error hover:bg-error/10 transition-all cursor-pointer shadow-[inset_0_0_20px_rgba(255,0,0,0.05)]" onClick={() => consumeHerb(h.objectId)}>
                      <div className="flex justify-between items-start">
                         <span className="material-symbols-outlined text-error">healing</span>
                         <span className="text-[10px] text-error/80 font-mono uppercase animate-pulse">Consume</span>
                      </div>
                      <div>
                         <div className="text-sm font-bold text-error tracking-widest">GREEN_HERB</div>
                         <div className="text-[8px] font-mono text-error/40 truncate">{h.objectId}</div>
                      </div>
                   </div>
                 ))}

                 {/* Fragments Blocks */}
                 {inventory.fragments.map(f => (
                   <div key={f.objectId} className="bg-surface-container border border-amber-500/40 p-4 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                         <span className="material-symbols-outlined text-amber-500">science</span>
                      </div>
                      <div>
                         <div className="text-sm font-bold text-amber-500 tracking-widest">VACCINE_FRAG</div>
                         <div className="text-[8px] font-mono text-amber-500/40 truncate">{f.objectId}</div>
                      </div>
                   </div>
                 ))}

              </div>
            </div>
          </div>
        )}

        {/* Global Overlays (Always visible) */}
        
        {/* Upper Right: Infection Progress */}
        <div className="absolute top-8 right-8 w-80 space-y-4">
          <div className="bg-surface-container-high/80 backdrop-blur-sm p-4 border-l-4 border-primary-container z-20">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-bold tracking-widest text-primary/70">VIRAL_LOAD_VECTORS</span>
              <span className="text-2xl font-black text-primary leading-none">{infectionRate.toFixed(1)}%</span>
            </div>
            <div className="h-1 bg-surface-container-low w-full overflow-hidden">
               <div className="h-full bg-primary-container shadow-[0_0_10px_orange]" style={{ width: `${Math.max(1, infectionRate)}%` }}></div>
            </div>
            <div className="mt-2 text-[9px] text-primary/40 flex justify-between uppercase">
              <span>System Vulnerability</span>
              <span className={infectionRate > 70 ? "text-error animate-pulse" : ""}>
                 {infectionRate > 70 ? "Critical Threshold Breached" : "Nominal Variance"}
              </span>
            </div>
          </div>
        </div>

        {/* Lower Left: Biometrics */}
        <div className="absolute bottom-8 left-8 w-72 z-20">
          <div className="bg-surface-container-low/80 backdrop-blur-sm p-4 space-y-4 border border-red-900/10">
            <div className="flex justify-between items-end px-1">
               <div className="text-sm font-mono text-on-surface uppercase tracking-widest">HUNTER VITALS</div>
               <div className="text-lg font-black text-primary">{(100 - (infectionRate / 2)).toFixed(0)}%</div>
            </div>
            
            <div className="h-3 bg-surface-container-lowest w-full relative overflow-hidden">
               <div className="absolute inset-y-0 left-0 bg-primary-container shadow-[0_0_15px_rgba(178,34,34,0.6)] transition-all" style={{ width: `${100 - (infectionRate / 2)}%` }}></div>
               <div className="absolute inset-y-0 left-0 bg-primary w-[20%] opacity-40 animate-pulse"></div>
            </div>
            
            <div className="flex gap-2">
               {[...Array(4)].map((_, i) => (
                   <div key={`hp-seg-${i}`} className={`h-1 w-1/4 ${i < (4 - Math.floor(infectionRate / 25)) ? 'bg-primary' : 'bg-surface-container-high'}`}></div>
               ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-red-900/20">
              <div>
                <div className="text-[8px] text-primary/60 uppercase">Adrenaline</div>
                <div className="text-xs font-bold text-primary">{connected ? "ELEVATED" : "STANDBY"}</div>
              </div>
              <div>
                <div className="text-[8px] text-primary/60 uppercase">System Status</div>
                <div className="text-xs font-bold text-primary">{connected ? "ACTIVE" : "OFFLINE"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Right: Mini Map & Ammo */}
        <div className="absolute bottom-8 right-8 text-right flex flex-col items-end gap-4 z-20">
            
            {/* Logs overlay */}
            <div className="w-80 h-24 flex flex-col justify-end text-left p-3 custom-scrollbar overflow-y-auto mix-blend-screen opacity-70">
                {logs.map((L, index) => (
                    <div key={index} className={`font-mono text-[9px] ${index === logs.length - 1 ? 'text-primary' : 'text-primary/50'}`}>
                        {L}
                    </div>
                ))}
            </div>

            <div className="bg-surface-container-low p-4 text-right border border-red-900/10 backdrop-blur-sm w-48">
              <div className="text-[10px] font-mono tracking-[0.5em] text-primary/60 mb-1 uppercase">AMMO_CAPVITAL</div>
              <div className="flex items-baseline justify-end gap-2">
                 <span className="text-5xl font-black text-primary font-headline tracking-tighter">{inventory.ammo.length}</span>
              </div>
              <div className="mt-2 justify-end flex gap-4">
                  <div className="text-right">
                     <span className="text-[8px] uppercase tracking-widest text-primary/40 block">FRAGMENTS</span>
                     <span className="text-sm font-bold text-amber-500">{inventory.fragments.length}/10</span>
                  </div>
              </div>
            </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-[#200e0e] border-t-2 border-red-900/20 md:hidden">
        <button onClick={() => setActiveTab('MAP')} className={`flex flex-col items-center justify-center p-2 font-headline text-[10px] font-bold tracking-widest ${activeTab === 'MAP' ? 'text-red-100 bg-red-700 scale-105' : 'text-red-900 hover:bg-red-950'}`}>
          <span className="material-symbols-outlined text-2xl mb-1">map</span>
          MAP
        </button>
        <button onClick={() => setActiveTab('BIO')} className={`flex flex-col items-center justify-center p-2 font-headline text-[10px] font-bold tracking-widest ${activeTab === 'BIO' ? 'text-red-100 bg-red-700 scale-105' : 'text-red-900 hover:bg-red-950'}`}>
          <span className="material-symbols-outlined text-2xl mb-1">biotech</span>
          BIO
        </button>
        <button onClick={() => setActiveTab('INV')} className={`flex flex-col items-center justify-center p-2 font-headline text-[10px] font-bold tracking-widest ${activeTab === 'INV' ? 'text-red-100 bg-red-700 scale-105' : 'text-red-900 hover:bg-red-950'}`}>
          <span className="material-symbols-outlined text-2xl mb-1">inventory_2</span>
          INV
        </button>
      </nav>

    </div>
  );
}
