export interface ETF {
  symbol: string;
  name: string;
  performance: {
    '1M': number;
    '1Y': number;
    '5Y': number;
  };
  mer: number;
  aum: number;
}

// Alias for backward compatibility
export type ETFData = ETF; 