// utils/helpers.ts

export const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };
  
  export const calculateProgress = (current: string, total: string): number => {
    return (Number(current) / Number(total)) * 100;
  };
  
  export const truncateAddress = (address: string, chars = 4): string => {
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
  };
  
  export const formatAmount = (amount: string, decimals = 4): string => {
    const num = parseFloat(amount);
    return num.toFixed(decimals);
  };
  
  export const validateAmount = (amount: string): boolean => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  };
  
  export const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };
  
  export class TransactionError extends Error {
    constructor(message: string, public readonly code?: string) {
      super(message);
      this.name = 'TransactionError';
    }
  }
  
  export const handleError = (error: unknown): string => {
    if (error instanceof TransactionError) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (error && typeof error === 'object' && 'message' in error) {
      const e = error as { message: string };  // Cast to an object with a 'message' property
      if (e.message.includes('user rejected')) {
        return 'Transaction was rejected';
      }
      if (e.message.includes('insufficient funds')) {
        return 'Insufficient funds for transaction';
      }
      return e.message;
    }
    
    return 'An unexpected error occurred';
  };
  