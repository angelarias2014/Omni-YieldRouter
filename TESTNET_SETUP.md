# 🚀 CrossYield CrossChain Router Testnet Setup Guide

This guide will walk you through deploying and testing your CrossYield CrossChain Router on testnets.

## 📋 Prerequisites

### 1. **Get Testnet Tokens**
You'll need testnet ETH for gas fees:

- **Sepolia ETH**: [Sepolia Faucet](https://sepoliafaucet.com/)
- **Mumbai MATIC**: [Polygon Faucet](https://faucet.polygon.technology/)
- **Optimism Goerli ETH**: [Optimism Faucet](https://faucet.optimism.io/)
- **Base Goerli ETH**: [Base Faucet](https://faucet.quicknode.com/base/goerli)

### 2. **Get RPC URLs**
Sign up for free RPC services:
- [Infura](https://infura.io/) - Get API keys
- [Alchemy](https://alchemy.com/) - Alternative RPC provider

### 3. **Set Up Environment**
```bash
# Copy environment template
cp env.example .env

# Edit .env with your details
# Add your private key and RPC URLs
```

## 🔧 Step-by-Step Deployment

### **Step 1: Set Up Environment Variables**

Create a `.env` file with:
```env
# Your private key (NEVER commit this!)
PRIVATE_KEY=your_private_key_here

# RPC URLs (get from Infura/Alchemy)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
MUMBAI_RPC_URL=https://polygon-mumbai.infura.io/v3/YOUR_INFURA_KEY
OPTIMISM_GOERLI_RPC_URL=https://goerli.optimism.io
BASE_GOERLI_RPC_URL=https://goerli.base.org

# Chainlink Functions (optional for now)
CHAINLINK_FUNCTIONS_ROUTER=0xb83E47C2bC239B3bf370bc41e1459A34b41238D0
CHAINLINK_SUBSCRIPTION_ID=0
```

### **Step 2: Install Dependencies**
```bash
npm install
```

### **Step 3: Compile Contracts**
```bash
npm run compile
```

### **Step 4: Deploy to Sepolia (Ethereum Testnet)**
```bash
# Deploy to Sepolia
npm run deploy:sepolia

# Test the deployment
npm run test:sepolia
```

### **Step 5: Deploy to Other Testnets**
```bash
# Deploy to Mumbai (Polygon)
npm run deploy:mumbai
npm run test:mumbai

# Deploy to Optimism Goerli
npm run deploy:optimism-goerli
npm run test:optimism-goerli

# Deploy to Base Goerli
npm run deploy:base-goerli
npm run test:base-goerli
```

## 🧪 Testing Your Deployment

### **What Gets Tested:**
1. ✅ **Token Transfers** - MockUSDC minting and transfers
2. ✅ **Same-Chain Deposits** - Deposits to yield strategies on same chain
3. ✅ **Cross-Chain Routing** - Simulated cross-chain fund routing
4. ✅ **User Tracking** - Deposit tracking across chains
5. ✅ **Strategy Integration** - APY fetching from strategies
6. ✅ **LayerZero Integration** - Bridge contract deployment

### **Expected Output:**
```
🧪 Testing CrossYield AggLayer on Testnet...

📋 Deployed Contract Addresses:
MockUSDC: 0x...
YieldRouter: 0x...
AggLayerRouter: 0x...

✅ Token transfers working
✅ Same-chain deposits working
✅ Cross-chain routing working
✅ User tracking working
✅ Strategy integration working

🎉 All tests passed!
```

## 🌐 Cross-Chain Testing

### **Test Cross-Chain Functionality:**
1. **Deploy on multiple testnets** (Sepolia, Mumbai, Optimism Goerli, Base Goerli)
2. **Set up trusted remotes** between LayerZero endpoints
3. **Test fund routing** between different chains
4. **Verify deposits** on destination chains

### **LayerZero Configuration:**
```javascript
// Set trusted remotes for cross-chain communication
await layerZeroBridge.setTrustedRemote(
  80001, // Mumbai chain ID
  "0x..." // Mumbai bridge address
);
```

## 🔍 Verification

### **Verify Contracts on Block Explorers:**
- **Sepolia**: [Sepolia Etherscan](https://sepolia.etherscan.io/)
- **Mumbai**: [Mumbai Polygonscan](https://mumbai.polygonscan.com/)
- **Optimism Goerli**: [Optimism Goerli Explorer](https://goerli-optimism.etherscan.io/)
- **Base Goerli**: [Base Goerli Explorer](https://goerli.basescan.org/)

### **Contract Verification:**
```bash
# Verify contracts (optional)
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

## 🚨 Troubleshooting

### **Common Issues:**

1. **"Insufficient funds"**
   - Get testnet tokens from faucets
   - Check your wallet has enough ETH for gas

2. **"Network not supported"**
   - Check your RPC URLs in `.env`
   - Verify network configuration in `hardhat.config.js`

3. **"Contract deployment failed"**
   - Check gas limits
   - Verify contract compilation
   - Check for syntax errors

4. **"LayerZero endpoint not found"**
   - Verify LayerZero endpoint addresses
   - Check network configuration

### **Debug Commands:**
```bash
# Check network connection
npx hardhat console --network sepolia

# Check account balance
npx hardhat run scripts/check-balance.js --network sepolia
```

## 📊 Monitoring

### **Track Your Deployments:**
- Check `deployed-addresses-*.json` files for contract addresses
- Monitor transactions on block explorers
- Track gas usage and costs

### **Test Results:**
- All tests should pass on each testnet
- Cross-chain routing should work between testnets
- User deposits should be tracked correctly

## 🎯 Next Steps

After successful testnet deployment:

1. **Integrate Real DeFi Protocols**
   - Connect to real Aave, Yearn, Beefy on testnets
   - Test with real protocol tokens

2. **Cross-Chain Testing**
   - Test fund routing between all testnets
   - Verify LayerZero integration

3. **Frontend Integration**
   - Update frontend with testnet addresses
   - Test full user flow

4. **Mainnet Preparation**
   - Get real protocol addresses
   - Set up mainnet RPC URLs
   - Prepare for mainnet deployment

## 🎉 Success!

Once all tests pass, you'll have a fully functional cross-chain yield farming aggregator running on testnets! 🚀
