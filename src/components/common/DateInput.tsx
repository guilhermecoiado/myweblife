import React, { useState, useEffect } from 'react';
import { formatDateInput, isValidDateFormat, convertDateToInput, convertInputToDate } from '../../utils/dateUtils';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

export const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  placeholder = "dd/mm/yyyy",
  className = "input-primary",
  required = false,
  disabled = false,
  error
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    // Converter valor inicial para formato brasileiro
    if (value) {
      const brazilianDate = convertDateToInput(value);
      setDisplayValue(brazilianDate);
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatDateInput(inputValue);
    
    setDisplayValue(formattedValue);
    
    // Validar apenas se o campo estiver completo
    if (formattedValue.length === 10) {
      const valid = isValidDateFormat(formattedValue);
      setIsValid(valid);
      
      if (valid) {
        // Converter para formato do banco antes de enviar
        const dbFormat = convertInputToDate(formattedValue);
        onChange(dbFormat);
      }
    } else if (formattedValue.length === 0) {
      setIsValid(true);
      onChange('');
    }
  };

  const handleBlur = () => {
    if (displayValue && displayValue.length === 10) {
      const valid = isValidDateFormat(displayValue);
      setIsValid(valid);
      
      if (valid) {
        const dbFormat = convertInputToDate(displayValue);
        onChange(dbFormat);
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
        maxLength={10}
        required={required}
        disabled={disabled}
      />
      {(!isValid || error) && (
        <p className="mt-1 text-sm text-red-600">
          {error || 'Data inválida. Use o formato dd/mm/yyyy'}
        </p>
      )}
    </div>
  );
};