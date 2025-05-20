// src/lib/utils/amazon/calculations.ts

// Example function:
export function calculateACoS(spend: number, sales: number): number {
  if (sales === 0) {
    return 0;
  }
  return (spend / sales) * 100;
}

// Add more calculation functions here
