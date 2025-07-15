import { ETFData } from '../types';

const API_URL = 'http://localhost:3001';

export async function fetchLatestETFData(): Promise<ETFData[]> {
  try {
    console.log('Fetching ETF data from:', `${API_URL}/api/etfs`);
    
    // First try the health check
    const healthCheck = await fetch(`${API_URL}/health`);
    if (!healthCheck.ok) {
      throw new Error('Server is not responding');
    }
    
    // Then fetch the ETF data
    const response = await fetch(`${API_URL}/api/etfs`);
    if (!response.ok) {
      const text = await response.text();
      console.error('Server error response:', text);
      throw new Error(`Failed to fetch ETF data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Received ETF data:', data);
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format received from server');
    }

    return data;
  } catch (error) {
    console.error('Error fetching ETF data:', error);
    // Return mock data for development
    return [
      {
        symbol: 'VAS',
        name: 'Vanguard Australian Shares Index ETF',
        performance: {
          '1M': 2.5,
          '1Y': 12.3,
          '5Y': 45.6
        },
        mer: 0.10,
        aum: 9800000000
      }
    ];
  }
} 