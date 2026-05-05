# BCT_MP - Decentralized Crowdfunding Platform

🚀 A full-stack decentralized crowdfunding platform built on the Polygon Amoy Testnet. Features smart contract escrow, IPFS storage via Pinata, a Node.js/Express backend, and a modern React frontend.

## 🛠️ Tech Stack
- **Blockchain**: Solidity, Hardhat, Ethers.js
- **Network**: Polygon Amoy Testnet (Chain ID: 80002)
- **Backend**: Node.js, Express, PostgreSQL, Sequelize, Pinata SDK
- **Frontend**: React, Tailwind CSS, Lucide React

## 📋 Prerequisites
1. **Node.js**: v18+ 
2. **PostgreSQL**: Install locally or use Docker (provided via `docker-compose.yml`)
3. **MetaMask**: Browser extension configured with Polygon Amoy network
4. **Pinata Account**: Free account for IPFS gateway and keys
5. **Alchemy/Infura Account**: Endpoint for Polygon Amoy RPC

---

## 🚀 Quick Start Guide

### 1. Smart Contract Deployment
1. Navigate to the blockchain directory: `cd blockchain`
2. Duplicate `.env.example` to `.env` and fill in your `PRIVATE_KEY`, `POLYGON_AMOY_RPC`, etc.
3. Install dependencies: `npm install`
4. Compile the contract: `npx hardhat compile --config hardhat.config.cjs`
5. Deploy to Amoy: `npx hardhat run scripts/deploy.js --network amoy --config hardhat.config.cjs`
6. **Save the deployed contract address!**

### 2. Backend Setup
1. From the project root, start PostgreSQL using Docker: `docker-compose up -d`
2. Navigate to the backend directory: `cd backend`
3. Duplicate `.env.example` to `.env`
4. Update the `.env` file with your Pinata API Keys, JWT Secret, and the **Contract Address** from step 1.
5. Install dependencies: `npm install`
6. Start the server: `npm run dev` (Runs on `http://localhost:5000`)

### 3. Frontend Setup
1. Navigate to the frontend directory: `cd frontend`
2. Duplicate `.env.example` to `.env`
3. Fill in `VITE_CONTRACT_ADDRESS` with your deployed address and `VITE_POLYGON_AMOY_RPC`.
4. Install dependencies: `npm install`
5. Start the frontend: `npm run dev`
6. Open your browser to `http://localhost:5173`

---

## 💡 Usage Workflow
1. **Connect Wallet:** Ensure MetaMask is on Polygon Amoy.
2. **Register/Login:** Create an off-chain profile linked to your wallet.
3. **Create Campaign:** Automatically uploads your image to IPFS via the backend, then prompts MetaMask to open the campaign on-chain.
4. **Contribute:** Trustless MATIC transfers directly into the smart contract escrow.
5. **Withdraw / Refund:** Handled securely via the smart contract based on the deadline and funding goal.
