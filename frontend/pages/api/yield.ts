import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';

type YieldData = {
  best: string;
  options: { chain: string; protocol: string; apy: number; address: string }[];
  error?: string;
};

// Contract ABIs (simplified)
const AGGLAYER_ABI = [
  "function getBestYieldStrategy() external view returns (address bestStrategy, uint256 bestAPY)",
  "function yieldStrategies(address) external view returns (address strategyContract, bool isActive, uint256 apy, string name)"
];

const STRATEGY_ABI = [
  "function getAPY() external view returns (uint256)"
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<YieldData>
) {
  try {
    // Try to read deployed addresses
    let deployedAddresses;
    try {
      const fs = require('fs');
      const addressesData = fs.readFileSync('./deployed-addresses.json', 'utf8');
      deployedAddresses = JSON.parse(addressesData);
    } catch (error) {
      // Fallback to mock data if no deployed addresses
      const yieldOptions = [
        { chain: 'Polygon', protocol: 'Aave', apy: 5.2, address: '0x...' },
        { chain: 'Optimism', protocol: 'Yearn', apy: 4.8, address: '0x...' },
        { chain: 'Base', protocol: 'Beefy', apy: 6.1, address: '0x...' },
      ];

      const bestOption = yieldOptions.reduce((prev, current) => (prev.apy > current.apy) ? prev : current);

      return res.status(200).json({
        best: `Best APY: ${bestOption.apy}% on ${bestOption.protocol} (${bestOption.chain})`,
        options: yieldOptions
      });
    }

    // Connect to localhost network
    const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
    
    // Create contract instance
    const agglayerContract = new ethers.Contract(
      deployedAddresses.agglayerRouter,
      AGGLAYER_ABI,
      provider
    );

    // Get yield strategies
    const strategies = [
      { address: deployedAddresses.aaveStrategy, name: 'Aave', chain: 'Polygon' },
      { address: deployedAddresses.yearnStrategy, name: 'Yearn', chain: 'Optimism' },
      { address: deployedAddresses.beefyStrategy, name: 'Beefy', chain: 'Base' }
    ];

    const yieldOptions = [];
    
    for (const strategy of strategies) {
      try {
        const strategyContract = new ethers.Contract(strategy.address, STRATEGY_ABI, provider);
        const apy = await strategyContract.getAPY();
        const apyPercent = Number(ethers.utils.formatUnits(apy, 2)); // Convert from basis points
        
        yieldOptions.push({
          chain: strategy.chain,
          protocol: strategy.name,
          apy: apyPercent,
          address: strategy.address
        });
      } catch (error) {
        console.error(`Error fetching APY for ${strategy.name}:`, error);
        // Fallback to mock data for this strategy
        const mockApys = { 'Aave': 5.2, 'Yearn': 4.8, 'Beefy': 6.1 };
        yieldOptions.push({
          chain: strategy.chain,
          protocol: strategy.name,
          apy: mockApys[strategy.name as keyof typeof mockApys],
          address: strategy.address
        });
      }
    }

    // Find the best APY
    const bestOption = yieldOptions.reduce((prev, current) => (prev.apy > current.apy) ? prev : current);

    res.status(200).json({
      best: `Best APY: ${bestOption.apy}% on ${bestOption.protocol} (${bestOption.chain})`,
      options: yieldOptions
    });

  } catch (error) {
    console.error('Error fetching yield data:', error);
    
    // Fallback to mock data
    const yieldOptions = [
      { chain: 'Polygon', protocol: 'Aave', apy: 5.2, address: '0x...' },
      { chain: 'Optimism', protocol: 'Yearn', apy: 4.8, address: '0x...' },
      { chain: 'Base', protocol: 'Beefy', apy: 6.1, address: '0x...' },
    ];

    const bestOption = yieldOptions.reduce((prev, current) => (prev.apy > current.apy) ? prev : current);

    res.status(200).json({
      best: `Best APY: ${bestOption.apy}% on ${bestOption.protocol} (${bestOption.chain})`,
      options: yieldOptions,
      error: 'Using mock data - contracts not deployed or network not available'
    });
  }
} 