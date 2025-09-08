const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy yield strategy contracts first
  console.log("\n=== Deploying Yield Strategy Contracts ===");
  
  const AaveStrategy = await ethers.getContractFactory("AaveStrategy");
  const aaveStrategy = await AaveStrategy.deploy();
  await aaveStrategy.deployed();
  console.log("AaveStrategy deployed to:", aaveStrategy.address);

  const YearnStrategy = await ethers.getContractFactory("YearnStrategy");
  const yearnStrategy = await YearnStrategy.deploy();
  await yearnStrategy.deployed();
  console.log("YearnStrategy deployed to:", yearnStrategy.address);

  const BeefyStrategy = await ethers.getContractFactory("BeefyStrategy");
  const beefyStrategy = await BeefyStrategy.deploy();
  await beefyStrategy.deployed();
  console.log("BeefyStrategy deployed to:", beefyStrategy.address);

  // Deploy AggLayer Router
  console.log("\n=== Deploying AggLayer Router ===");
  const AggLayerRouter = await ethers.getContractFactory("AggLayerRouter");
  const agglayerRouter = await AggLayerRouter.deploy();
  await agglayerRouter.deployed();
  console.log("AggLayerRouter deployed to:", agglayerRouter.address);

  // Configure AggLayer Router
  console.log("\n=== Configuring AggLayer Router ===");
  
  // Add supported chains (using mock chain IDs for demo)
  await agglayerRouter.addSupportedChain(137, ethers.constants.AddressZero); // Polygon
  await agglayerRouter.addSupportedChain(10, ethers.constants.AddressZero);  // Optimism
  await agglayerRouter.addSupportedChain(8453, ethers.constants.AddressZero); // Base
  console.log("Added supported chains");

  // Add yield strategies
  await agglayerRouter.addYieldStrategy(aaveStrategy.address, "Aave", 520);
  await agglayerRouter.addYieldStrategy(yearnStrategy.address, "Yearn", 480);
  await agglayerRouter.addYieldStrategy(beefyStrategy.address, "Beefy", 610);
  console.log("Added yield strategies");

  // Deploy YieldRouter
  console.log("\n=== Deploying YieldRouter ===");
  
  // For demo purposes, we'll use a mock functions router address
  const mockFunctionsRouter = ethers.constants.AddressZero;
  const mockSubscriptionId = 0;

  const YieldRouter = await ethers.getContractFactory("YieldRouter");
  const yieldRouter = await YieldRouter.deploy(
    agglayerRouter.address,
    mockFunctionsRouter,
    mockSubscriptionId
  );
  await yieldRouter.deployed();
  console.log("YieldRouter deployed to:", yieldRouter.address);

  // Summary
  console.log("\n=== Deployment Summary ===");
  console.log("AaveStrategy:", aaveStrategy.address);
  console.log("YearnStrategy:", yearnStrategy.address);
  console.log("BeefyStrategy:", beefyStrategy.address);
  console.log("AggLayerRouter:", agglayerRouter.address);
  console.log("YieldRouter:", yieldRouter.address);

  // Save addresses to a file for frontend use
  const addresses = {
    aaveStrategy: aaveStrategy.address,
    yearnStrategy: yearnStrategy.address,
    beefyStrategy: beefyStrategy.address,
    agglayerRouter: agglayerRouter.address,
    yieldRouter: yieldRouter.address,
    network: await ethers.provider.getNetwork()
  };

  const fs = require('fs');
  fs.writeFileSync('./deployed-addresses.json', JSON.stringify(addresses, null, 2));
  console.log("\nAddresses saved to deployed-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 