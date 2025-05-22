import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

export interface Currency {
  label: string;
  value: string;
  symbol: string;
}

const currencies: Currency[] = [
  { label: 'US Dollar', value: 'USD', symbol: '$' },
  { label: 'Euro', value: 'EUR', symbol: '€' },
  { label: 'British Pound', value: 'GBP', symbol: '£' },
  { label: 'Japanese Yen', value: 'JPY', symbol: '¥' },
  { label: 'Canadian Dollar', value: 'CAD', symbol: 'CA$' },
];

interface CurrencySelectorProps {
  onCurrencyChange: (currency: Currency) => void;
}

export function CurrencySelector({ onCurrencyChange }: CurrencySelectorProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    currencies[0],
  );

  const handleCurrencyChange = (value: string) => {
    const currency = currencies.find((c) => c.value === value);
    if (currency) {
      setSelectedCurrency(currency);
      onCurrencyChange(currency);
    }
  };

  return (
    <Select
      onValueChange={handleCurrencyChange}
      defaultValue={selectedCurrency.value}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select currency" />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((currency) => (
          <SelectItem key={currency.value} value={currency.value}>
            {currency.label} ({currency.symbol})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
