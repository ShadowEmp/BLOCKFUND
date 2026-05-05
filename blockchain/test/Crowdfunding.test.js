const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crowdfunding", function () {
  let crowdfunding;
  let owner, creator, contributor1, contributor2;
  const ONE_DAY = 86400;
  const GOAL = ethers.utils.parseEther("1.0"); // 1 MATIC

  beforeEach(async function () {
    [owner, creator, contributor1, contributor2] = await ethers.getSigners();
    const Crowdfunding = await ethers.getContractFactory("Crowdfunding");
    crowdfunding = await Crowdfunding.deploy();
    await crowdfunding.deployed();
  });

  // ─── Campaign Creation ──────────────────────────────────
  describe("createCampaign", function () {
    it("Should create a campaign successfully", async function () {
      const deadline = (await time.latest()) + ONE_DAY;
      await expect(
        crowdfunding.connect(creator).createCampaign(
          "Test Campaign", "Description", GOAL, deadline, "QmTestHash"
        )
      )
        .to.emit(crowdfunding, "CampaignCreated")
        .withArgs(1, creator.address, "Test Campaign", GOAL, deadline);

      const c = await crowdfunding.getCampaign(1);
      expect(c.title).to.equal("Test Campaign");
      expect(c.goal).to.equal(GOAL);
      expect(c.creator).to.equal(creator.address);
    });

    it("Should fail with zero goal", async function () {
      const deadline = (await time.latest()) + ONE_DAY;
      await expect(
        crowdfunding.connect(creator).createCampaign("T", "D", 0, deadline, "hash")
      ).to.be.revertedWith("Goal must be greater than zero");
    });

    it("Should fail if deadline is in the past", async function () {
      const pastDeadline = (await time.latest()) - ONE_DAY;
      await expect(
        crowdfunding.connect(creator).createCampaign("T", "D", GOAL, pastDeadline, "hash")
      ).to.be.revertedWith("Deadline must be in the future");
    });
  });

  // ─── Contributions ──────────────────────────────────────
  describe("contribute", function () {
    let deadline;
    beforeEach(async function () {
      deadline = (await time.latest()) + ONE_DAY;
      await crowdfunding.connect(creator).createCampaign("Test", "Desc", GOAL, deadline, "hash");
    });

    it("Should accept a contribution", async function () {
      const amount = ethers.utils.parseEther("0.5");
      await expect(
        crowdfunding.connect(contributor1).contribute(1, { value: amount })
      )
        .to.emit(crowdfunding, "FundReceived")
        .withArgs(1, contributor1.address, amount);

      const c = await crowdfunding.getCampaign(1);
      expect(c.amountRaised).to.equal(amount);
    });

    it("Should fail if campaign ended", async function () {
      await time.increaseTo(deadline + 1);
      await expect(
        crowdfunding.connect(contributor1).contribute(1, { value: ethers.utils.parseEther("0.1") })
      ).to.be.revertedWith("Campaign has ended");
    });

    it("Should fail with zero value", async function () {
      await expect(
        crowdfunding.connect(contributor1).contribute(1, { value: 0 })
      ).to.be.revertedWith("Contribution must be greater than zero");
    });
  });

  // ─── Withdrawal ─────────────────────────────────────────
  describe("withdrawFunds", function () {
    let deadline;
    beforeEach(async function () {
      deadline = (await time.latest()) + ONE_DAY;
      await crowdfunding.connect(creator).createCampaign("Test", "Desc", GOAL, deadline, "hash");
      await crowdfunding.connect(contributor1).contribute(1, { value: GOAL });
    });

    it("Should allow creator to withdraw after goal met", async function () {
      await time.increaseTo(deadline + 1);
      const balanceBefore = await ethers.provider.getBalance(creator.address);
      const tx = await crowdfunding.connect(creator).withdrawFunds(1);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      const balanceAfter = await ethers.provider.getBalance(creator.address);
      expect(balanceAfter.add(gasUsed)).to.be.gt(balanceBefore);
    });

    it("Should fail if deadline not passed", async function () {
      await expect(
        crowdfunding.connect(creator).withdrawFunds(1)
      ).to.be.revertedWith("Deadline not reached yet");
    });

    it("Should fail if not creator", async function () {
      await time.increaseTo(deadline + 1);
      await expect(
        crowdfunding.connect(contributor1).withdrawFunds(1)
      ).to.be.revertedWith("Not campaign creator");
    });

    it("Should fail if goal not met", async function () {
      const deadline2 = (await time.latest()) + ONE_DAY;
      await crowdfunding.connect(creator).createCampaign("T2", "D", GOAL, deadline2, "hash");
      await crowdfunding.connect(contributor1).contribute(2, { value: ethers.utils.parseEther("0.4") });
      await time.increaseTo(deadline2 + 1);
      await expect(
        crowdfunding.connect(creator).withdrawFunds(2)
      ).to.be.revertedWith("Funding goal not reached");
    });
  });

  // ─── Refund ─────────────────────────────────────────────
  describe("refund", function () {
    let deadline;
    const PARTIAL = ethers.utils.parseEther("0.4");

    beforeEach(async function () {
      deadline = (await time.latest()) + ONE_DAY;
      await crowdfunding.connect(creator).createCampaign("Test", "Desc", GOAL, deadline, "hash");
      await crowdfunding.connect(contributor1).contribute(1, { value: PARTIAL });
    });

    it("Should refund contributor if goal not met after deadline", async function () {
      await time.increaseTo(deadline + 1);
      const balanceBefore = await ethers.provider.getBalance(contributor1.address);
      const tx = await crowdfunding.connect(contributor1).refund(1);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      const balanceAfter = await ethers.provider.getBalance(contributor1.address);
      expect(balanceAfter.add(gasUsed)).to.be.closeTo(
        balanceBefore.add(PARTIAL),
        ethers.utils.parseEther("0.001")
      );
    });

    it("Should fail refund if goal was met", async function () {
      await crowdfunding.connect(contributor2).contribute(1, { value: ethers.utils.parseEther("0.6") });
      await time.increaseTo(deadline + 1);
      await expect(
        crowdfunding.connect(contributor1).refund(1)
      ).to.be.revertedWith("Goal was reached, no refund");
    });

    it("Should fail if no contribution made", async function () {
      await time.increaseTo(deadline + 1);
      await expect(
        crowdfunding.connect(contributor2).refund(1)
      ).to.be.revertedWith("No contribution to refund");
    });
  });
});
