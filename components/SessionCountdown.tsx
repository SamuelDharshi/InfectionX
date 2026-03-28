"use client";

import { useEffect, useMemo, useState } from "react";

import { useWallet } from "../context/WalletContext";

function formatMs(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, "0");
  const sec = (totalSec % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}

export function SessionCountdown() {
  const { connected, sessionKeyId, sessionExpiresAtMs, createOrRefreshSession } = useWallet();
  const [now, setNow] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remaining = Math.max(0, sessionExpiresAtMs - now);
  const expired = Boolean(sessionKeyId) && remaining === 0;

  const label = useMemo(() => {
    if (!connected) {
      return "No active wallet";
    }
    if (!sessionKeyId) {
      return "No session key";
    }
    return formatMs(remaining);
  }, [connected, remaining, sessionKeyId]);

  return (
    <div className="session-chip">
      <div>
        <p className="session-title">Session Key</p>
        <p className="session-value">{label}</p>
      </div>
      <button className="hud-button" type="button" onClick={() => void createOrRefreshSession(600)}>
        {expired || !sessionKeyId ? "Re-sign" : "Renew"}
      </button>
    </div>
  );
}
