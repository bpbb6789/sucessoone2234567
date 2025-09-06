const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Content Coin System", function () {
  let factory, admin, creator, user, token, exchange;
  let adminAddress, creatorAddress, userAddress;
  
  const defaultK = ethers.utils.parseUnits("1", 12); // 1e12
  const tokenSupply = ethers.utils.parseUnits("1000000", 18); // 1M tokens
  
  beforeEach(async function () {
    [admin, creator, user] = await ethers.getSigners();
    adminAddress = admin.address;
    creatorAddress = creator.address;
    userAddress = user.address;
    
    // Deploy factory
    const BondingCurveFactory = await ethers.getContractFactory("BondingCurveFactory");
    factory = await BondingCurveFactory.deploy(adminAddress, defaultK);
    await factory.deployed();
  });

  describe("Factory Deployment", function () {
    it("Should deploy factory with correct parameters", async function () {
      expect(await factory.admin()).to.equal(adminAddress);
      expect(await factory.defaultK()).to.equal(defaultK);
    });

    it("Should create content coin with bonding curve", async function () {
      const tx = await factory.connect(creator).createContentCoinWithCurve(
        "Test Content Coin",
        "TCC",
        tokenSupply,
        18
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "ContentCoinAndCurveCreated");
      
      expect(event).to.not.be.undefined;
      expect(event.args.creator).to.equal(creatorAddress);
      expect(event.args.initialSupply).to.equal(tokenSupply);
      
      const tokenAddress = event.args.token;
      const curveAddress = event.args.curve;
      
      // Get contract instances
      const ContentCoin = await ethers.getContractFactory("ContentCoin");
      const BondingCurveExchange = await ethers.getContractFactory("BondingCurveExchange");
      
      token = ContentCoin.attach(tokenAddress);
      exchange = BondingCurveExchange.attach(curveAddress);
      
      // Verify token properties
      expect(await token.name()).to.equal("Test Content Coin");
      expect(await token.symbol()).to.equal("TCC");
      expect(await token.decimals()).to.equal(18);
      expect(await token.totalSupply()).to.equal(tokenSupply);
      
      // Verify exchange properties
      expect(await exchange.token()).to.equal(tokenAddress);
      expect(await exchange.creator()).to.equal(creatorAddress);
      expect(await exchange.admin()).to.equal(adminAddress);
      expect(await exchange.k()).to.equal(defaultK);
      
      // Verify tokens are in exchange vault
      expect(await token.balanceOf(curveAddress)).to.equal(tokenSupply);
      expect(await exchange.totalSupply()).to.equal(0); // No tokens sold yet
    });
  });

  describe("Bonding Curve Trading", function () {
    beforeEach(async function () {
      // Create content coin system
      const tx = await factory.connect(creator).createContentCoinWithCurve(
        "Test Content Coin",
        "TCC", 
        tokenSupply,
        18
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "ContentCoinAndCurveCreated");
      
      const tokenAddress = event.args.token;
      const curveAddress = event.args.curve;
      
      const ContentCoin = await ethers.getContractFactory("ContentCoin");
      const BondingCurveExchange = await ethers.getContractFactory("BondingCurveExchange");
      
      token = ContentCoin.attach(tokenAddress);
      exchange = BondingCurveExchange.attach(curveAddress);
    });

    it("Should calculate buy cost correctly", async function () {
      const tokensToBy = ethers.utils.parseUnits("100", 18);
      const cost = await exchange.buyCost(tokensToBy);
      
      // cost = k * (2*s*n + n^2) where s=0 initially, so cost = k * n^2
      const expectedCost = defaultK.mul(tokensToBy).mul(tokensToBy).div(ethers.utils.parseUnits("1", 36));
      expect(cost).to.equal(expectedCost);
    });

    it("Should allow buying tokens", async function () {
      const tokensToBuy = ethers.utils.parseUnits("100", 18);
      const cost = await exchange.buyCost(tokensToBuy);
      
      const initialBalance = await token.balanceOf(userAddress);
      
      await exchange.connect(user).buy(tokensToBuy, { value: cost });
      
      const finalBalance = await token.balanceOf(userAddress);
      expect(finalBalance.sub(initialBalance)).to.equal(tokensToBuy);
      expect(await exchange.totalSupply()).to.equal(tokensToBuy);
    });

    it("Should distribute fees correctly on buy", async function () {
      const tokensToBuy = ethers.utils.parseUnits("100", 18);
      const cost = await exchange.buyCost(tokensToBuy);
      
      const creatorInitialBalance = await ethers.provider.getBalance(creatorAddress);
      const adminInitialBalance = await ethers.provider.getBalance(adminAddress);
      
      await exchange.connect(user).buy(tokensToBuy, { value: cost });
      
      const creatorFinalBalance = await ethers.provider.getBalance(creatorAddress);
      const adminFinalBalance = await ethers.provider.getBalance(adminAddress);
      
      const expectedCreatorFee = cost.mul(5).div(10000); // 0.05%
      const expectedAdminFee = cost.mul(3).div(10000); // 0.03%
      
      expect(creatorFinalBalance.sub(creatorInitialBalance)).to.equal(expectedCreatorFee);
      expect(adminFinalBalance.sub(adminInitialBalance)).to.equal(expectedAdminFee);
    });

    it("Should allow selling tokens", async function () {
      // First buy some tokens
      const tokensToBuy = ethers.utils.parseUnits("100", 18);
      const buyCost = await exchange.buyCost(tokensToBuy);
      await exchange.connect(user).buy(tokensToBuy, { value: buyCost });
      
      // Approve tokens for selling
      await token.connect(user).approve(exchange.address, tokensToBuy);
      
      const sellReward = await exchange.sellReward(tokensToBuy);
      const initialEthBalance = await ethers.provider.getBalance(userAddress);
      
      const tx = await exchange.connect(user).sell(tokensToBuy);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      
      const finalEthBalance = await ethers.provider.getBalance(userAddress);
      const netReward = sellReward.mul(10000 - 8).div(10000); // Minus 0.08% total fees
      
      expect(finalEthBalance.add(gasUsed).sub(initialEthBalance)).to.be.closeTo(netReward, ethers.utils.parseEther("0.001"));
      expect(await token.balanceOf(userAddress)).to.equal(0);
      expect(await exchange.totalSupply()).to.equal(0);
    });

    it("Should update current price correctly", async function () {
      const initialPrice = await exchange.currentPricePerToken();
      expect(initialPrice).to.equal(defaultK);
      
      // Buy some tokens to increase supply and price
      const tokensToBuy = ethers.utils.parseUnits("100", 18);
      const cost = await exchange.buyCost(tokensToBuy);
      await exchange.connect(user).buy(tokensToBuy, { value: cost });
      
      const newPrice = await exchange.currentPricePerToken();
      expect(newPrice).to.be.gt(initialPrice);
    });
  });
});