# InfectionX - OneHack 3.0 Submission Pack

## Project Description / Backstory
InfectionX is a GameFi survival operations game where players act as hunters in a collapsing biohazard world. Hunters fight infected entities, coordinate boss raids, collect vaccine fragments, and mint cure badges through lab workflows.

The game loop is designed around tactical resource use (ammo and herbs), session-based actions, team coordination, and on-chain progression artifacts.

## Track
GameFi

## Core Gameplay Mechanics
1. Connect wallet and create hunter profile.
2. Create short-lived session key for fast action flow.
3. Attack infected targets using ammo.
4. Heal with herb items.
5. Join raid coordination flow and execute boss kills.
6. Collect vaccine fragments and combine them into cure milestone badges.

## Technology & Infrastructure
- Smart contracts: Move package in `contracts/resident_system`
- Frontend: Next.js app in `app`
- Network target used in development: testnet configuration

## OneChain Product Integration
- OneWallet: integrated via browser provider (`window.onewallet`) and wallet context.
- OneID: integrated via browser provider (`window.oneid`) and identity context.

Note: This project currently focuses on core OneWallet + OneID integration needed for gameplay identity and transaction execution.

## Working MVP Scope
Implemented:
- Move modules for virus state, hunter profile, zombie entities, inventory, survival flow, session keys, raid logic, and lab badge minting.
- Unit tests in Move package (all passing).
- Frontend HUD with connect flow, session countdown, scanner, infection meter, inventory panel, raid panel.

## Source Code
Monorepo root: this repository.

## Build and Test Commands
### Contracts
```bash
cd contracts/resident_system
one move build
one move test
one client active-env
one client envs
one client publish --gas-budget 100000000
```

### Frontend
```bash
pnpm --filter app build
pnpm --filter app dev
```

## Demo Video Plan (<= 3 min)
See `DEMO_SCRIPT.md`.

## What judges can verify quickly
1. Contract test results pass.
2. Frontend builds successfully.
3. Wallet and identity providers are integrated in code.
4. Gameplay screens are functional and wired to contract-facing actions.

## Known Deployment Dependencies
1. Funded testnet account for package publish.
2. Published package ID and shared object IDs set in app env.
3. Browser extensions/providers for OneWallet and OneID available in test environment.
