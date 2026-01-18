import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import { YieldData, YieldOption } from '@/types';

// Contract ABIs (simplified)
const CROSSCHAIN_ROUTER_ABI = [
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
      const addressesPath = require('path').join(process.cwd(), '../deployed-addresses.json');
      const addressesData = fs.readFileSync(addressesPath, 'utf8');
      deployedAddresses = JSON.parse(addressesData);
    } catch (error) {
      // Fallback to mock data if no deployed addresses
      const yieldOptions: YieldOption[] = [
        { chain: 'Sepolia', protocol: 'Aave', apy: 5.2, address: '0x...aave' },
        { chain: 'Mumbai', protocol: 'Yearn', apy: 4.8, address: '0x...yearn' },
        { chain: 'Optimism Goerli', protocol: 'Beefy', apy: 6.1, address: '0x...beefy' },
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
    const crossChainRouterContract = new ethers.Contract(
      deployedAddresses.crossChainRouter,
      CROSSCHAIN_ROUTER_ABI,
      provider
    );

    // Get yield strategies
    const strategies = [
      { address: deployedAddresses.aaveStrategy, name: 'Aave', chain: 'Sepolia' },
      { address: deployedAddresses.yearnStrategy, name: 'Yearn', chain: 'Mumbai' },
      { address: deployedAddresses.beefyStrategy, name: 'Beefy', chain: 'Optimism Goerli' }
    ];

    const yieldOptions: YieldOption[] = [];
    
    // Try to fetch real APY data from external APIs first
    try {
      const [aaveResponse, yearnResponse, beefyResponse] = await Promise.allSettled([
        fetch('https://aave-api-v2.aave.com/data/liquidity/v2?poolId=mainnet'),
        fetch('https://api.yearn.finance/v1/chains/1/vaults/all'),
        fetch('https://api.beefy.finance/apy')
      ]);

      const realApys = {
        'Aave': aaveResponse.status === 'fulfilled' ? 
          (await aaveResponse.value.json()).reserves[0]?.liquidityRate * 100 || 5.2 : 5.2,
        'Yearn': yearnResponse.status === 'fulfilled' ? 
          (await yearnResponse.value.json())[0]?.apy?.net_apy * 100 || 4.8 : 4.8,
        'Beefy': beefyResponse.status === 'fulfilled' ? 
          Number(Object.values(await beefyResponse.value.json())[0]) * 100 || 6.1 : 6.1
      };

      for (const strategy of strategies) {
        yieldOptions.push({
          chain: strategy.chain,
          protocol: strategy.name,
          apy: realApys[strategy.name as keyof typeof realApys],
          address: strategy.address
        });
      }
    } catch (error) {
      console.error('Error fetching real APY data:', error);
      
      // Fallback to contract APY data
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
          // Final fallback to mock data
          const mockApys = { 'Aave': 5.2, 'Yearn': 4.8, 'Beefy': 6.1 };
          yieldOptions.push({
            chain: strategy.chain,
            protocol: strategy.name,
            apy: mockApys[strategy.name as keyof typeof mockApys],
            address: strategy.address
          });
        }
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
    const yieldOptions: YieldOption[] = [
      { chain: 'Sepolia', protocol: 'Aave', apy: 5.2, address: '0x...aave' },
      { chain: 'Mumbai', protocol: 'Yearn', apy: 4.8, address: '0x...yearn' },
      { chain: 'Optimism Goerli', protocol: 'Beefy', apy: 6.1, address: '0x...beefy' },
    ];

    const bestOption = yieldOptions.reduce((prev, current) => (prev.apy > current.apy) ? prev : current);

    res.status(200).json({
      best: `Best APY: ${bestOption.apy}% on ${bestOption.protocol} (${bestOption.chain})`,
      options: yieldOptions,
      error: 'Using mock data - contracts not deployed or network not available'
    });
  }
} 