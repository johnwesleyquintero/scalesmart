import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

const acosRatingGuide = [
  { label: 'Excellent', range: '< 15%', color: 'text-green-500' },
  { label: 'Good', range: '15-25%', color: 'text-blue-500' },
  { label: 'Fair', range: '25-35%', color: 'text-yellow-500' },
  { label: 'Poor', range: '> 35%', color: 'text-red-500' },
];

export function AcosRatingGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ACoS Rating Guide</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1 text-sm">
          {acosRatingGuide.map((item) => (
            <li key={item.label} className="flex items-center gap-2">
              <span
                className={`inline-block h-3 w-3 rounded-full ${item.color.replace('text-', 'bg-')}`}
              />
              <span className="font-medium">{item.label}:</span>
              <span className={`font-semibold ${item.color}`}>
                {item.range}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Note: Ideal ACoS varies by product, category, and campaign goals.
          Lower ACoS generally indicates higher profitability from ads. Infinity
          ACoS means no sales were generated from ad spend.
        </p>
      </CardContent>
    </Card>
  );
}
