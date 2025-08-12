import { fetchLatestETFData, checkForNewData } from '../services/etfService';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

jest.mock('axios');
jest.mock('fs');
jest.mock('path');

const mockExcelData = [
  {
    'ASX Code': 'VAS',
    'ETF Name': 'Vanguard Australian Shares Index ETF',
    '1 Month Return': '2.1',
    '1 Year Return': '15.3',
    '5 Year Return': '8.7',
    'Management Fee': '0.10',
    'Funds Under Management': '12500'
  },
  {
    'ASX Code': 'IOZ',
    'ETF Name': 'iShares Core S&P/ASX 200 ETF',
    '1 Month Return': '2.0',
    '1 Year Return': '15.1',
    '5 Year Return': '8.5',
    'Management Fee': '0.09',
    'Funds Under Management': '4200'
  }
];

describe('ETF Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.mkdirSync as jest.Mock).mockImplementation(() => undefined);
  });

  describe('checkForNewData', () => {
    it('should return true when new data is available', async () => {
      const mockAxiosHead = jest.spyOn(axios, 'head').mockResolvedValueOnce({});
      const result = await checkForNewData();
      expect(result).toBe(true);
      expect(mockAxiosHead).toHaveBeenCalled();
    });

    it('should return false when no new data is available', async () => {
      jest.spyOn(axios, 'head').mockRejectedValueOnce(new Error('404'));
      const result = await checkForNewData();
      expect(result).toBe(false);
    });
  });

  describe('fetchLatestETFData', () => {
    it('should return mock data when ASX data is not available', async () => {
      jest.spyOn(axios, 'get').mockRejectedValueOnce(new Error('404'));
      const data = await fetchLatestETFData();
      expect(data).toBeDefined();
      expect(data.etfs).toBeDefined();
      expect(data.dataDate).toBeDefined();
      expect(data.etfs.length).toBeGreaterThan(0);
      expect(data.etfs[0].symbol).toBe('VAS');
    });

    it('should handle network errors gracefully', async () => {
      jest.spyOn(axios, 'get').mockRejectedValueOnce(new Error('Network Error'));
      const data = await fetchLatestETFData();
      expect(data).toBeDefined();
      expect(data.etfs).toBeDefined();
      expect(data.dataDate).toBeDefined();
      expect(data.etfs.length).toBeGreaterThan(0);
    });

    it('should process Excel data correctly', async () => {
      // Create a mock Excel workbook
      const ws = XLSX.utils.json_to_sheet(mockExcelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      
      // Mock the axios response with the Excel file
      jest.spyOn(axios, 'get').mockResolvedValueOnce({
        data: XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      });

      const data = await fetchLatestETFData();
      expect(data).toBeDefined();
      expect(data.etfs).toBeDefined();
      expect(data.dataDate).toBeDefined();
      expect(data.etfs.length).toBe(2);
      expect(data.etfs[0]).toEqual({
        symbol: 'VAS',
        name: 'Vanguard Australian Shares Index ETF',
        performance: {
          '1M': 2.1,
          '1Y': 15.3,
          '5Y': 8.7
        },
        mer: 0.1,
        aum: 12500
      });
    });
  });
}); 