import { YieldOption } from '../types';

interface YieldCardProps {
  option: YieldOption;
  isSelected: boolean;
  onSelect: (address: string) => void;
}

export function YieldCard({ option, isSelected, onSelect }: YieldCardProps) {
  return (
    <div className={`border rounded-lg p-3 hover:bg-gray-50 transition-colors ${isSelected ? 'border-blue-500 bg-blue-50' : ''}`}>
      <div className="flex justify-between items-center">
        <div>
          <span className="font-semibold">{option.protocol}</span>
          <span className="text-gray-500 ml-2">({option.chain})</span>
        </div>
        <div className="text-right flex items-center">
          <span className="text-green-600 font-bold mr-3">{option.apy.toFixed(2)}% APY</span>
          <button
            onClick={() => onSelect(option.address)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              isSelected 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isSelected ? 'Seleccionado' : 'Seleccionar'}
          </button>
        </div>
      </div>
    </div>
  );
}
