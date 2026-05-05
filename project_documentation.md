# BlockFund Technical Documentation

BlockFund is a high-performance, decentralized crowdfunding platform built on the Polygon blockchain. It combines the transparency of smart contracts with the speed and rich interface of a modern web application.

---

## 1. Project Architecture

The application follows a **Decentralized Tri-Layer Architecture**:

### A. Blockchain Layer (Smart Contracts)
- **Language**: Solidity 0.8.20
- **Network**: Polygon Amoy Testnet
- **Core Contract**: `Crowdfunding.sol`
- **Functions**: Handles fund locking, goal tracking, automated disbursements, and refunds.

### B. Backend Layer (API & Persistence)
- **Runtime**: Node.js with Express.js
- **Database**: SQLite (managed via Sequelize ORM)
- **Role**: Provides a fast "read-layer" for the frontend, stores campaign metadata (images, stories), and handles user authentication.

### C. Frontend Layer (Interface)
- **Framework**: React.js 18+
- **Build Tool**: Vite
- **Styling**: Vanilla CSS with modern Bento Box and Neon aesthetics.
- **Provider**: Ethers.js for blockchain interaction.

---

## 2. Methodology

BlockFund utilizes a **Consensus-First Synchronization** methodology:
- All financial state (balances, goals, deadlines) originates from the smart contract.
- The web application acts as a rich mirror. Transactions are executed against the blockchain first; only upon successful confirmation (matching IDs) is the state synced to the central database.
- **Safety Fallback**: Implements a redundant "Contract State Query" if event logs are delayed on public testnets.

---

## 3. Core Workflow

1.  **Onboarding**: User connects MetaMask and registers/logs in via JWT (JSON Web Token).
2.  **Campaign Initialization**: 
    - User uploads a high-resolution artifact (image) which is pinned to **IPFS**.
    - User triggers a blockchain transaction (`createCampaign`).
    - The frontend captures the unique `campaignId` from the blockchain.
3.  **State Syncing**: The metadata and the retrieved `campaignId` are sent to the backend to populate the dashboard.
4.  **Contribution**: Backers send MATIC directly to the contract.
5.  **Settlement**:
    - If the goal is met, the creator can `withdrawFunds`.
    - If the deadline passes without meeting the goal, backers can `refund` their own contributions.

---

## 4. Technology Stack & Tools

| Tool | Category | Specific Role in BlockFund |
| :--- | :--- | :--- |
| **Hardhat** | Blockchain Development | Compiles, tests, and deploys smart contracts to Polygon. |
| **Ethers.js** | Web3 Provider | Facilitates communication between the browser and the blockchain. |
| **React / Vite** | UI Framework | Powers the reactive, high-speed Bento Box dashboard. |
| **Sequelize** | ORM | Manages the SQLite database structure and relationships. |
| **Pinata** | IPFS Gateway | Ensures campaign images are stored decentrally and persist forever. |
| **Multer** | File Handling | Handles temporary image uploads on the server before IPFS pinning. |
| **Lucide React** | Icons | Provides the premium, sleek visual iconography for the UI. |
| **JWT** | Security | Secures private routes (like Campaign Creation) via token-based auth. |

---

## 5. Unique Technical Features

### 🛡️ Network Auto-Detection (Network Guard)
To prevent "Failed to retrieve ID" errors caused by users being on the wrong network, the app includes a dynamic **Network Guard**. It detects the current MetaMask Chain ID and provides a one-click "Switch" button in the Navbar if a mismatch is detected.

### 🔄 Dual-Stage Event Parsing
The `contractService.js` implements a robust parsing logic that can recover event data even from raw transaction logs or directly from the contract state if indexing is delayed.

### ⛽ Amoy Gas Optimization
Automatically enforces the minimum 30 Gwei tip requirement on the Polygon Amoy network to ensure transactions aren't rejected by validators for being too cheap.

---

> [!NOTE]
> This project is currently in **Beta (v2.0)**, targeting the Polygon Amoy Testnet. All campaign data is anchored to decentralized storage for maximum integrity.
