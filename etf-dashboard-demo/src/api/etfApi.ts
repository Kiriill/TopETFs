import axios from 'axios';
import { ETFData } from '../types';

const preferredPorts = [3001, 3005, 3006, 3007, 3008, 3009];
let currentPort: number | null = null;

async function findAvailableServer(): Promise<number> {
  for (const port of preferredPorts) {
    try {
      const response = await axios.get(`http://localhost:${port}/health`, { timeout: 1000 });
      if (response.status === 200) {
        console.log(`Found server on port ${port}`);
        return port;
      }
    } catch (error) {
      console.log(`Server not available on port ${port}`);
    }
  }
  throw new Error('No available server found');
}

async function getServerPort(): Promise<number> {
  if (!currentPort) {
    currentPort = await findAvailableServer();
  }
  return currentPort;
}

export async function fetchETFData(): Promise<ETFData[]> {
  try {
    const port = await getServerPort();
    const response = await axios.get<ETFData[]>(`http://localhost:${port}/api/etfs`);
    return response.data;
  } catch (error) {
    console.error('Error fetching ETF data:', error);
    throw error;
  }
} 