# BlackBullOnmiYield

A production-ready cross-chain yield farming aggregator that routes funds across multiple chains using LayerZero and integrates with real DeFi protocols.

## 🚀 Features

- **Cross-Chain Routing**: Seamlessly move funds between Ethereum, Polygon, Optimism, and Base
- **Real DeFi Integration**: Direct integration with Aave, Yearn, and Beefy protocols
- **Optimal Yield**: Automatically finds the best APY across all supported protocols
- **Modern UI**: Beautiful, responsive interface with wallet integration
- **LayerZero Bridge**: Real cross-chain functionality using LayerZero infrastructure

## 🏗️ Architecture

### Smart Contracts
- **CrossChainRouter**: Main router handling cross-chain fund movements
- **BlackBullOnmiYield**: User-facing interface for deposits and withdrawals
- **LayerZeroBridge**: Cross-chain bridge implementation using LayerZero
- **Strategy Contracts**: Real integrations with DeFi protocols:
  - `RealAaveStrategy`: Aave V3 integration
  - `RealYearnStrategy`: Yearn vault integration
  - `RealBeefyStrategy`: Beefy vault integration

### Frontend
- **Next.js**: Modern React framework
- **Wagmi**: Ethereum wallet integration
- **Tailwind CSS**: Utility-first styling
- **TypeScript**: Type-safe development

## 🛠️ Setup

### Prerequisites
- Node.js 16+
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Crossyield-agglayer
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your private keys and API keys
   ```

4. **Start local development**
   ```bash
   # Terminal 1: Start Hardhat node
   npx hardhat node
   
   # Terminal 2: Deploy contracts
   npm run deploy:localhost
   
   # Terminal 3: Start frontend
   cd frontend && npm run dev
   ```

## 🚀 Deployment

### Local Development
```bash
npm run deploy:localhost
npm run test:localhost
```

### Testnet Deployment
```bash
npm run deploy:sepolia
npm run test:sepolia
```

### Mainnet Deployment
```bash
npm run deploy:mainnet
```

## 📱 Usage

1. **Connect Wallet**: Connect your MetaMask or other Web3 wallet
2. **Select Strategy**: Choose from available yield strategies
3. **Choose Chain**: Select destination chain for your deposit
4. **Deposit Funds**: Enter amount and confirm transaction
5. **Monitor Yield**: Track your earnings across protocols

## 🔧 Configuration

### Supported Networks
- **Ethereum Sepolia** (Testnet)
- **Polygon Mumbai** (Testnet)
- **Optimism Goerli** (Testnet)
- **Base Goerli** (Testnet)
- **Ethereum Mainnet**
- **Polygon Mainnet**
- **Optimism Mainnet**
- **Base Mainnet**

### DeFi Protocols
- **Aave V3**: Lending and borrowing
- **Yearn Finance**: Automated yield farming
- **Beefy Finance**: Multi-chain yield optimization

## 🧪 Testing

```bash
# Run local tests
npm run test:localhost

# Run testnet tests
npm run test:sepolia
```

## 📁 Project Structure

```
├── contracts/           # Smart contracts
│   ├── bridges/        # Cross-chain bridge implementations
│   ├── strategies/     # DeFi protocol integrations
│   └── *.sol          # Main contracts
├── scripts/            # Deployment and testing scripts
├── frontend/           # Next.js frontend application
├── config/             # Configuration files
└── docs/              # Documentation
```

## 🔒 Security

- **Audited Contracts**: All contracts use OpenZeppelin libraries
- **Reentrancy Protection**: Built-in protection against reentrancy attacks
- **Access Control**: Proper ownership and role-based access control
- **Input Validation**: Comprehensive input validation and error handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in `/docs`
- Review the testnet setup guide

## 🎯 Roadmap

- [ ] Additional DeFi protocol integrations
- [ ] Mobile app development
- [ ] Advanced yield optimization algorithms
- [ ] Governance token implementation
- [ ] Multi-signature wallet support

---

**Built with ❤️ for the DeFi community**
