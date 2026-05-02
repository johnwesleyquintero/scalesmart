import { Input } from './input';
import { Label } from './label';
import React from 'react';

interface NumberInputProps {
  id: string;
  label: string;
  value: number | string;
  onChange: (value: number) => void;
  placeholder?: string;
  step?: string;
}

const NumberInput: React.FC<NumberInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  step,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsedValue = parseFloat(e.target.value);
    if (!isNaN(parsedValue)) {
      onChange(parsedValue);
    } else if (e.target.value === '') {
      onChange(NaN); // Allow clearing the input
    }
  };

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        type="number"
        id={id}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        step={step}
      />
    </div>
  );
};

export default NumberInput;
