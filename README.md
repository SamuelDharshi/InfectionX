# InfectionX: Survival RPG ☣️

### Tactical Bio-Hazard Survival on OneChain (Sui)

InfectionX is a next-generation high-stakes survival RPG built on **OneChain (Sui Testnet)**. It features a stunning "Hazard Red" CRT-style tactical interface, real-time on-chain combat, and an advanced Archetype system for survival strategy.

![Tactical HUD Preview](https://github.com/SamuelDharshi/InfectionX/raw/main/app/public/preview.png) *(Placeholder URL - replace with your actual screenshot)*

---

## 🌩️ **The Vision**

InfectionX bridges the gap between traditional survival horror and blockchain persistence. Every bullet fired, every herb consumed, and every zombie neutralized is an on-chain transaction that evolves the state of the "Virus Grid."

## 🚀 **OneChain-Native Integration**

InfectionX is architected to leverage the full OneChain ecosystem:
- **OneWallet System**: All game actions (Firing, Healing, Recycling) are processed through the `dapp-kit` transaction engine.
- **OneID Bio-Signature**: Player identity and "On-Chain Session" status are derived from unified OneID profiles.
- **OnePlay Target**: Designed for high-performance deployment on the OnePlay GameFi hub.
- **OneTransfer Logic**: Backend support for peer-to-peer equipment drops and fragment transfers.

## 🕹️ **Core Game Engine Features**

### 🎖️ **Officer Archetypes**
Choose your specialization:
- **Pointman**: High health and durability for front-line containment.
- **Medic**: Advanced healing capabilities and high vitality.
- **Sharpshooter**: Maximum damage and critical hit probability.

### ⛓️ **On-Chain Mechanics (Sui Move)**
- **Persistent Zombies**: Small and Big zombies are tracked as unique objects on the blockchain.
- **Inventory Synchronization**: Real-time management of Green Herbs, Ammo, and Vaccine Fragments.
- **Session Keys**: Seamless, fast-paced gameplay with one-click tactical moves.

---

## 🛠️ **Tech Stack**

- **Frontend**: Next.js 14, React, Framer Motion (CRT Effects), Lucide Icons.
- **Logic**: TypeScript, Sui SDK, OneWallet DApp-Kit.
- **Backend (OneChain)**: Move Smart Contracts (Objects & Packages).
- **Styling**: TailwindCSS + Custom "Hazard Red" CSS Design System.

---

## 📦 **Installation & Setup**

### 1️⃣ **Clone the Repository**
```bash
git clone https://github.com/SamuelDharshi/InfectionX.git
cd InfectionX
```

### 2️⃣ **Install Dependencies**
```bash
pnpm install
```

### 3️⃣ **Environment Setup**
Create an `app/.env.local` file:
```env
NEXT_PUBLIC_PACKAGE_ID=0x... (Your published package)
NEXT_PUBLIC_VIRUS_STATE_ID=0x... (From contract init)
NEXT_PUBLIC_ONECHAIN_RPC=https://rpc-testnet.onelabs.cc
```

### 4️⃣ **Run Locally**
```bash
pnpm dev
```

---

## 🎮 **How to Play**

1. **Sign In**: Connect your OneWallet.
2. **Scan**: The bio-grid will scan for your unique Hunter profile on-chain.
3. **Register**: Choose your Archetype and commit your signature to the blockchain.
4. **Survive**: 
   - **Shoot**: Neutralize zombies to lower the city's infection rate.
   - **Loot**: Collect Vaccine Fragments to craft the ultimate Cure.
   - **Heal**: Use Green Herbs when your vitals enter 'WARNING' status.

---

## 📜 **License**

Project developed for the OneChain Survival Hackathon. Tactical Assets inspired by Resident System protocols.

---

### 📡 **Transmission Terminated.**
*Stay alert. Stay human.*
