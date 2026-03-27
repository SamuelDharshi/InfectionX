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

export function extractCreatedObjectId(result: any): string | null {
  if (!result || typeof result !== "object") {
    return null;
  }

  // 1. Check objectChanges (Sui standard, most reliable)
  if (result.objectChanges && Array.isArray(result.objectChanges)) {
    // Find the first created object
    const created = result.objectChanges.find((c: any) => c.type === "created" || c.type === "published");
    if (created && created.objectId) {
      return created.objectId;
    }
  }

  // 2. Check effects.created (Alternative structure)
  const effects = result.effects;
  if (effects && effects.created && Array.isArray(effects.created) && effects.created.length > 0) {
    const first = effects.created[0];
    const reference = first.reference;
    if (reference && typeof reference.objectId === "string") {
      return reference.objectId;
    }
  }

  // 3. Fallback to root objectId
  if (typeof result.objectId === "string") {
    return result.objectId;
  }

  return null;
}
