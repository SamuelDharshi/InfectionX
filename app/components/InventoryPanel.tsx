"use client";

import { useMemo } from "react";

import { useWallet } from "../context/WalletContext";

export function InventoryPanel() {
  const {
    inventory,
    selectedAmmoId,
    setSelectedAmmoId,
    consumeHerb,
    refreshInventory,
    connected,
  } = useWallet();

  const slots = useMemo(
    () => [
      ...inventory.herbs.map((item) => ({
        id: item.objectId,
        label: "Green Herb",
        action: () => void consumeHerb(item.objectId),
      })),
      ...inventory.ammo.map((item) => ({
        id: item.objectId,
        label: "Ammo",
        action: () => setSelectedAmmoId(item.objectId),
      })),
      ...inventory.fragments.map((item) => ({
        id: item.objectId,
        label: "Fragment",
        action: () => undefined,
      })),
    ],
    [consumeHerb, inventory.ammo, inventory.fragments, inventory.herbs, setSelectedAmmoId],
  );

  return (
    <section className="panel inventory-panel">
      <div className="panel-header">
        <h2>Inventory</h2>
        <button className="panel-chip" type="button" onClick={() => void refreshInventory()}>
          Refresh
        </button>
      </div>
      {!connected ? <p className="panel-muted">Connect wallet to sync inventory.</p> : null}
      <p className="panel-muted">Click herb to heal. Click ammo to equip for next attack.</p>
      <div className="slot-grid">
        {slots.map((slot) => (
          <button
            key={slot.id}
            type="button"
            className={`slot ${selectedAmmoId === slot.id ? "selected" : ""}`}
            onClick={slot.action}
          >
            <span>{slot.label}</span>
            <small>{slot.id.slice(0, 8)}...</small>
          </button>
        ))}
      </div>
    </section>
  );
}
