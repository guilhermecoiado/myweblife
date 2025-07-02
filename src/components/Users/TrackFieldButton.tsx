import React from 'react';
import { Check, X, Clock } from 'lucide-react';

interface TrackFieldButtonProps {
  label: string;
  value: boolean | 'progress' | null;
  onChange: (value: boolean | 'progress') => void;
  disabled?: boolean;
}

export const TrackFieldButton: React.FC<TrackFieldButtonProps> = ({ 
  label, 
  value, 
  onChange, 
  disabled = false 
}) => {
  const getButtonClass = (buttonValue: boolean | 'progress') => {
    const baseClass = "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center space-x-2 border-2";
    
    if (value === buttonValue) {
      switch (buttonValue) {
        case true:
          return `${baseClass} bg-green-500 border-green-500 text-white shadow-md`;
        case false:
          return `${baseClass} bg-red-500 border-red-500 text-white shadow-md`;
        case 'progress':
          return `${baseClass} bg-orange-500 border-orange-500 text-white shadow-md`;
      }
    } else {
      switch (buttonValue) {
        case true:
          return `${baseClass} bg-green-50 border-green-200 text-green-700 hover:bg-green-100`;
        case false:
          return `${baseClass} bg-red-50 border-red-200 text-red-700 hover:bg-red-100`;
        case 'progress':
          return `${baseClass} bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100`;
      }
    }
  };

  const getIcon = (buttonValue: boolean | 'progress') => {
    switch (buttonValue) {
      case true:
        return <Check className="h-4 w-4" />;
      case false:
        return <X className="h-4 w-4" />;
      case 'progress':
        return <Clock className="h-4 w-4" />;
    }
  };

  const getLabel = (buttonValue: boolean | 'progress') => {
    switch (buttonValue) {
      case true:
        return 'Sim';
      case false:
        return 'Não';
      case 'progress':
        return 'Em Andamento';
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="flex space-x-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(true)}
          className={getButtonClass(true)}
        >
          {getIcon(true)}
          <span>{getLabel(true)}</span>
        </button>
        
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange('progress')}
          className={getButtonClass('progress')}
        >
          {getIcon('progress')}
          <span>{getLabel('progress')}</span>
        </button>
        
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(false)}
          className={getButtonClass(false)}
        >
          {getIcon(false)}
          <span>{getLabel(false)}</span>
        </button>
      </div>
    </div>
  );
};