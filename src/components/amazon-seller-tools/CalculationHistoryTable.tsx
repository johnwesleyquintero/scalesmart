'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalculationData } from '@/lib/indexeddb-service';
import { format } from 'date-fns';

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
        {calculationHistory.length === 0 ? (
          <p className="text-muted-foreground">No calculation history yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Ad Spend</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>ACoS</TableHead>
                  <TableHead>ROAS</TableHead>
                  <TableHead>Impressions</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>CTR</TableHead>
                  <TableHead>CPC</TableHead>
                  <TableHead>RPC Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculationHistory.map((calc, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {calc.date ? format(new Date(calc.date), 'PPP p') : 'N/A'}
                    </TableCell>
                    <TableCell>{calc.campaign}</TableCell>
                    <TableCell>
                      {calc.currencySymbol}
                      {calc.adSpend.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {calc.currencySymbol}
                      {calc.sales.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {calc.acos === Infinity
                        ? 'Infinity'
                        : (calc.acos?.toFixed(2) ?? 'N/A')}
                      %
                    </TableCell>
                    <TableCell>
                      {calc.roas === Infinity
                        ? 'Infinity'
                        : (calc.roas?.toFixed(2) ?? 'N/A')}
                      x
                    </TableCell>
                    <TableCell>{calc.impressions ?? 'N/A'}</TableCell>
                    <TableCell>{calc.clicks ?? 'N/A'}</TableCell>
                    <TableCell>{calc.ctr?.toFixed(2) ?? 'N/A'}%</TableCell>
                    <TableCell>
                      {calc.currencySymbol}
                      {calc.cpc?.toFixed(2) ?? 'N/A'}
                    </TableCell>
                    <TableCell>
                      {calc.revenuePerClickRate?.toFixed(2) ?? 'N/A'}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
