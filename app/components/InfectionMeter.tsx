"use client";

import { useEffect } from "react";

import { useWallet } from "../context/WalletContext";
import { getOneWalletClient } from "../lib/onewallet";

export function InfectionMeter() {
  const { infectionRate, setInfectionRate } = useWallet();

  useEffect(() => {
    const client = getOneWalletClient();
    if (!client?.subscribe) {
      return;
    }

    let unsubscribe: (() => void) | undefined;

    void Promise.resolve(
      client.subscribe("VirusStateUpdated", (event) => {
        const payload = event as Record<string, unknown>;
        const value = payload.infection_rate ?? payload.infectionRate;
        if (typeof value === "number") {
          setInfectionRate(value);
        } else if (typeof value === "string") {
          const parsed = Number(value);
          if (!Number.isNaN(parsed)) {
            setInfectionRate(parsed);
          }
        }
      }),
    ).then((fn) => {
      unsubscribe = typeof fn === "function" ? fn : undefined;
    });

    return () => {
      unsubscribe?.();
    };
  }, [setInfectionRate]);

  return (
    <section className="panel infection-panel">
      <div className="panel-header">
        <h2>Global Infection</h2>
        <span className="panel-chip danger">{infectionRate}%</span>
      </div>
      <div className="infection-bar">
        <span style={{ width: `${Math.max(0, Math.min(100, infectionRate))}%` }} />
      </div>
    </section>
  );
}
