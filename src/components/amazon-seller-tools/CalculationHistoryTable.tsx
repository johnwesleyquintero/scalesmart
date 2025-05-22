import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { format } from 'date-fns';
import { CalculationData } from '@/lib/indexeddb-service';

interface CalculationHistoryTableProps {
  calculationHistory: CalculationData[];
}

export function CalculationHistoryTable({
  calculationHistory,
}: CalculationHistoryTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculation History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-200">
                  Campaign
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-200">
                  Date
                </th>
                <th className="px-4 py-2 text-right font-medium text-gray-700 dark:text-gray-200">
                  Ad Spend
                </th>
                <th className="px-4 py-2 text-right font-medium text-gray-700 dark:text-gray-200">
                  Sales
                </th>
                <th className="px-4 py-2 text-right font-medium text-gray-700 dark:text-gray-200">
                  ACoS
                </th>
                <th className="px-4 py-2 text-right font-medium text-gray-700 dark:text-gray-200">
                  ROAS
                </th>
              </tr>
            </thead>
            <tbody>
              {calculationHistory.map((calc) => (
                <tr key={calc.id} className="border-b dark:border-gray-700">
                  <td className="px-4 py-2">{calc.campaignName}</td>
                  <td className="px-4 py-2">
                    {format(new Date(calc.date), 'yyyy-MM-dd HH:mm')}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {calc.adSpend.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {calc.sales.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {calc.acos.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {calc.roas.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
