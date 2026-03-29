const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy yield strategy contracts first
  console.log("\n=== Deploying Yield Strategy Contracts ===");
  
  // Deploy real strategy contracts (using mock addresses for now)
  const RealAaveStrategy = await ethers.getContractFactory("RealAaveStrategy");
  const realAaveStrategy = await RealAaveStrategy.deploy(
    ethers.constants.AddressZero, // Aave Pool address (mock for now)
    ethers.constants.AddressZero, // USDC address (mock for now)
    ethers.constants.AddressZero  // aUSDC address (mock for now)
  );
  await realAaveStrategy.deployed();
  console.log("RealAaveStrategy deployed to:", realAaveStrategy.address);

  const RealYearnStrategy = await ethers.getContractFactory("RealYearnStrategy");
  const realYearnStrategy = await RealYearnStrategy.deploy(
    ethers.constants.AddressZero, // Yearn Vault address (mock for now)
    ethers.constants.AddressZero  // USDC address (mock for now)
  );
  await realYearnStrategy.deployed();
  console.log("RealYearnStrategy deployed to:", realYearnStrategy.address);

  const RealBeefyStrategy = await ethers.getContractFactory("RealBeefyStrategy");
  const realBeefyStrategy = await RealBeefyStrategy.deploy(
    ethers.constants.AddressZero, // Beefy Vault address (mock for now)
    ethers.constants.AddressZero  // USDC address (mock for now)
  );
  await realBeefyStrategy.deployed();
  console.log("RealBeefyStrategy deployed to:", realBeefyStrategy.address);

  // Deploy CrossChain Router
  console.log("\n=== Deploying CrossChain Router ===");
  const CrossChainRouter = await ethers.getContractFactory("CrossChainRouter");
  const crossChainRouter = await CrossChainRouter.deploy();
  await crossChainRouter.deployed();
  console.log("CrossChainRouter deployed to:", crossChainRouter.address);

  // Configure CrossChain Router
  console.log("\n=== Configuring CrossChain Router ===");
  
  // Add supported chains (using mock chain IDs for demo)
  await crossChainRouter.addSupportedChain(137, ethers.constants.AddressZero); // Polygon
  await crossChainRouter.addSupportedChain(10, ethers.constants.AddressZero);  // Optimism
  await crossChainRouter.addSupportedChain(8453, ethers.constants.AddressZero); // Base
  console.log("Added supported chains");

  // Add yield strategies
  await crossChainRouter.addYieldStrategy(realAaveStrategy.address, "Aave", 520);
  await crossChainRouter.addYieldStrategy(realYearnStrategy.address, "Yearn", 480);
  await crossChainRouter.addYieldStrategy(realBeefyStrategy.address, "Beefy", 610);
  console.log("Added yield strategies");

  // Deploy BlackBullOnmiYield
  console.log("\n=== Deploying BlackBullOnmiYield ===");
  
  // For demo purposes, we'll use a mock functions router address
  const mockFunctionsRouter = ethers.constants.AddressZero;
  const mockSubscriptionId = 0;

  const BlackBullOnmiYield = await ethers.getContractFactory("BlackBullOnmiYield");
  const blackBullOnmiYield = await BlackBullOnmiYield.deploy(
    crossChainRouter.address,
    mockFunctionsRouter,
    mockSubscriptionId
  );
  await blackBullOnmiYield.deployed();
  console.log("BlackBullOnmiYield deployed to:", blackBullOnmiYield.address);

  // Summary
  console.log("\n=== Deployment Summary ===");
  console.log("RealAaveStrategy:", realAaveStrategy.address);
  console.log("RealYearnStrategy:", realYearnStrategy.address);
  console.log("RealBeefyStrategy:", realBeefyStrategy.address);
  console.log("CrossChainRouter:", crossChainRouter.address);
  console.log("BlackBullOnmiYield:", blackBullOnmiYield.address);

  // Save addresses to a file for frontend use
  const addresses = {
    aaveStrategy: realAaveStrategy.address,
    yearnStrategy: realYearnStrategy.address,
    beefyStrategy: realBeefyStrategy.address,
    crossChainRouter: crossChainRouter.address,
    yieldRouter: blackBullOnmiYield.address,
    blackBullOnmiYield: blackBullOnmiYield.address,
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
