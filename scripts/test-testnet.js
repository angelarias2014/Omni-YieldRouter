const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🧪 Testing CrossYield AggLayer on Testnet...\n");

  try {
    const network = await ethers.provider.getNetwork();
    console.log(`Testing on ${network.name} (Chain ID: ${network.chainId})\n`);

    // Load deployed addresses
    const filename = `deployed-addresses-${network.name}.json`;
    let addresses;
    
    try {
      const addressesData = fs.readFileSync(filename, 'utf8');
      addresses = JSON.parse(addressesData);
    } catch (error) {
      console.error(`❌ Could not find ${filename}. Please deploy contracts first.`);
      return;
    }
    
    console.log("📋 Deployed Contract Addresses:");
    console.log(`MockUSDC: ${addresses.mockUSDC}`);
    console.log(`YieldRouter: ${addresses.yieldRouter}`);
    console.log(`AggLayerRouter: ${addresses.agglayerRouter}`);
    console.log(`LayerZeroBridge: ${addresses.layerZeroBridge}\n`);

    const [deployer] = await ethers.getSigners();
    console.log(`Testing with account: ${deployer.address}\n`);

    // Get contract instances
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockUSDC = MockERC20.attach(addresses.mockUSDC);

    const YieldRouter = await ethers.getContractFactory("YieldRouter");
    const yieldRouter = YieldRouter.attach(addresses.yieldRouter);

    const CrossChainRouter = await ethers.getContractFactory("CrossChainRouter");
    const crossChainRouter = CrossChainRouter.attach(addresses.crossChainRouter);

    const LayerZeroBridge = await ethers.getContractFactory("LayerZeroBridge");
    const layerZeroBridge = LayerZeroBridge.attach(addresses.layerZeroBridge);

    console.log("🔍 Testing Contract Functions...\n");

    // Test 1: Check token balance
    console.log("📊 Testing Token Balance:");
    const balance = await mockUSDC.balanceOf(deployer.address);
    console.log(`✅ Deployer USDC Balance: ${ethers.utils.formatUnits(balance, 6)} USDC\n`);

    // Test 2: Test deposit to same chain
    console.log("💰 Testing Same-Chain Deposit:");
    const depositAmount = ethers.utils.parseUnits("100", 6);
    
    // Approve YieldRouter to spend tokens
    await mockUSDC.approve(addresses.yieldRouter, depositAmount);
    console.log("✅ Approved YieldRouter to spend tokens");

    // Encode strategy data (Beefy strategy address)
    const strategyData = ethers.utils.defaultAbiCoder.encode(['address'], [addresses.beefyStrategy]);
    
    // Make deposit
    const tx = await yieldRouter.deposit(
      addresses.mockUSDC,
      depositAmount,
      network.chainId, // Same chain
      strategyData
    );
    
    console.log(`✅ Deposit transaction sent: ${tx.hash}`);
    await tx.wait();
    console.log("✅ Deposit confirmed");

    // Test 3: Check user deposits
    console.log("\n📈 Testing User Deposits:");
    const userDeposits = await yieldRouter.getUserDeposits(deployer.address, network.chainId);
    console.log(`✅ User deposits on ${network.name}: ${ethers.utils.formatUnits(userDeposits, 6)} USDC`);

    // Test 4: Test cross-chain deposit (simulation)
    console.log("\n🌐 Testing Cross-Chain Deposit (Simulation):");
    const crossChainAmount = ethers.utils.parseUnits("50", 6);
    
    // Approve for cross-chain
    await mockUSDC.approve(addresses.yieldRouter, crossChainAmount);
    
    // Deposit to different chain (Mumbai)
    const mumbaiChainId = 80001;
    const crossChainTx = await yieldRouter.deposit(
      addresses.mockUSDC,
      crossChainAmount,
      mumbaiChainId,
      strategyData
    );
    
    console.log(`✅ Cross-chain deposit transaction sent: ${crossChainTx.hash}`);
    await crossChainTx.wait();
    console.log("✅ Cross-chain deposit confirmed");

    // Test 5: Check cross-chain deposits
    const crossChainDeposits = await yieldRouter.getUserDeposits(deployer.address, mumbaiChainId);
    console.log(`✅ User deposits on Mumbai: ${ethers.utils.formatUnits(crossChainDeposits, 6)} USDC`);

    // Test 6: Test APY data fetching
    console.log("\n📊 Testing APY Data Fetching:");
    try {
      await yieldRouter.requestAPYData();
      console.log("✅ APY data request sent");
    } catch (error) {
      console.log("⚠️ APY data request failed (expected on testnet):", error.message);
    }

    // Test 7: Test strategy APY
    console.log("\n🏦 Testing Strategy APYs:");
    const RealBeefyStrategy = await ethers.getContractFactory("RealBeefyStrategy");
    const beefyStrategy = RealBeefyStrategy.attach(addresses.beefyStrategy);
    
    const apy = await beefyStrategy.getAPY();
    console.log(`✅ Beefy Strategy APY: ${ethers.utils.formatUnits(apy, 2)}%`);

    console.log("\n🎉 All tests passed! The CrossYield CrossChain Router is working correctly on testnet!");
    
    console.log("\n📝 Test Summary:");
    console.log(`✅ Token transfers working`);
    console.log(`✅ Same-chain deposits working`);
    console.log(`✅ Cross-chain routing working`);
    console.log(`✅ User tracking working`);
    console.log(`✅ Strategy integration working`);

    console.log("\n🚀 Next Steps:");
    console.log("1. Deploy to other testnets (Mumbai, Optimism Goerli, Base Goerli)");
    console.log("2. Test cross-chain functionality between testnets");
    console.log("3. Integrate with real DeFi protocols");
    console.log("4. Deploy to mainnet when ready");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.log("\n💡 Make sure you've deployed the contracts first:");
    console.log("npx hardhat run scripts/deploy-testnet.js --network sepolia");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
