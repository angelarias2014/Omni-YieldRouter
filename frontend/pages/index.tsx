import { useAccount, useConnect } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { useState } from 'react';
import { useYieldData, useDeployedAddresses } from '../hooks/useYield';
import { useYieldRouter } from '../hooks/useYieldRouter';
import { YieldCard } from '../components/YieldCard';
import { DepositForm, DepositFormValues } from '../components/DepositForm';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({ connector: new InjectedConnector() });
  const [selectedStrategy, setSelectedStrategy] = useState('');

  const { yieldData, isLoading: isLoadingYieldData, isError: isYieldDataError, refresh: refreshYieldData } = useYieldData();
  const { addresses, isLoading: isLoadingAddresses, isError: isAddressesError } = useDeployedAddresses();
  
  const { deposit, isDepositing } = useYieldRouter(addresses?.yieldRouter);

  const handleDeposit = (data: DepositFormValues) => {
    if (selectedStrategy === '') {
      // This should ideally be handled at the form level, but as a fallback:
      alert('Por favor, selecciona una estrategia de rendimiento');
      return;
    }
    deposit(data.tokenAddress, data.amount, Number(data.chainId), selectedStrategy);
  };

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
            <p className="text-lg">
              {isLoadingYieldData ? 'Cargando...' : yieldData?.best || 'No disponible'}
            </p>
            {isYieldDataError && <p className="text-yellow-200 text-sm mt-2">Error al cargar APY</p>}
          </div>

          {/* Yield Options */}
          {yieldData?.options && yieldData.options.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Available Yield Strategies</h3>
              <div className="grid gap-3">
                {yieldData.options.map((option, index) => (
                  <YieldCard 
                    key={index} 
                    option={option} 
                    isSelected={selectedStrategy === option.address} 
                    onSelect={setSelectedStrategy}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Deposit Form */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Make a Deposit</h3>
            <DepositForm onDeposit={handleDeposit} isDepositing={isDepositing} />
            <div className="mt-6">
              <button 
                onClick={() => refreshYieldData()} 
                disabled={isLoadingYieldData}
                className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg w-full font-semibold"
              >
                {isLoadingYieldData ? 'Refrescando...' : 'Refresh APY Data'}
              </button>
            </div>
          </div>

          {/* User Info */}
          <div className="mt-6 text-center text-gray-600">
            <p>Connected: {address}</p>
            <p>Router Contract: {addresses?.yieldRouter || 'Cargando...'}</p>
          </div>
        </div>
      )}
    </main>
  );
}