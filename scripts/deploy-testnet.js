const { ethers } = require("hardhat");
const fs = require('fs');
require("dotenv").config();

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  console.log("Network:", network.name, "Chain ID:", network.chainId);

  // Load testnet configuration
  const configPath = './config/testnet.json';
  let testnetConfig = {};
  
  try {
    const configData = fs.readFileSync(configPath, 'utf8');
    testnetConfig = JSON.parse(configData);
  } catch (error) {
    console.log("No testnet config found, using defaults");
  }

  // Deploy MockERC20 for testing
  console.log("\n=== Deploying MockERC20 ===");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockUSDC = await MockERC20.deploy("Mock USDC", "USDC", 6);
  await mockUSDC.deployed();
  console.log("MockUSDC deployed to:", mockUSDC.address);

  // Deploy yield strategy contracts
  console.log("\n=== Deploying Yield Strategy Contracts ===");
  
  const RealAaveStrategy = await ethers.getContractFactory("RealAaveStrategy");
  const realAaveStrategy = await RealAaveStrategy.deploy(
    ethers.constants.AddressZero, // Aave Pool address (mock for testnet)
    mockUSDC.address, // Use MockUSDC for testnet
    ethers.constants.AddressZero  // aUSDC address (mock for testnet)
  );
  await realAaveStrategy.deployed();
  console.log("RealAaveStrategy deployed to:", realAaveStrategy.address);

  const RealYearnStrategy = await ethers.getContractFactory("RealYearnStrategy");
  const realYearnStrategy = await RealYearnStrategy.deploy(
    ethers.constants.AddressZero, // Yearn Vault address (mock for testnet)
    mockUSDC.address  // Use MockUSDC for testnet
  );
  await realYearnStrategy.deployed();
  console.log("RealYearnStrategy deployed to:", realYearnStrategy.address);

  const RealBeefyStrategy = await ethers.getContractFactory("RealBeefyStrategy");
  const realBeefyStrategy = await RealBeefyStrategy.deploy(
    ethers.constants.AddressZero, // Beefy Vault address (mock for testnet)
    mockUSDC.address  // Use MockUSDC for testnet
  );
  await realBeefyStrategy.deployed();
  console.log("RealBeefyStrategy deployed to:", realBeefyStrategy.address);

  // Deploy LayerZero Bridge
  console.log("\n=== Deploying LayerZero Bridge ===");
  const LayerZeroBridge = await ethers.getContractFactory("LayerZeroBridge");
  
  // Get LayerZero endpoint for current network
  const lzEndpoint = getLayerZeroEndpoint(network.chainId);
  const layerZeroBridge = await LayerZeroBridge.deploy(lzEndpoint);
  await layerZeroBridge.deployed();
  console.log("LayerZeroBridge deployed to:", layerZeroBridge.address);

  // Deploy CrossChain Router
  console.log("\n=== Deploying CrossChain Router ===");
  const CrossChainRouter = await ethers.getContractFactory("CrossChainRouter");
  const crossChainRouter = await CrossChainRouter.deploy();
  await crossChainRouter.deployed();
  console.log("CrossChainRouter deployed to:", crossChainRouter.address);

  // Configure CrossChain Router
  console.log("\n=== Configuring CrossChain Router ===");
  
  // Add supported chains
  const supportedChains = [
    { chainId: 11155111, name: "Sepolia" },
    { chainId: 80001, name: "Mumbai" },
    { chainId: 420, name: "Optimism Goerli" },
    { chainId: 84531, name: "Base Goerli" }
  ];

  for (const chain of supportedChains) {
    await crossChainRouter.addSupportedChain(chain.chainId, layerZeroBridge.address);
    console.log(`Added supported chain: ${chain.name} (${chain.chainId})`);
  }

  // Add yield strategies
  await crossChainRouter.addYieldStrategy(realAaveStrategy.address, "Aave", 520);
  await crossChainRouter.addYieldStrategy(realYearnStrategy.address, "Yearn", 480);
  await crossChainRouter.addYieldStrategy(realBeefyStrategy.address, "Beefy", 610);
  console.log("Added yield strategies");

  // Deploy YieldRouter
  console.log("\n=== Deploying YieldRouter ===");
  
  const functionsRouter = process.env.CHAINLINK_FUNCTIONS_ROUTER || ethers.constants.AddressZero;
  const subscriptionId = process.env.CHAINLINK_SUBSCRIPTION_ID || 0;

  const YieldRouter = await ethers.getContractFactory("YieldRouter");
  const yieldRouter = await YieldRouter.deploy(
    crossChainRouter.address,
    functionsRouter,
    subscriptionId
  );
  await yieldRouter.deployed();
  console.log("YieldRouter deployed to:", yieldRouter.address);

  // Configure LayerZero Bridge
  console.log("\n=== Configuring LayerZero Bridge ===");
  await layerZeroBridge.addSupportedToken(mockUSDC.address);
  console.log("Added MockUSDC as supported token");

  // Mint test tokens for testing
  console.log("\n=== Minting Test Tokens ===");
  await mockUSDC.mint(deployer.address, ethers.utils.parseUnits("10000", 6));
  console.log("Minted 10,000 MockUSDC to deployer");

  // Summary
  console.log("\n=== Deployment Summary ===");
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId);
  console.log("MockUSDC:", mockUSDC.address);
  console.log("RealAaveStrategy:", realAaveStrategy.address);
  console.log("RealYearnStrategy:", realYearnStrategy.address);
  console.log("RealBeefyStrategy:", realBeefyStrategy.address);
  console.log("LayerZeroBridge:", layerZeroBridge.address);
  console.log("CrossChainRouter:", crossChainRouter.address);
  console.log("YieldRouter:", yieldRouter.address);

  // Save addresses to file
  const addresses = {
    network: network.name,
    chainId: network.chainId,
    mockUSDC: mockUSDC.address,
    aaveStrategy: realAaveStrategy.address,
    yearnStrategy: realYearnStrategy.address,
    beefyStrategy: realBeefyStrategy.address,
    layerZeroBridge: layerZeroBridge.address,
    crossChainRouter: crossChainRouter.address,
    yieldRouter: yieldRouter.address,
    deployer: deployer.address
  };

  const filename = `deployed-addresses-${network.name}.json`;
  fs.writeFileSync(filename, JSON.stringify(addresses, null, 2));
  console.log(`\nAddresses saved to ${filename}`);

  // Verification instructions
  console.log("\n=== Next Steps ===");
  console.log("1. Verify contracts on block explorer");
  console.log("2. Test deposit functionality");
  console.log("3. Test cross-chain routing");
  console.log("4. Deploy to other testnets");
}

function getLayerZeroEndpoint(chainId) {
  const endpoints = {
    11155111: "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1", // Sepolia
    80001: "0xf69186dfBa60DdB133E91E9A4B5673624293d8F8", // Mumbai
    420: "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1", // Optimism Goerli
    84531: "0x6aB5Ae6822647046626e83ee6dB8187151E1d5ab" // Base Goerli
  };
  
  return endpoints[chainId] || ethers.constants.AddressZero;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
