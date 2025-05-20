import React, { useState, useEffect } from 'react';
import { calculateAcos } from '@/lib/utils/amazon/calculations';
import { db } from '@/lib/indexeddb/amazon-tools-db';
import Button from '@/components/shared/Button';

interface CalculationEntry {
  id?: number;
  date: string;
  campaignName?: string;
  productIdentifier?: string;
  adSpend: number;
  adSales: number;
  acos: number;
  roas: number;
}

const AcosCalculator = () => {
  const [adSpend, setAdSpend] = useState<number>(0);
  const [adSales, setAdSales] = useState<number>(0);
  const [acos, setAcos] = useState<number>(0);
  const [roas, setRoas] = useState<number>(0);
  const [targetAcos, setTargetAcos] = useState<number>(0);
  const [calculationHistory, setCalculationHistory] = useState<CalculationEntry[]>([]);
  const [campaignName, setCampaignName] = useState<string>('');
  const [productIdentifier, setProductIdentifier] = useState<string>('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const history = await db.calculations
      .where('calculationType')
      .equals('acos')
      .reverse()
      .sortBy('timestamp');
    setCalculationHistory(history as unknown as CalculationEntry[]);
  };

  const handleCalculate = () => {
    const calculatedAcos = calculateAcos(adSpend, adSales);
    setAcos(calculatedAcos);
    setRoas(adSales === 0 ? 0 : (adSales / adSpend));
  };

  const handleSave = async () => {
    if (isNaN(acos) || acos === 0) {
      alert('Calculate ACoS first.');
      return;
    }

    const newEntry: CalculationEntry = {
      date: new Date().toISOString().slice(0, 10),
      campaignName: campaignName,
      productIdentifier: productIdentifier,
      adSpend: adSpend,
      adSales: adSales,
      acos: acos,
      roas: roas,
    };

    await db.calculations.add({
      calculationType: 'acos',
      calculationData: newEntry,
      timestamp: new Date(),
    });
    loadHistory();
    setCampaignName('');
    setProductIdentifier('');
  };

  const acosStatus =
    targetAcos > 0 && acos > targetAcos
      ? 'text-red-500'
      : targetAcos > 0 && acos <= targetAcos
      ? 'text-green-500'
      : '';

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">ACoS Calculator</h2>

      <div className="mb-4">
        <label htmlFor="adSpend" className="block text-gray-700 text-sm font-bold mb-2">
          Ad Spend
        </label>
        <input
          type="number"
          id="adSpend"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={adSpend}
          onChange={(e) => setAdSpend(parseFloat(e.target.value))}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="adSales" className="block text-gray-700 text-sm font-bold mb-2">
          Ad Sales
        </label>
        <input
          type="number"
          id="adSales"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={adSales}
          onChange={(e) => setAdSales(parseFloat(e.target.value))}
        />
      </div>

      <Button onClick={handleCalculate}>Calculate ACoS</Button>

      {acos > 0 && (
        <div className="mt-4">
          <p>
            ACoS: <span className={acosStatus}>{acos.toFixed(2)}%</span>
          </p>
          <p>
            Break-Even RoAS: {roas.toFixed(2)}
          </p>
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="targetAcos" className="block text-gray-700 text-sm font-bold mb-2">
          Target ACoS (%)
        </label>
        <input
          type="number"
          id="targetAcos"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={targetAcos}
          onChange={(e) => setTargetAcos(parseFloat(e.target.value))}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="campaignName" className="block text-gray-700 text-sm font-bold mb-2">
          Campaign Name (Optional)
        </label>
        <input
          type="text"
          id="campaignName"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="productIdentifier" className="block text-gray-700 text-sm font-bold mb-2">
          Product Identifier (Optional)
        </label>
        <input
          type="text"
          id="productIdentifier"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={productIdentifier}
          onChange={(e) => setProductIdentifier(e.target.value)}
        />
      </div>

      <Button onClick={handleSave}>Save Calculation</Button>

      {calculationHistory.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-bold mb-2">Calculation History</h3>
          <table className="table-auto w-full">
            <thead>
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Campaign</th>
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2">Ad Spend</th>
                <th className="px-4 py-2">Ad Sales</th>
                <th className="px-4 py-2">ACoS</th>
                <th className="px-4 py-2">RoAS</th>
              </tr>
            </thead>
            <tbody>
              {calculationHistory.map((entry) => (
                <tr key={entry.id}>
                  <td className="border px-4 py-2">{entry.date}</td>
                  <td className="border px-4 py-2">{entry.campaignName}</td>
                  <td className="border px-4 py-2">{entry.productIdentifier}</td>
                  <td className="border px-4 py-2">{entry.adSpend.toFixed(2)}</td>
                  <td className="border px-4 py-2">{entry.adSales.toFixed(2)}</td>
                  <td className="border px-4 py-2">{entry.acos.toFixed(2)}%</td>
                  <td className="border px-4 py-2">{entry.roas.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AcosCalculator;
