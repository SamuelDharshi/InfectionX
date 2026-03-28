"use client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  SuiClientProvider,
  WalletProvider as DappKitWalletProvider,
  useSignAndExecuteTransaction,
  useCurrentAccount,
  useDisconnectWallet,
} from '@onelabs/dapp-kit';
import { OneIDProvider } from "../context/OneIDContext";
import { WalletProvider } from "../context/WalletContext";
import { useEffect, useMemo } from 'react';
import { Transaction } from '@onelabs/sui/transactions';
import { SuiClient } from '@onelabs/sui/client';
import { type OneWalletClient } from "../lib/onewallet";
import '@onelabs/dapp-kit/dist/index.css';

const queryClient = new QueryClient();

// Use OneChain testnet RPC
const ONECHAIN_RPC = (typeof window !== "undefined") ? "/api/rpc" : (process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc-testnet.onelabs.cc');
const networks = { 
  testnet: { url: ONECHAIN_RPC },
  onechain: { url: ONECHAIN_RPC }
};

function AppProviders({ children }: { children: React.ReactNode }) {
  // Use a stable, local client for the bridge to prevent "Failed to fetch" dapp-kit overrides
  const localSuiClient = useMemo(() => new SuiClient({ url: ONECHAIN_RPC }), []);
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
        const objects: any[] = [];
        try {
          while (hasNextPage) {
            const res: any = await localSuiClient.getOwnedObjects({
              owner,
              filter: (filter?.StructType && filter?.StructType.length < 50) ? { StructType: filter.StructType } : undefined,
              options: { showContent: true, showType: true },
              cursor: nextCursor,
            });
            objects.push(...res.data);
            hasNextPage = res.hasNextPage;
            nextCursor = res.nextCursor ?? null;
          }
        } catch { 
          // Silently return empty on network errors (testnet may be slow)
          return { data: [] }; 
        }

        // Manual filtering for robustness
        let filteredObjects = objects;
        if (filter?.StructType) {
          filteredObjects = objects.filter(o => o.data?.type === filter.StructType);
        }

        return {
          data: filteredObjects
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
        tx.setGasBudget(20000000); 
        
        try {
          console.log(`[OneWallet Bridge] Executing ${args.module}::${args.func}...`);
          const result = await signAndExecuteTransaction({ 
               transaction: tx,
               // @ts-expect-error - dapp-kit types might be outdated
               options: { showEffects: true, showObjectChanges: true }
          });
          console.log("[OneWallet Bridge] Transaction Result:", result);
          return result;
        } catch (err) {
          console.error("[OneWallet Bridge] Transaction Failed:", err);
          throw err;
        }
      },
      subscribe: async (eventType: string, cb: (e: unknown) => void) => {
        const unsub = await localSuiClient.subscribeEvent({
          filter: { MoveEventType: eventType },
          onMessage: cb,
        });
        return () => unsub;
      },
      getEpochDurationMs: async () => 1000,
    };
  }, [localSuiClient, currentAccount, signAndExecuteTransaction, disconnectWallet]);

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

export { ConnectButton as DappKitConnectButton } from '@onelabs/dapp-kit';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="onechain">
        <DappKitWalletProvider>
          <AppProviders>{children}</AppProviders>
        </DappKitWalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
