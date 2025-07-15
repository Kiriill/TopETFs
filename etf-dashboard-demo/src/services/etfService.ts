import axios from 'axios';
import { ETF } from '../types';

const API_PORTS = [3001, 3005, 3006, 3007, 3008, 3009];
const API_BASE = 'http://localhost';

async function findActiveServer(): Promise<string> {
  for (const port of API_PORTS) {
    try {
      const url = `${API_BASE}:${port}/health`;
      await axios.get(url);
      return `${API_BASE}:${port}`;
    } catch (error) {
      // Try next port
      continue;
    }
  }
  throw new Error('No active server found');
}

let cachedServerUrl: string | null = null;

export async function fetchETFData(): Promise<ETF[]> {
  try {
    // Try cached server first
    if (cachedServerUrl) {
      try {
        const response = await axios.get<ETF[]>(`${cachedServerUrl}/api/etfs`);
        return response.data;
      } catch (error) {
        console.log('Cached server not responding, finding new server...');
        cachedServerUrl = null;
      }
    }

    // Find active server
    const serverUrl = await findActiveServer();
    cachedServerUrl = serverUrl;

    // Fetch data from active server
    const response = await axios.get<ETF[]>(`${serverUrl}/api/etfs`);
    
    if (!Array.isArray(response.data)) {
      throw new Error('Invalid data format received from server');
    }

    // Validate and clean data
    const etfs = response.data.map(etf => ({
      symbol: etf.symbol,
      name: etf.name,
      performance: {
        '1M': Number(etf.performance['1M']) || 0,
        '1Y': Number(etf.performance['1Y']) || 0,
        '5Y': Number(etf.performance['5Y']) || 0
      },
      mer: Number(etf.mer) || 0,
      aum: Number(etf.aum) || 0
    }));

    return etfs;
  } catch (error) {
    console.error('Error fetching ETF data:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch ETF data');
  }
} 