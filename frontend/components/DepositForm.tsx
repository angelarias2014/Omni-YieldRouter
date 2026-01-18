import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { depositSchema, DepositFormValues } from '../lib/validations';

interface DepositFormProps {
  onDeposit: (data: DepositFormValues) => void;
  isDepositing: boolean;
}

export function DepositForm({ onDeposit, isDepositing }: DepositFormProps) {
  const [formData, setFormData] = useState({
    tokenAddress: '',
    amount: '',
    chainId: '',
  });
  const [errors, setErrors] = useState<Partial<DepositFormValues>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error al cambiar
    if (errors[name as keyof DepositFormValues]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = depositSchema.safeParse({
      ...formData,
      strategyAddress: 'placeholder', // Validado en el hook
    });

    if (!result.success) {
      const fieldErrors: Partial<DepositFormValues> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof DepositFormValues] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error('Por favor, corrige los errores del formulario');
      return;
    }

    onDeposit({
      tokenAddress: formData.tokenAddress,
      amount: formData.amount,
      chainId: formData.chainId,
      strategyAddress: 'placeholder',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Token Address</label>
        <input
          name="tokenAddress"
          type="text"
          className={`border rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.tokenAddress ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="0x..."
          value={formData.tokenAddress}
          onChange={handleChange}
        />
        {errors.tokenAddress && (
          <p className="text-red-500 text-sm mt-1">{errors.tokenAddress}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USDC)</label>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0"
          className={`border rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.amount ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="100"
          value={formData.amount}
          onChange={handleChange}
        />
        {errors.amount && (
          <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Destination Chain ID</label>
        <select
          name="chainId"
          className={`border rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.chainId ? 'border-red-500' : 'border-gray-300'}`}
          value={formData.chainId}
          onChange={handleChange}
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
        {errors.chainId && (
          <p className="text-red-500 text-sm mt-1">{errors.chainId}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isDepositing}
        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors"
      >
        {isDepositing ? 'Procesando...' : 'Depositar'}
      </button>
    </form>
  );
}