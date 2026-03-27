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
import { useEffect } from 'react';
import { Transaction } from '@onelabs/sui/transactions';
import { useCurrentAccount, useDisconnectWallet } from '@onelabs/dapp-kit';
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

  useEffect(() => {
    // Bridge dapp-kit wallet into window.onewallet so WalletContext can use it
    window.onewallet = {
      connect: async () => {
        if (!currentAccount) throw new Error("Please connect via the Connect button");
        return { address: currentAccount.address };
      },
      disconnect: async () => {
        await disconnectWallet();
      },
      getOwnedObjects: async ({ owner, filter }) => {
        if (!owner) return { data: [] };
        let hasNextPage = true;
        let nextCursor: string | null = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const objects: any[] = [];
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
        } catch {
          return { data: [] };
        }
        return {
          data: objects
            .filter(o => o.data != null)
            .map(o => ({
              objectId: o.data.objectId,
              type: o.data.type ?? '',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              content: (o.data.content as any)?.fields ?? o.data.content,
            })),
        };
      },
      moveCall: async (args) => {
        const tx = new Transaction();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const callArgs = (args.args || []).map((a: any) => {
          if (typeof a === "string" && a.startsWith("0x")) return tx.object(a);
          if (typeof a === "string") return tx.pure.string(a);
          if (typeof a === "number") return tx.pure.u8(a); // Defaulting to u8 for class, or let user pass TxArg
          if (typeof a === "boolean") return tx.pure.bool(a);
          return a;
        }) as any;
        tx.moveCall({
          target: `${args.packageId}::${args.module}::${args.func}`,
          arguments: callArgs,
          typeArguments: args.typeArguments || [],
        });
        tx.setGasBudget(100000000); // 0.1 OCT budget
        const response = await signAndExecuteTransaction({ transaction: tx });
        return { digest: response.digest };
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
