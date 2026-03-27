"use client";

import { useWallet } from "../context/WalletContext";
import { ConnectButton as DappKitConnectButton } from "@onelabs/dapp-kit";
import { useOneID } from "../context/OneIDContext";

export function ConnectButton() {
  const { connected, address } = useWallet();
  const { available, connect: connectOneId, profile } = useOneID();

  return (
    <div className="flex items-center gap-4">
      {/* If connected, but OneID is available and not linked, show a link button */}
      {connected && available && !profile && (
        <button
          onClick={() => void connectOneId()}
          className="font-headline uppercase tracking-tighter text-[10px] text-error border border-error/40 px-3 py-1 bg-error/10 hover:bg-error/20 transition-colors"
        >
          LINK ONE_ID
        </button>
      )}
      
      {/* Show the actual Wallet Connect button */}
      <div className="relative group">
        <DappKitConnectButton 
          className="!font-headline !uppercase !tracking-tighter !text-sm !text-surface-container-lowest !bg-primary !px-4 !py-1 !rounded-none hover:!bg-inverse-primary !transition-colors !border-none"
        />
        {!connected && (
          <div className="absolute inset-0 border border-primary animate-ping pointer-events-none mix-blend-screen opacity-50"></div>
        )}
      </div>

      <div className="flex flex-col text-right ml-2 mr-2">
        <span className="text-[10px] font-headline text-outline-variant uppercase leading-tight">UPLINK_STATUS</span>
        <span className={`text-xs font-headline font-bold leading-tight ${connected ? 'text-primary' : 'text-error animate-pulse'}`}>
          {connected ? 'CONNECTED' : 'DISCONNECTED'}
        </span>
      </div>
    </div>
  );
}
