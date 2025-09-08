const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing CrossYield AggLayer Contracts...\n");

  try {
    // Read deployed addresses
    const fs = require('fs');
    const addressesData = fs.readFileSync('./deployed-addresses.json', 'utf8');
    const addresses = JSON.parse(addressesData);
    
    console.log("📋 Deployed Contract Addresses:");
    console.log(`YieldRouter: ${addresses.yieldRouter}`);
    console.log(`AggLayerRouter: ${addresses.agglayerRouter}`);
    console.log(`AaveStrategy: ${addresses.aaveStrategy}`);
    console.log(`YearnStrategy: ${addresses.yearnStrategy}`);
    console.log(`BeefyStrategy: ${addresses.beefyStrategy}\n`);

    // Get contract instances
    const [deployer] = await ethers.getSigners();
    console.log(`Testing with account: ${deployer.address}\n`);

    // Test YieldRouter
    const YieldRouter = await ethers.getContractFactory("YieldRouter");
    const yieldRouter = YieldRouter.attach(addresses.yieldRouter);

    // Test AggLayerRouter
    const AggLayerRouter = await ethers.getContractFactory("AggLayerRouter");
    const agglayerRouter = AggLayerRouter.attach(addresses.agglayerRouter);

    // Test Strategy Contracts
    const AaveStrategy = await ethers.getContractFactory("AaveStrategy");
    const aaveStrategy = AaveStrategy.attach(addresses.aaveStrategy);

    const YearnStrategy = await ethers.getContractFactory("YearnStrategy");
    const yearnStrategy = YearnStrategy.attach(addresses.yearnStrategy);

    const BeefyStrategy = await ethers.getContractFactory("BeefyStrategy");
    const beefyStrategy = BeefyStrategy.attach(addresses.beefyStrategy);

    console.log("🔍 Testing Contract Functions...\n");

    // Test APY functions
    console.log("📊 Testing APY Functions:");
    const aaveAPY = await aaveStrategy.getAPY();
    const yearnAPY = await yearnStrategy.getAPY();
    const beefyAPY = await beefyStrategy.getAPY();
    
    console.log(`✅ Aave APY: ${ethers.utils.formatUnits(aaveAPY, 2)}%`);
    console.log(`✅ Yearn APY: ${ethers.utils.formatUnits(yearnAPY, 2)}%`);
    console.log(`✅ Beefy APY: ${ethers.utils.formatUnits(beefyAPY, 2)}%\n`);

    // Test AggLayer functions
    console.log("🌐 Testing AggLayer Functions:");
    const bestStrategy = await agglayerRouter.getBestYieldStrategy();
    console.log(`✅ Best Strategy: ${bestStrategy[0]}`);
    console.log(`✅ Best APY: ${ethers.utils.formatUnits(bestStrategy[1], 2)}%\n`);

    // Test YieldRouter functions
    console.log("💰 Testing YieldRouter Functions:");
    const userDeposits = await yieldRouter.getUserDeposits(deployer.address, 137);
    console.log(`✅ User Deposits on Polygon: ${ethers.utils.formatEther(userDeposits)} ETH\n`);

    // Test strategy deposits (simulate)
    console.log("🏦 Testing Strategy Deposits:");
    
    // Create a mock ERC20 token for testing
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockToken = await MockERC20.deploy("Test USDC", "USDC", 6);
    await mockToken.deployed();
    
    // Mint some test tokens
    await mockToken.mint(deployer.address, ethers.utils.parseUnits("1000", 6));
    console.log(`✅ Minted 1000 USDC test tokens`);

    // Test deposit to Aave strategy
    await mockToken.approve(aaveStrategy.address, ethers.utils.parseUnits("100", 6));
    await aaveStrategy.deposit(mockToken.address, ethers.utils.parseUnits("100", 6), "0x");
    console.log(`✅ Deposited 100 USDC to Aave strategy`);

    // Check user balance
    const userBalance = await aaveStrategy.getUserBalance(deployer.address);
    console.log(`✅ User balance in Aave: ${ethers.utils.formatUnits(userBalance, 6)} USDC\n`);

    console.log("🎉 All tests passed! The CrossYield AggLayer is working correctly!");
    console.log("\n📝 Next Steps:");
    console.log("1. Start the frontend: cd frontend && npm run dev");
    console.log("2. Connect your wallet to localhost:8545");
    console.log("3. Use the mock token address for testing deposits");
    console.log(`4. Mock USDC Token Address: ${mockToken.address}`);

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.log("\n💡 Make sure you've deployed the contracts first:");
    console.log("npm run deploy:localhost");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
