import { useContractWrite } from 'wagmi';
import { ethers } from 'ethers';
import YieldRouterABI from '../contracts/YieldRouter.json';
import { toast } from 'react-hot-toast';

export function useYieldRouter(deployedAddress: string | undefined) {
  const { write, isLoading, isSuccess, error } = useContractWrite({
    address: (deployedAddress || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    abi: YieldRouterABI.abi,
    functionName: 'deposit',
    onSuccess: () => {
      toast.success("¡Depósito enviado con éxito!");
    },
    onError: (err: any) => {
      toast.error(`Error en el depósito: ${err.shortMessage || err.message}`);
    }
  });

  const handleDeposit = (
    tokenAddress: string,
    amount: string,
    destinationChainId: number,
    strategyAddress: string
  ) => {
    if (!deployedAddress || deployedAddress === "0x...") {
      toast.error("Contrato no desplegado aún");
      return;
    }

    try {
      const parsedAmount = ethers.utils.parseUnits(amount, 6); // USDC decimals
      const strategyData = ethers.utils.defaultAbiCoder.encode(['address'], [strategyAddress]);
      
      write({
        args: [tokenAddress, parsedAmount, destinationChainId, strategyData]
      });
    } catch (e: any) {
      toast.error(`Error de validación: ${e.message}`);
    }
  };

  return {
    deposit: handleDeposit,
    isDepositing: isLoading,
    isSuccess,
    error
  };
}
