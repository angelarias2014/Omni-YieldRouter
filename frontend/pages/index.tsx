import { useAccount, useConnect, useNetwork, useContractWrite, useContractRead } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import YieldRouterABI from '../contracts/YieldRouter.json';

// This will be updated when contracts are deployed
const contractAddress = "0x..."; // Will be updated from deployed-addresses.json

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({ connector: new InjectedConnector() });
  const { chain } = useNetwork();
  const [amount, setAmount] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [chainId, setChainId] = useState('');
  const [apy, setAPY] = useState('');
  const [yieldOptions, setYieldOptions] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [deployedAddress, setDeployedAddress] = useState(contractAddress);

  // Load deployed contract address
  useEffect(() => {
    const loadDeployedAddress = async () => {
      try {
        const response = await fetch('/api/addresses');
        if (response.ok) {
          const data = await response.json();
          setDeployedAddress(data.yieldRouter);
        }
      } catch (error) {
        console.log('Using default contract address');
      }
    };
    loadDeployedAddress();
  }, []);

  const { write: deposit, isLoading: isDepositing } = useContractWrite({
    address: deployedAddress as `0x${string}`,
    abi: YieldRouterABI.abi,
    functionName: 'deposit',
    onSuccess: () => {
      setError('');
      setIsLoading(false);
    },
    onError: (error) => {
      setError(`Deposit failed: ${error.message}`);
      setIsLoading(false);
    }
  });

  async function handleDeposit() {
    if (!amount || !tokenAddress || !chainId || !selectedStrategy) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const parsedAmount = ethers.utils.parseUnits(amount, 6); // USDC decimals
      const strategyData = ethers.utils.defaultAbiCoder.encode(['address'], [selectedStrategy]);
      
      deposit({ 
        args: [tokenAddress, parsedAmount, Number(chainId), strategyData] 
      });
    } catch (error) {
      setError(`Transaction failed: ${error.message}`);
      setIsLoading(false);
    }
  }

  async function fetchAPY() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/yield");
      const data = await res.json();
      setAPY(data.best);
      setYieldOptions(data.options || []);
      setError(data.error || '');
    } catch (error) {
      setError('Failed to fetch APY data');
    } finally {
      setIsLoading(false);
    }
  }

  // Auto-fetch APY data on component mount
  useEffect(() => {
    fetchAPY();
  }, []);

  return (
    <main className="p-6 max-w-2xl mx-auto">
      {!isConnected ? (
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-6">CrossYield CrossChain Router</h1>
          <p className="text-gray-600 mb-4">Connect your wallet to start yield farming across multiple chains</p>
          <button 
            onClick={() => connect()} 
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <div>
          <h1 className="text-3xl font-bold mb-6 text-center">CrossYield CrossChain Router</h1>
          
          {/* Current APY Display */}
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-4 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-2">Current Best APY</h2>
            <p className="text-lg">{apy || 'Loading...'}</p>
            {error && <p className="text-yellow-200 text-sm mt-2">{error}</p>}
          </div>

          {/* Yield Options */}
          {yieldOptions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Available Yield Strategies</h3>
              <div className="grid gap-3">
                {yieldOptions.map((option, index) => (
                  <div key={index} className="border rounded-lg p-3 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold">{option.protocol}</span>
                        <span className="text-gray-500 ml-2">({option.chain})</span>
                      </div>
                      <div className="text-right">
                        <span className="text-green-600 font-bold">{option.apy}% APY</span>
                        <button
                          onClick={() => setSelectedStrategy(option.address)}
                          className={`ml-2 px-3 py-1 rounded text-sm ${
                            selectedStrategy === option.address 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {selectedStrategy === option.address ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deposit Form */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Make a Deposit</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Token Address</label>
                <input 
                  className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="0x..." 
                  value={tokenAddress} 
                  onChange={(e) => setTokenAddress(e.target.value)} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USDC)</label>
                <input 
                  className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="100" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination Chain ID</label>
                <select 
                  className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={chainId} 
                  onChange={(e) => setChainId(e.target.value)}
                >
                  <option value="">Select Chain</option>
                  <option value="11155111">Ethereum Sepolia (11155111)</option>
                  <option value="80001">Polygon Mumbai (80001)</option>
                  <option value="420">Optimism Goerli (420)</option>
                  <option value="84531">Base Goerli (84531)</option>
                  <option value="137">Polygon Mainnet (137)</option>
                  <option value="10">Optimism Mainnet (10)</option>
                  <option value="8453">Base Mainnet (8453)</option>
                </select>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button 
                onClick={handleDeposit} 
                disabled={isLoading || isDepositing}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg w-full font-semibold"
              >
                {isLoading || isDepositing ? 'Processing...' : 'Deposit'}
              </button>
              
              <button 
                onClick={fetchAPY} 
                disabled={isLoading}
                className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg w-full font-semibold"
              >
                {isLoading ? 'Refreshing...' : 'Refresh APY Data'}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="mt-6 text-center text-gray-600">
            <p>Connected: {address}</p>
            <p>Network: {chain?.name || 'Unknown'}</p>
          </div>
        </div>
      )}
    </main>
  );
} 