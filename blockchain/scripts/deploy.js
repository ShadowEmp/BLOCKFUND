require("dotenv").config();
const hre = require("hardhat");

async function main() {
  console.log("Deploying Crowdfunding contract...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.utils.formatEther(balance), "MATIC");

  const Crowdfunding = await hre.ethers.getContractFactory("Crowdfunding");
  const crowdfunding = await Crowdfunding.deploy();
  await crowdfunding.deployed();

  console.log("✅ Crowdfunding deployed to:", crowdfunding.address);
  console.log("\nAdd this to your .env file:");
  console.log(`CONTRACT_ADDRESS=${crowdfunding.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
