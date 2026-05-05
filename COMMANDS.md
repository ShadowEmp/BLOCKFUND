# 🚀 How to Run BCT_MP Locally

Because this project involves a blockchain, a backend server, and a frontend user interface, you need to run **three separate terminals** simultaneously. 

Follow these steps exactly to run the local decentralized environment.

---

### Terminal 1: The Blockchain Node ⛓️
*This starts the local Ethereum/Polygon blockchain. Leave this running in the background.*
```powershell
cd blockchain
npx hardhat node
```

---

### Terminal 2: Deploy, Seed & Run Backend ⚙️
*Once Terminal 1 is running, open a **brand new** terminal window. We need to deploy the contract to our local node, inject the fake demo data, and then start the backend API.*

1. **Deploy & Seed (Run these one by one):**
```powershell
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
npx hardhat run scripts/seed.js --network localhost
```

2. **Start Backend Server:**
```powershell
cd ../backend
npm run dev
```
*(Leave this running. It will say "Database connected" and "Server running on port 5000")*

---

### Terminal 3: Run the Frontend UI 💻
*Open a **third** final terminal window to start the React Interface.*

```powershell
cd frontend
npm run dev
```

**✅ You are done!** 
Open your web browser and go to: **[http://localhost:5173/](http://localhost:5173/)**
