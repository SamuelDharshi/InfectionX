```markdown
# ☣️ InfectionX — Tactical Bio-Hazard Survival

> **High-stakes survival RPG built on OneChain (One chain Testnet).** > Featuring a "Hazard Red" CRT tactical interface, real-time on-chain combat, and an advanced Archetype strategy system.

---

## 🕹️ Survival Flow

```text
┌─────────────────────────────────────────────────────────────────┐
│                     INFECTIONX SURVIVAL FLOW                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Connect OneWallet  →  Create Session Key (Bio-Signature)       │
│           ↓                                                     │
│  Scan Grid (OneID)   →  Select Archetype (Medic/Pointman)        │
│           ↓                                                     │
│  Combat Overlay     →  Execute Actions (Move TX)                │
│           ↓                                                     │
│  Real-time Update   →  Survival State Synchronized              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  ✅ Session Keys     ✅ Infection Meter                          │
│  ✅ On-Chain Zombies  ✅ Vaccine Minting                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (2 Minutes)

### 1. Clone and Install
```bash
git clone [https://github.com/SamuelDharshi/InfectionX.git](https://github.com/SamuelDharshi/InfectionX.git)
cd InfectionX
pnpm install
```

### 2. Configure Environment
Create a `.env.local` file in the root or `app/` directory.
```bash
cp app/.env.example .env.local
```

### 3. Deploy Move Contracts (Optional)
```bash
cd contracts/resident_system
one move build
one client publish --gas-budget 100000000
```

### 4. Launch the HUD
```bash
pnpm dev
```
* **Frontend:** `http://localhost:3000`
* **RPC Node:** `https://rpc-testnet.onelabs.cc`

---

## 📦 Monorepo Structure

| Directory | Description |
| :--- | :--- |
| `app/` | Next.js 14 App Router (Layouts & Pages) |
| `components/` | Tactical UI: HUD, Scanner, CombatOverlay |
| `context/` | OneWallet & OneID Provider Logic |
| `contracts/` | Sui Move Smart Contracts (Hunter, Virus, Raid, Lab) |
| `hooks/` | Custom hooks: `useWallet`, `useOneID`, `useGameLoop` |
| `lib/` | Contract interaction helpers & Game constants |
| `public/` | Tactical assets, CRT overlays, and icons |

---

## 🔧 Tech Stack

### Frontend (Tactical HUD)
* **Framework:** Next.js 14 (React 18, TypeScript 5)
* **Styling:** Tailwind CSS 3
* **Animations:** Framer Motion (CRT & Glitch Effects)
* **Icons:** Lucide Icons
* **Integration:** OneWallet DApp-Kit

### Contracts (Survival Logic)
* **Language:** Sui Move
* **Systems:** Hunter Profiles, Global Virus Tracking, Persistent Zombie Objects
* **Optimization:** Session Keys for gasless-feel combat

### Infrastructure (Bio-Grid)
* **Network:** OneChain Testnet (Sui-based)
* **Identity:** OneID (Bio-signature identity)
* **Discovery:** OnePlay Target (GameFi hub)

---

## 📋 Features

### ✅ User Experience
* **"Hazard Red" HUD:** Immersive CRT terminal design.
* **Bio-Grid Scanner:** Real-time scanning for Hunter profiles.
* **Tactical Sidebar:** Instant access to inventory and vitals.
* **Unified Sync:** Seamless OneWallet/OneID connection.

### ✅ Gameplay Mechanics
* **Officer Archetypes:** Choose Pointman, Medic, or Sharpshooter.
* **On-Chain Combat:** Every action is a verifiable transaction.
* **Raid Operations:** Coordinate with others to down massive bosses.
* **Vaccine Lab:** Collect fragments to mint rare Cure Milestone badges.

---

## 🎯 Setup & Environment

### Prerequisites
* **Node.js:** 18+
* **pnpm:** 8+
* **Wallet:** OneWallet Extension
* **Identity:** OneID Profile

### Environment Variables
Required in `.env.local`:
```env
NEXT_PUBLIC_PACKAGE_ID=0x...
NEXT_PUBLIC_VIRUS_STATE_ID=0x...
NEXT_PUBLIC_ONECHAIN_RPC=[https://rpc-testnet.onelabs.cc](https://rpc-testnet.onelabs.cc)
```

---

## 🚨 Troubleshooting

* **"OneWallet Provider not found":** Ensure the extension is installed and unlocked.
* **"Package ID mismatch":** Verify `NEXT_PUBLIC_PACKAGE_ID` matches your latest deployment.
* **"Zombie objects not appearing":** Ensure your RPC matches the network where contracts were deployed.

---

**Version:** 1.0.0  
**Status:** ☣️ Deployment Ready  
**Network:** OneChain Testnet (Sui)  
**Transmission:** Encrypted
```

Would you like me to create a **`SUBMISSION.md`** template tailored for your OneHack 3.0 entry?
