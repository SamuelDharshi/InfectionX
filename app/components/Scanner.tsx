"use client";

import { useMemo } from "react";

import { useWallet } from "../context/WalletContext";

export function Scanner() {
  const { zombies, attackSmall, connected, sessionKeyId } = useWallet();

  const rows = useMemo(
    () =>
      zombies.map((z) => {
        const threatScore = z.hp * Math.max(1, z.speedTier);
        return {
          ...z,
          threatScore,
          hpPct: Math.max(0, Math.min(100, Math.round((z.hp / 10000) * 100))),
        };
      }),
    [zombies],
  );

  return (
    <section className="panel scanner-panel">
      <div className="panel-header">
        <h2>Scanner</h2>
        <span className="panel-chip">Live Sweep</span>
      </div>
      <div className="scanlines" />
      {!connected ? <p className="panel-muted">Connect wallet to scan area threats.</p> : null}
      {connected && !sessionKeyId ? <p className="panel-muted">Create session key to attack without popup.</p> : null}
      <ul className="scanner-list">
        {rows.map((z) => (
          <li key={z.objectId} className="scanner-row">
            <div>
              <p className="scanner-title">
                {z.threatTier === "big" ? "Boss Bioform" : "Crawler"}
              </p>
              <p className="scanner-meta">Threat {z.threatScore}</p>
            </div>
            <div className="hp-wrap">
              <div className="hp-bar">
                <span style={{ width: `${z.hpPct}%` }} />
              </div>
              <button
                className="hud-button"
                type="button"
                onClick={() => void attackSmall(z.objectId)}
                disabled={!sessionKeyId || z.threatTier !== "small"}
              >
                {z.threatTier === "small" ? "Attack" : "Raid only"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
