import axios from 'axios';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { ETFData } from '../types';

// Updated ASX URL structure for 2025
const BASE_URL = 'https://www.asx.com.au';
const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'etf_data.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function getCurrentYearMonth(): Promise<string> {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getPreviousMonthMMMYYYYABS(): { mmm: string, yyyy: string, urlPart: string } {
  const now = new Date();
  now.setDate(1);
  now.setMonth(now.getMonth() - 1);
  const yyyy = now.getFullYear();
  const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const mmm = MONTHS[now.getMonth()];
  return {
    mmm,
    yyyy: String(yyyy),
    urlPart: `${mmm}-${yyyy}-abs`
  };
}

async function fetchExcelFile(): Promise<Buffer> {
  // Try up to 4 months back
  for (let i = 1; i <= 4; i++) {
    const now = new Date();
    now.setDate(1);
    now.setMonth(now.getMonth() - i);
    const yyyy = now.getFullYear();
    const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const mmm = MONTHS[now.getMonth()];
    const urlPart = `${mmm}-${yyyy}-abs`;
    const newUrl = `${BASE_URL}/content/dam/asx/issuers/asx-investment-products-reports/${yyyy}/excel/asx-investment-products-${urlPart}.xlsx`;
    console.log(`Trying to fetch ASX file from: ${newUrl}`);
    try {
      const response = await axios.get(newUrl, { responseType: 'arraybuffer' });
      console.log(`Successfully fetched ASX file for ${mmm} ${yyyy}`);
      return response.data;
    } catch (error) {
      console.warn(`File not found for ${mmm} ${yyyy}, trying previous month...`);
    }
  }
  throw new Error('No recent ASX ETF Excel file found for the last 4 months.');
}

export async function checkForNewData(): Promise<boolean> {
  const { yyyy, urlPart } = getPreviousMonthMMMYYYYABS();
  const newUrl = `${BASE_URL}/content/dam/asx/issuers/asx-investment-products-reports/${yyyy}/excel/asx-investment-products-${urlPart}.xlsx`;
  try {
    await axios.head(newUrl);
    return true;
  } catch (error) {
    return false;
  }
}

const EXPECTED_KEYS = [
  'asx code', 'fund name', 'mer (% p.a) ##', 'fum ($m)#',
  '1 month total return', '1 year total return', '5 year total return (ann.)'
];

function normalizeKey(key: string) {
  return key.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

function normalizeRowKeys(row: any) {
  const normalized: any = {};
  Object.keys(row).forEach(key => {
    const cleanKey = normalizeKey(key);
    if (cleanKey && EXPECTED_KEYS.includes(cleanKey)) {
      normalized[cleanKey] = row[key];
    }
  });
  return normalized;
}

export async function fetchLatestETFData(): Promise<ETFData[]> {
  try {
    const excelData = await fetchExcelFile();
    const workbook = XLSX.read(excelData);
    const sheetName = workbook.SheetNames.find(name => name.trim().toLowerCase() === 'spotlight etp list');
    if (!sheetName) {
      throw new Error('Sheet "Spotlight ETP List" not found in the Excel file.');
    }
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: 9 });
    if (jsonData.length > 0) {
      const norm = normalizeRowKeys(jsonData[0]);
      console.log('First normalized row:', norm);
    }
    if (jsonData.length > 1) {
      const norm2 = normalizeRowKeys(jsonData[1]);
      console.log('Second normalized row:', norm2);
    }

    // Log all headers from the header row (pre-normalisation)
    const headerRow = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 9 })[0];
    console.log('Header row (raw):', headerRow);

    // Transform the data
    const etfs: ETFData[] = jsonData
      .map((row: any) => normalizeRowKeys(row))
      .filter((row: any) => {
        // Must have a fund name
        const hasFundName = row['fund name'] && typeof row['fund name'] === 'string' && row['fund name'].trim() !== '';
        // FUM must be a valid number and not zero, and not n/a (case-insensitive, trimmed)
        let fumValue = row['fum ($m)#'];
        if (typeof fumValue === 'string') {
          fumValue = fumValue.trim().toLowerCase();
        }
        const isNA = fumValue === 'n/a';
        const fumNumber = parseFloat(row['fum ($m)#']);
        const hasValidFUM = !isNA && !isNaN(fumNumber) && fumNumber > 0;
        return hasFundName && hasValidFUM;
      })
      .map((row: any) => ({
        symbol: row['asx code'] || '',
        name: row['fund name'] || '',
        performance: {
          '1M': parseFloat(row['1 month total return'] || '0') || 0,
          '1Y': parseFloat(row['1 year total return'] || '0') || 0,
          '5Y': parseFloat(row['5 year total return (ann.)'] || '0') || 0,
        },
        mer: parseFloat(row['mer (% p.a) ##'] || '0') || 0,
        aum: parseFloat(row['fum ($m)#'] || '0') || 0,
      }));

    // Save to cache
    fs.writeFileSync(DATA_FILE, JSON.stringify({ data: etfs, timestamp: Date.now() }));
    return etfs;
  } catch (error) {
    console.error('Error fetching ETF data:', error);
    
    // Try to use cached data
    if (fs.existsSync(DATA_FILE)) {
      console.log('Using cached data');
      const cached = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      return cached.data;
    }

    // Use mock data as last resort
    console.log('Using mock data');
    return getMockData();
  }
}

function getMockData(): ETFData[] {
  return [
    {
      symbol: 'VAS',
      name: 'Vanguard Australian Shares Index ETF',
      performance: { '1M': 2.1, '1Y': 15.3, '5Y': 8.9 },
      mer: 0.10,
      aum: 12500,
    },
    // ... more mock data
  ];
} 