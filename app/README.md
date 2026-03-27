# InfectionX App

InfectionX is the frontend HUD for the GameFi survival game in this monorepo.

## Stack

- Next.js App Router + TypeScript
- OneWallet browser provider integration (window.onewallet)
- OneID browser provider integration (window.oneid)
- On-chain Move package in `contracts/resident_system`

## Environment

Create/update `.env.local`:

```env
NEXT_PUBLIC_ONEWALLET_APP_ID=<your app id>
NEXT_PUBLIC_RPC_URL=https://testnet-rpc.onelabs.cc
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_PACKAGE_ID=<published package id>
NEXT_PUBLIC_VIRUS_STATE_ID=<shared VirusState object id>
```

## Run

From repo root:

```bash
pnpm install
pnpm --filter app dev
```

Default app URL: http://localhost:3000

## Minimum live verification checklist

1. Wallet connects and displays address in HUD.
2. OneID provider is detected and profile loads in HUD.
3. Session key can be created.
4. Inventory refresh returns on-chain objects.
5. Combat and raid calls execute without mock data.

## Submission docs

Use these files for hackathon submission packaging:

- `../SUBMISSION.md`
- `../DEMO_SCRIPT.md`
