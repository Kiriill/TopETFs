export interface ETFData {
  symbol: string;
  name: string;
  performance: {
    '1M': number;
    '1Y': number;
    '5Y': number;
  };
  mer: number;
  aum: number;
  date?: {
    month: string;
    year: number;
    monthName: string;
  };
}

export interface StoredData {
  lastUpdated: string;
  yearMonth: string;
  data: ETFData[];
} 