"use client";

import { useEffect, useState } from "react";

import { useWallet } from "../context/WalletContext";
import { getOneWalletClient } from "../lib/onewallet";

export function RaidLobby() {
  const { raidState, readyUp, executeRaid, refreshRaidState } = useWallet();
  const [showKillFlash, setShowKillFlash] = useState(false);

  useEffect(() => {
    void refreshRaidState();
  }, [refreshRaidState]);

  useEffect(() => {
    const client = getOneWalletClient();
    if (!client?.subscribe) {
      return;
    }

    let unsubscribe: (() => void) | undefined;
    void Promise.resolve(
      client.subscribe("BossKilledEvent", () => {
        setShowKillFlash(true);
        window.setTimeout(() => setShowKillFlash(false), 1400);
        void refreshRaidState();
      }),
    ).then((fn) => {
      unsubscribe = typeof fn === "function" ? fn : undefined;
    });

    return () => {
      unsubscribe?.();
    };
  }, [refreshRaidState]);

  return (
    <section className={`panel raid-panel ${showKillFlash ? "boss-killed" : ""}`}>
      <div className="panel-header">
        <h2>Raid Lobby</h2>
        <span className="panel-chip">Boss HP {raidState.bossHp}</span>
      </div>
      <ul className="raid-list">
        {raidState.participants.map((p) => (
          <li key={p.address} className="raid-row">
            <span>{p.address.slice(0, 6)}...{p.address.slice(-4)}</span>
            <span className={p.ready ? "ready-yes" : "ready-no"}>{p.ready ? "Ready" : "Waiting"}</span>
          </li>
        ))}
      </ul>
      <div className="raid-actions">
        <button className="hud-button" type="button" onClick={() => void readyUp()}>
          Ready Up
        </button>
        <button
          className="hud-button"
          type="button"
          onClick={() => void executeRaid()}
          disabled={!raidState.allReady}
        >
          Execute Raid
        </button>
      </div>
      {showKillFlash ? <p className="raid-fragment-toast">Boss down. Fragments distributed.</p> : null}
    </section>
  );
}
