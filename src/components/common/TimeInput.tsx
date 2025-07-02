import React, { useState, useEffect } from 'react';
import { formatTimeInput, isValidTimeFormat, formatTimeForInput } from '../../utils/dateUtils';

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

export const TimeInput: React.FC<TimeInputProps> = ({
  value,
  onChange,
  placeholder = "HH:MM",
  className = "input-primary",
  required = false,
  disabled = false,
  error
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    // Formatar valor inicial
    if (value) {
      const formattedTime = formatTimeForInput(value);
      setDisplayValue(formattedTime);
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatTimeInput(inputValue);
    
    setDisplayValue(formattedValue);
    
    // Validar apenas se o campo estiver completo
    if (formattedValue.length === 5) {
      const valid = isValidTimeFormat(formattedValue);
      setIsValid(valid);
      
      if (valid) {
        onChange(formattedValue);
      }
    } else if (formattedValue.length === 0) {
      setIsValid(true);
      onChange('');
    }
  };

  const handleBlur = () => {
    if (displayValue && displayValue.length === 5) {
      const valid = isValidTimeFormat(displayValue);
      setIsValid(valid);
      
      if (valid) {
        onChange(displayValue);
      }
    }
  };

  return (
    <div>
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`${className} ${!isValid || error ? 'border-red-500' : ''}`}
        maxLength={5}
        required={required}
        disabled={disabled}
      />
      {(!isValid || error) && (
        <p className="mt-1 text-sm text-red-600">
          {error || 'Hora inválida. Use o formato HH:MM (24h)'}
        </p>
      )}
    </div>
  );
};