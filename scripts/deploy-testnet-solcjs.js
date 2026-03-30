const fs = require("fs");
const path = require("path");
const solc = require("solc");
const { ethers } = require("ethers");
require("dotenv").config();

const NETWORKS = {
  sepolia: { chainId: 11155111, rpcEnv: "SEPOLIA_RPC_URL" },
  baseSepolia: { chainId: 84532, rpcEnv: "BASE_SEPOLIA_RPC_URL" },
};

function readSoliditySources(dir, prefix = "") {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out = {};

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(prefix, entry.name);
    if (entry.isDirectory()) {
      Object.assign(out, readSoliditySources(fullPath, relPath));
    } else if (entry.isFile() && entry.name.endsWith(".sol")) {
      out[path.join("contracts", relPath)] = { content: fs.readFileSync(fullPath, "utf8") };
    }
  }

  return out;
}

function findImports(importPath) {
  const candidates = [
    path.resolve(process.cwd(), importPath),
    path.resolve(process.cwd(), "contracts", importPath),
    path.resolve(process.cwd(), "node_modules", importPath),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      return { contents: fs.readFileSync(p, "utf8") };
    }
  }
  return { error: `Import not found: ${importPath}` };
}

function compileContracts() {
  const sources = readSoliditySources(path.resolve(process.cwd(), "contracts"));
  const input = {
    language: "Solidity",
    sources,
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode.object"],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
  const errors = (output.errors || []).filter((e) => e.severity === "error");
  if (errors.length) {
    throw new Error(errors.map((e) => e.formattedMessage).join("\n"));
  }
  return output.contracts;
}

function getContract(compiledContracts, contractName) {
  for (const file of Object.keys(compiledContracts)) {
    if (compiledContracts[file][contractName]) {
      return compiledContracts[file][contractName];
    }
  }
  throw new Error(`Contract not found in compiled output: ${contractName}`);
}

function getLayerZeroEndpoint(chainId) {
  const endpoints = {
    11155111: "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1", // Sepolia
    80001: "0xf69186dfBa60DdB133E91E9A4B5673624293d8F8", // Mumbai
    420: "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1", // Optimism Goerli
    84532: process.env.LAYERZERO_ENDPOINT_BASE_SEPOLIA || ethers.ZeroAddress, // Base Sepolia
  };

  return endpoints[chainId] || ethers.ZeroAddress;
}

async function deploy(contractName, compiledContracts, wallet, args = []) {
  const artifact = getContract(compiledContracts, contractName);
  const factory = new ethers.ContractFactory(artifact.abi, artifact.evm.bytecode.object, wallet);
  const contract = await factory.deploy(...args);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(`${contractName} deployed to: ${address}`);
  return { contract, address };
}

async function main() {
  const networkName = process.argv[2];
  if (!networkName || !NETWORKS[networkName]) {
    throw new Error("Usage: node scripts/deploy-testnet-solcjs.js <sepolia|baseSepolia>");
  }

  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY is required");
  }

  const rpcUrl = process.env[NETWORKS[networkName].rpcEnv];
  if (!rpcUrl) {
    throw new Error(`${NETWORKS[networkName].rpcEnv} is required`);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const network = await provider.getNetwork();

  console.log(`Deploying on ${networkName} (chainId ${Number(network.chainId)}) with: ${wallet.address}`);
  const compiledContracts = compileContracts();

  const mockUSDC = await deploy("MockERC20", compiledContracts, wallet, ["Mock USDC", "USDC", 6]);
  const realAave = await deploy("RealAaveStrategy", compiledContracts, wallet, [ethers.ZeroAddress, mockUSDC.address, ethers.ZeroAddress]);
  const realYearn = await deploy("RealYearnStrategy", compiledContracts, wallet, [ethers.ZeroAddress, mockUSDC.address]);
  const realBeefy = await deploy("RealBeefyStrategy", compiledContracts, wallet, [ethers.ZeroAddress, mockUSDC.address]);
  const lzEndpoint = getLayerZeroEndpoint(Number(network.chainId));
  const layerZeroBridge = await deploy("LayerZeroBridge", compiledContracts, wallet, [lzEndpoint]);
  const crossChainRouter = await deploy("CrossChainRouter", compiledContracts, wallet, []);

  const supportedChains = [11155111, 80001, 420, 84532];
  for (const chainId of supportedChains) {
    await (await crossChainRouter.contract.addSupportedChain(chainId, layerZeroBridge.address)).wait();
  }

  await (await crossChainRouter.contract.addYieldStrategy(realAave.address, "Aave", 520)).wait();
  await (await crossChainRouter.contract.addYieldStrategy(realYearn.address, "Yearn", 480)).wait();
  await (await crossChainRouter.contract.addYieldStrategy(realBeefy.address, "Beefy", 610)).wait();

  const functionsRouter = process.env.CHAINLINK_FUNCTIONS_ROUTER || ethers.ZeroAddress;
  const subscriptionId = process.env.CHAINLINK_SUBSCRIPTION_ID || 0;
  const blackBullOnmiYield = await deploy("BlackBullOnmiYield", compiledContracts, wallet, [
    crossChainRouter.address,
    functionsRouter,
    subscriptionId,
  ]);

  await (await layerZeroBridge.contract.addSupportedToken(mockUSDC.address)).wait();
  await (await mockUSDC.contract.mint(wallet.address, ethers.parseUnits("10000", 6))).wait();

  const addresses = {
    network: networkName,
    chainId: Number(network.chainId),
    mockUSDC: mockUSDC.address,
    aaveStrategy: realAave.address,
    yearnStrategy: realYearn.address,
    beefyStrategy: realBeefy.address,
    layerZeroBridge: layerZeroBridge.address,
    crossChainRouter: crossChainRouter.address,
    yieldRouter: blackBullOnmiYield.address,
    blackBullOnmiYield: blackBullOnmiYield.address,
    deployer: wallet.address,
  };

  const fileName = `deployed-addresses-${networkName}.json`;
  fs.writeFileSync(fileName, JSON.stringify(addresses, null, 2));
  console.log(`Addresses written to ${fileName}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
