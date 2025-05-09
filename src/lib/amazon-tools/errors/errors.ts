export class InventoryOptimizationError extends Error {
  errorCode: string;
  details: unknown;

  constructor(message: string, errorCode: string, details?: unknown) {
    super(message);
    this.errorCode = errorCode;
    this.details = details;
    this.name = 'InventoryOptimizationError';
  }
}
