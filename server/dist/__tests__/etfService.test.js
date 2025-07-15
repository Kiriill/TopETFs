"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const etfService_1 = require("../services/etfService");
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const XLSX = __importStar(require("xlsx"));
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
        path.join.mockImplementation((...args) => args.join('/'));
        fs.existsSync.mockReturnValue(false);
        fs.mkdirSync.mockImplementation(() => undefined);
    });
    describe('checkForNewData', () => {
        it('should return true when new data is available', async () => {
            const mockAxiosHead = jest.spyOn(axios_1.default, 'head').mockResolvedValueOnce({});
            const result = await (0, etfService_1.checkForNewData)();
            expect(result).toBe(true);
            expect(mockAxiosHead).toHaveBeenCalled();
        });
        it('should return false when no new data is available', async () => {
            jest.spyOn(axios_1.default, 'head').mockRejectedValueOnce(new Error('404'));
            const result = await (0, etfService_1.checkForNewData)();
            expect(result).toBe(false);
        });
    });
    describe('fetchLatestETFData', () => {
        it('should return mock data when ASX data is not available', async () => {
            jest.spyOn(axios_1.default, 'get').mockRejectedValueOnce(new Error('404'));
            const data = await (0, etfService_1.fetchLatestETFData)();
            expect(data).toBeDefined();
            expect(data.length).toBeGreaterThan(0);
            expect(data[0].symbol).toBe('VAS');
        });
        it('should handle network errors gracefully', async () => {
            jest.spyOn(axios_1.default, 'get').mockRejectedValueOnce(new Error('Network Error'));
            const data = await (0, etfService_1.fetchLatestETFData)();
            expect(data).toBeDefined();
            expect(data.length).toBeGreaterThan(0);
        });
        it('should process Excel data correctly', async () => {
            // Create a mock Excel workbook
            const ws = XLSX.utils.json_to_sheet(mockExcelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
            // Mock the axios response with the Excel file
            jest.spyOn(axios_1.default, 'get').mockResolvedValueOnce({
                data: XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
            });
            const data = await (0, etfService_1.fetchLatestETFData)();
            expect(data).toBeDefined();
            expect(data.length).toBe(2);
            expect(data[0]).toEqual({
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
