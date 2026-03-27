"use client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  SuiClientProvider,
  WalletProvider as DappKitWalletProvider,
  useSuiClient,
  useSignAndExecuteTransaction,
  ConnectButton,
} from '@onelabs/dapp-kit';
import { OneIDProvider } from "../context/OneIDContext";
import { WalletProvider } from "../context/WalletContext";
import { useEffect, useMemo } from 'react';
import { Transaction } from '@onelabs/sui/transactions';
import { useCurrentAccount, useDisconnectWallet } from '@onelabs/dapp-kit';
import { type OneWalletClient } from "../lib/onewallet";
import '@onelabs/dapp-kit/dist/index.css';

const queryClient = new QueryClient();

// Use OneChain testnet RPC — NOT Sui testnet
const ONECHAIN_RPC = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc-testnet.onelabs.cc';
const networks = { testnet: { url: ONECHAIN_RPC } };

function AppProviders({ children }: { children: React.ReactNode }) {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const { mutateAsync: disconnectWallet } = useDisconnectWallet();

  // Bridge dapp-kit wallet into window.onewallet immediately
  const walletClient = useMemo<OneWalletClient | null>(() => {
    if (typeof window === "undefined" || !currentAccount) return null;

    return {
      connect: async () => ({ address: currentAccount.address }),
      disconnect: async () => { await disconnectWallet(); },
      getOwnedObjects: async ({ owner, filter }: { owner: string; filter?: { StructType?: string } }) => {
        if (!owner) return { data: [] };
        let hasNextPage = true;
        let nextCursor: string | null = null;
        const objects: any[] = []; // Explicit any to match Sui response types
        try {
          while (hasNextPage) {
            const res = await suiClient.getOwnedObjects({
              owner,
              filter: filter?.StructType ? { StructType: filter.StructType } : undefined,
              options: { showContent: true, showType: true },
              cursor: nextCursor,
            });
            objects.push(...res.data);
            hasNextPage = res.hasNextPage;
            nextCursor = res.nextCursor ?? null;
          }
        } catch { return { data: [] }; }
        return {
          data: objects
            .filter(o => o.data != null)
            .map(o => ({
              objectId: o.data.objectId,
              type: o.data.type ?? '',
              content: (o.data.content as any)?.fields ?? o.data.content,
            })),
        };
      },
      moveCall: async (args: { packageId: string; module: string; func: string; args?: any[]; typeArguments?: string[] }) => {
        const tx = new Transaction();
        const callArgs = (args.args || []).map((a: unknown) => {
          if (typeof a === "string" && a.startsWith("0x")) return tx.object(a);
          if (typeof a === "string") return tx.pure.string(a);
          if (typeof a === "number") {
             if (args.func === "create_hunter") return tx.pure.u8(a);
             return tx.pure.u64(a); 
          }
          if (typeof a === "boolean") return tx.pure.bool(a);
          return a;
        });

        tx.moveCall({
          target: `${args.packageId}::${args.module}::${args.func}`,
          arguments: callArgs as any,
          typeArguments: args.typeArguments || [],
        });
        tx.setGasBudget(10000000); 
        
        return await signAndExecuteTransaction({ 
             transaction: tx,
             // @ts-expect-error - dapp-kit types might be outdated
             options: { showEffects: true, showObjectChanges: true }
        });
      },
      subscribe: async (eventType: string, cb: (e: unknown) => void) => {
        const unsub = await suiClient.subscribeEvent({
          filter: { MoveEventType: eventType },
          onMessage: cb,
        });
        return () => unsub;
      },
      getEpochDurationMs: async () => 1000,
    };
  }, [suiClient, currentAccount, signAndExecuteTransaction, disconnectWallet]);

  useEffect(() => {
    if (walletClient) {
      window.onewallet = walletClient;
    }
  }, [walletClient]);

  return (
    <OneIDProvider>
      <WalletProvider>{children}</WalletProvider>
    </OneIDProvider>
  );
}

export { ConnectButton as DappKitConnectButton };

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="testnet">
        <DappKitWalletProvider>
          <AppProviders>{children}</AppProviders>
        </DappKitWalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
