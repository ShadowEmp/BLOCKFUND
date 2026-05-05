const hre = require("hardhat");

async function main() {
  console.log("🌱 Starting EXTENDED Data Seed Process...");
  
  // Connect to the deployed contract
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) throw new Error("CONTRACT_ADDRESS not found in .env");

  const Crowdfunding = await hre.ethers.getContractFactory("Crowdfunding");
  const crowdfunding = Crowdfunding.attach(contractAddress);

  const signers = await hre.ethers.getSigners();
  const creator1 = signers[1];
  const creator2 = signers[2];
  const creator3 = signers[3];
  const creator4 = signers[6];
  const creator5 = signers[7];
  
  const backer1 = signers[4];
  const backer2 = signers[5];
  const backer3 = signers[8];

  const campaignsData = [
    {
        title: "Orbital Storage Protocol",
        desc: "Building a decentralized data layer resilient to solar flares and EMP attacks utilizing a network of low-orbit nano-satellites. Be a part of the true untouchable web.",
        goal: 5,
        days: 30,
        ipfs: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
        creator: creator1
    },
    {
        title: "Neon Horizon - Game Engine",
        desc: "An open-source, blockchain-native game engine designed explicitly for handling thousands of micro-transactions per second using state channels.",
        goal: 10,
        days: 15,
        ipfs: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
        creator: creator2
    },
    {
        title: "Quantum Randomness Oracle",
        desc: "Integrating true quantum noise generators into a verifiable smart contract oracle for high-stakes decentralized applications.",
        goal: 20,
        days: 1,
        ipfs: "QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn",
        creator: creator3
    },
    {
        title: "dVPN - Sentinel Relay",
        desc: "A completely decentralized VPN masking protocol heavily encrypted by zero-knowledge proofs. Privacy is a right, not a feature.",
        goal: 15,
        days: 45,
        ipfs: "QmZ1Ba3n5xG53o3E1yW2M4X7uRn4uRn4uRn4uRn4uRn4u",
        creator: creator4
    },
    {
        title: "Tokenized Real Estate (Berlin)",
        desc: "Fractional ownership of prime real estate in Berlin. Rent yields are distributed weekly via smart contract automated payouts.",
        goal: 50,
        days: 60,
        ipfs: "QmR2Bc4n5xG53o3E1yW2M4X7uRn4uRn4uRn4uRn4uRn4B",
        creator: creator5
    },
    {
        title: "Zero-Knowledge Credit Scoring",
        desc: "Generate credit scores for undercollateralized DeFi loans without revealing identity, leveraging massive neural networks and zk-SNARKs.",
        goal: 25,
        days: 12,
        ipfs: "QmK9Bc4n5xG53o3E1yW2M4X7uRn4uRn4uRn4uRn4uRn4Z",
        creator: creator1
    },
    {
        title: "Cybernetics NFT Collective",
        desc: "A sprawling generative art collection providing holders access to an exclusive DAO and private algorithmic trading pools.",
        goal: 30,
        days: 20,
        ipfs: "QmP7Bc4n5xG53o3E1yW2M4X7uRn4uRn4uRn4uRn4uRn4A",
        creator: creator2
    }
  ];

  let campaignContractIds = [];

  for (let i = 0; i < campaignsData.length; i++) {
      console.log(`📦 Creating Campaign: ${campaignsData[i].title}...`);
      let tx = await crowdfunding.connect(campaignsData[i].creator).createCampaign(
          campaignsData[i].title,
          campaignsData[i].desc,
          hre.ethers.utils.parseEther(campaignsData[i].goal.toString()), 
          Math.floor(Date.now() / 1000) + (86400 * campaignsData[i].days), 
          campaignsData[i].ipfs
      );
      let receipt = await tx.wait();
      let campId = receipt.events.find(e => e.event === 'CampaignCreated').args.campaignId.toNumber();
      campaignContractIds.push(campId);
  }

  console.log("💸 Simulating Global Liquidity Injections...");
  // Simulate some randomized contributions
  await crowdfunding.connect(backer1).contribute(campaignContractIds[0], { value: hre.ethers.utils.parseEther("1.5") });
  await crowdfunding.connect(backer2).contribute(campaignContractIds[0], { value: hre.ethers.utils.parseEther("0.5") });
  await crowdfunding.connect(backer1).contribute(campaignContractIds[1], { value: hre.ethers.utils.parseEther("8.0") }); 
  await crowdfunding.connect(backer3).contribute(campaignContractIds[3], { value: hre.ethers.utils.parseEther("5.0") });
  await crowdfunding.connect(creator3).contribute(campaignContractIds[4], { value: hre.ethers.utils.parseEther("12.0") });
  await crowdfunding.connect(backer2).contribute(campaignContractIds[6], { value: hre.ethers.utils.parseEther("2.0") });

  console.log("💾 Syncing with Backend SQLite Database...");
  
  // Sync to Backend via direct Sequelize access
  const path = require('path');
  const User = require('../../backend/src/models/User');
  const Campaign = require('../../backend/src/models/Campaign');

  try {
      // Ensure DB tables exist
      await require('../../backend/src/models').sync();

      // Ensure users exist
      await User.findOrCreate({ where: { wallet_address: creator1.address }, defaults: { email: 'creator1@orbit.xyz', password_hash: 'abcd' } });
      await User.findOrCreate({ where: { wallet_address: creator2.address }, defaults: { email: 'creator2@neon.xyz', password_hash: 'abcd' } });
      await User.findOrCreate({ where: { wallet_address: creator3.address }, defaults: { email: 'creator3@quantum.xyz', password_hash: 'abcd' } });
      await User.findOrCreate({ where: { wallet_address: creator4.address }, defaults: { email: 'creator4@dvpn.xyz', password_hash: 'abcd' } });
      await User.findOrCreate({ where: { wallet_address: creator5.address }, defaults: { email: 'creator5@realestate.xyz', password_hash: 'abcd' } });

      // Create Database Campaigns
      for (let i = 0; i < campaignsData.length; i++) {
        await Campaign.findOrCreate({ 
            where: { contract_campaign_id: campaignContractIds[i] },
            defaults: {
                title: campaignsData[i].title,
                description: campaignsData[i].desc,
                goal: campaignsData[i].goal,
                deadline: new Date(Date.now() + (86400000 * campaignsData[i].days)),
                ipfs_hash: campaignsData[i].ipfs,
                creator_wallet: campaignsData[i].creator.address
            }
        });
      }
  } catch (err) {
      console.log("Database Sync Error:", err);
  }

  console.log("✅ EXTENDED Seeding completed perfectly.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
