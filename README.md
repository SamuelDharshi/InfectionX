# InfectionX — Tactical Bio-Hazard Survival on OneChain
InfectionX is a next-generation high-stakes survival RPG built on **OneChain (Sui Testnet)**. It features a stunning "Hazard Red" CRT-style tactical interface, real-time on-chain combat, and an advanced Archetype system for survival strategy.

┌─────────────────────────────────────────────────────────────────┐
│                     INFECTIONX SURVIVAL FLOW                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User connects OneWallet → Create Session Key (Bio-Signature) → │
│  Scan Grid (OneID) → User selects Archetype (Medic/Pointman) →  │
│  Combat Overlay displays live threats → User executes actions → │
│  Tactical Move (Move TX) → Real-time Survival State Update      │
│                                                                 │
│  ✅ Session Keys for fast combat                                │
│  ✅ Real-time Infection Meter                                   │
│  ✅ Persistent On-Chain Zombies                                  │
│  ✅ Vaccine Fragment Minting                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

🚀 Quick Start (2 minutes)
# 1. Clone and install
git clone https://github.com/SamuelDharshi/InfectionX.git
cd InfectionX
pnpm install

# 2. Configure environment
# Create .env.local with your package and object IDs
cp app/.env.example .env.local

# 3. Deploy Move contracts (if needed)
cd contracts/resident_system
one move build
one client publish --gas-budget 100000000

# 4. Start the HUD
pnpm dev

Frontend: http://localhost:3000
RPC Node: https://rpc-testnet.onelabs.cc

📦 Monorepo Structure
InfectionX/
├── app/                   # Next.js 14 App Router (Layouts & Pages)
├── components/            # Tactical UI: HUD, Scanner, CombatOverlay, etc.
├── context/               # OneWallet & OneID Provider Logic
├── contracts/             # Sui Move Smart Contracts
│   └── resident_system/   # Core logic: Hunter, Virus, Raid, Lab
├── hooks/                 # useWallet, useOneID, useGameLoop
├── lib/                   # Contract interaction helpers & Game constants
├── public/                # Tactical assets, CRT overlays, and icons
├── .env.local             # Local environment secrets
├── package.json           # Main dependencies and scripts
├── SUBMISSION.md          # OneHack 3.0 Submission Details
└── README.md              # You are here

🔧 Tech Stack
Frontend (Tactical HUD)
Next.js 14
  ├── React 18
  ├── TypeScript 5
  ├── Tailwind CSS 3
  ├── Framer Motion (CRT & Glitch Effects)
  ├── Lucide Icons (HUD Symbols)
  └── OneWallet DApp-Kit (Wallet sync)

Contracts (Survival Logic)
Sui Move
  ├── Hunter Profiles (Archetype specialization)
  ├── Virus State (Global infection tracking)
  ├── Zombie Objects (Persistent on-chain entities)
  ├── Session Keys (Fast-paced tactical moves)
  └── Raid Engine (Boss coordination flow)

Infrastructure (Bio-Grid)
OneChain Testnet (Sui-based)
  ├── OneWallet (Transaction execution)
  ├── OneID (Bio-signature identity)
  ├── OnePlay Target (GameFi hub readiness)
  └── RPC Nodes (Real-time state queries)

📋 Features
✅ User Experience
"Hazard Red" HUD: Immersive CRT terminal design
Bio-Grid Scanner: Real-time scan for Hunter profiles
Infection Meter: Global virus spread tracking
Tactical Sidebar: Instant access to inventory and vital stats
OneWallet/OneID Sync: Unified identity and wallet connection

✅ Gameplay Mechanics
Officer Archetypes: Choose between Pointman, Medic, or Sharpshooter
On-Chain Combat: Every shot and heal is a verifiable transaction
Persistent Threats: Zombies are tracked as unique blockchain objects
Raid Operations: Coordinate with other Hunters to take down massive bosses
Vaccine Lab: Collect fragments and mint rare Cure Milestone badges

✅ Blockchain Features
Session Keys: Execute combat moves without repeated popups
Object Ownership: Loot items and fragments owned directly by Hunters
Atomic Actions: Secure resource consumption and reward distribution
On-Chain Progression: Survivor stats and achievements persist forever

🎯 Setup
Prerequisites
Node.js 18+ (node --version)
pnpm 8+ (pnpm --version)
OneWallet Extension (for transaction signing)
OneID Profile (for identity verification)

Environment Variables
Create `.env.local` in the root (or `app/`):
NEXT_PUBLIC_PACKAGE_ID=0x... (Your published package)
NEXT_PUBLIC_VIRUS_STATE_ID=0x... (From contract init)
NEXT_PUBLIC_ONECHAIN_RPC=https://rpc-testnet.onelabs.cc

🏃 Running
Development
pnpm dev
# Starts the Next.js HUD on port 3000

Build
pnpm build
# Compiles the production-ready tactical interface

Deploy Contracts
cd contracts/resident_system
one move build
one client publish --gas-budget 100000000

📚 Documentation
SUBMISSION.md - Complete OneHack 3.0 submission details
DEMO_SCRIPT.md - Step-by-step gameplay walkthrough
contracts/README.md - Detailed Move module breakdown

🚨 Troubleshooting
"OneWallet Provider not found"
Ensure the OneWallet extension is installed and unlocked in your browser.

"Package ID mismatch"
Verify that `NEXT_PUBLIC_PACKAGE_ID` in `.env.local` matches the ID from your most recent contract deployment.

"Zombie objects not appearing"
Check that you are connected to the correct OneChain Testnet RPC.

Version: 1.0.0
Status: ☣️ Deployment Ready
Network: OneChain Testnet (Sui)
Transmission: Encrypted
