import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
} from '@/components/ui';
import { format } from 'date-fns';
import { CalculationData } from '@/lib/indexeddb-service';
import { copyToClipboard } from '@/lib/utils/clipboard';
import { AcosRatingHelper } from '@/components/amazon-seller-tools/AcosRatingHelper'; // Use named import
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Props interface for the CalculationHistoryTable component.
 * @property {CalculationData[]} calculationHistory - An array of ACoS calculation history data.
 */
interface CalculationHistoryTableProps {
  calculationHistory: CalculationData[];
}

/**
 * `CalculationHistoryTable` displays a table of past ACoS calculations.
 * It allows users to view campaign details, calculated metrics, and copy calculation data to the clipboard.
 *
 * @param {CalculationHistoryTableProps} props - The props for the component.
 * @param {CalculationData[]} props.calculationHistory - The array of calculation history data.
 * @returns {JSX.Element} A card containing the calculation history table.
 */
export function CalculationHistoryTable({
  calculationHistory,
}: CalculationHistoryTableProps) {
  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle>Calculation History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300"
                >
                  Campaign
                </th>
                <th
                  scope="col"
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300"
                >
                  Ad Spend
                </th>
                <th
                  scope="col"
                  className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300"
                >
                  Sales
                </th>
                <th
                  scope="col"
                  className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300"
                >
                  ACoS (%)
                </th>
                <th
                  scope="col"
                  className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300"
                >
                  ROAS (x)
                </th>
                <th
                  scope="col"
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {calculationHistory.map((calc) => (
                <tr key={calc.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {calc.campaignName}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {format(new Date(calc.date), 'yyyy-MM-dd HH:mm')}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-300">
                    {calc.currencySymbol}
                    {calc.adSpend.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-300">
                    {calc.currencySymbol}
                    {calc.sales.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-300">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-end gap-1">
                            <span>{calc.acos.toFixed(2)}%</span>
                            <AcosRatingHelper acos={calc.acos} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="text-sm">
                          <AcosRatingHelper acos={calc.acos} />
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-300">
                    {calc.roas.toFixed(2)}x
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-left text-sm font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        const textToCopy = `Campaign: ${calc.campaignName}, Date: ${format(new Date(calc.date), 'yyyy-MM-dd HH:mm')}, Ad Spend: ${calc.currencySymbol}${calc.adSpend.toFixed(2)}, Sales: ${calc.currencySymbol}${calc.sales.toFixed(2)}, ACoS: ${calc.acos.toFixed(2)}%, RoAS: ${calc.roas.toFixed(2)}x`;
                        try {
                          await copyToClipboard(textToCopy);
                          toast.success('Calculation copied to clipboard!');
                        } catch (error) {
                          toast.error('Failed to copy calculation.');
                        }
                      }}
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                    >
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Copy</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {calculationHistory.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            No calculation history available.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
