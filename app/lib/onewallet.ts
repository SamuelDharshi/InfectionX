"use client";

export type OwnedObject = {
  objectId: string;
  type: string;
  content?: Record<string, unknown>;
};

type OwnedObjectsResponse = { data: OwnedObject[] } | OwnedObject[];

type MoveCallArgs = {
  packageId: string;
  module: string;
  func: string;
  args?: Array<string | number | boolean>;
  typeArguments?: string[];
};

type SubscribeCallback = (event: unknown) => void;

export type OneWalletClient = {
  connect: () => Promise<{ address: string }>;
  disconnect?: () => Promise<void>;
  getOwnedObjects: (input: {
    owner: string;
    filter?: { StructType?: string };
  }) => Promise<OwnedObjectsResponse>;
  moveCall: (args: MoveCallArgs) => Promise<unknown>;
  subscribe?: (eventType: string, cb: SubscribeCallback) => Promise<() => void> | (() => void);
  subscribeEvent?: (input: {
    eventType: string;
    callback: SubscribeCallback;
  }) => Promise<() => void> | (() => void);
  getEpochDurationMs?: () => Promise<number>;
};

declare global {
  interface Window {
    onewallet?: OneWalletClient;
  }
}

export function getOneWalletClient(): OneWalletClient | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.onewallet ?? null;
}

export async function normalizeOwnedObjects(input: Promise<OwnedObjectsResponse>): Promise<OwnedObject[]> {
  const result = await input;
  return Array.isArray(result) ? result : result.data;
}

export function extractCreatedObjectId(result: unknown): string | null {
  if (!result || typeof result !== "object") {
    return null;
  }

  const root = result as Record<string, unknown>;

  if (typeof root.objectId === "string") {
    return root.objectId;
  }

  const effects = root.effects as Record<string, unknown> | undefined;
  const created = effects?.created as Array<Record<string, unknown>> | undefined;
  const first = created?.[0];
  const reference = first?.reference as Record<string, unknown> | undefined;

  if (typeof reference?.objectId === "string") {
    return reference.objectId;
  }

  return null;
}
