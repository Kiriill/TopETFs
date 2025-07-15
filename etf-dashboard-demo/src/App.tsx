import React, { useState, useEffect } from 'react';
import './App.css';
import { fetchLatestETFData } from './utils/dataFetcher';
import { ETFData } from './types';

type TimePeriod = '1M' | '1Y' | '5Y';

function App() {
  const [etfData, setEtfData] = useState<ETFData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('5Y');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLatestETFData();
      setEtfData(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load ETF data');
      setLoading(false);
    }
  };

  const formatPerformancePercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatMER = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const medals = ['🥇', '🥈', '🥉'];

  const sortedETFs = [...etfData]
    .sort((a, b) => b.performance[selectedPeriod] - a.performance[selectedPeriod])
    .slice(0, 10);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Top performing Australian ETFs</h1>
      <div className="text-gray-600 mb-6">
        List of top 10 performing ETFs on the ASX before accounting for fees
      </div>
      
      <div className="mb-4">
        <label className="mr-2">Time Period:</label>
        <select 
          value={selectedPeriod} 
          onChange={(e) => setSelectedPeriod(e.target.value as TimePeriod)}
          className="border p-1 rounded"
        >
          <option value="1M">1 Month</option>
          <option value="1Y">1 Year</option>
          <option value="5Y">5 Years</option>
        </select>
      </div>
      {/* Card-based layout for mobile */}
      <div className="flex flex-col gap-4 md:hidden">
        {sortedETFs.map((etf, idx) => (
          <div key={etf.symbol} className="bg-white rounded shadow p-4 flex flex-col">
            <div className="flex items-center mb-2">
              {idx < 3 ? (
                <span className="text-2xl mr-2">{medals[idx]}</span>
              ) : (
                <span className="font-bold text-lg mr-2">{idx + 1}</span>
              )}
              <span className="font-bold text-lg mr-2">{etf.symbol}</span>
              <span className="text-gray-700">{etf.name}</span>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <div>
                <span className="font-semibold">Performance ({selectedPeriod}): </span>
                <span>{formatPerformancePercentage(etf.performance[selectedPeriod])}</span>
              </div>
              <div>
                <span className="font-semibold">MER p.a.¹: </span>
                <span>{formatMER(etf.mer)}</span>
              </div>
              <div>
                <span className="font-semibold">FUM ($M)²: </span>
                <span>{formatCurrency(etf.aum)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Table for desktop and tablet */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-center w-12"></th>
                <th className="border p-2 text-left">Symbol</th>
                <th className="border p-2 text-left">Name</th>
                <th className="border p-2 text-right">Performance ({selectedPeriod})</th>
                <th className="border p-2 text-right">MER p.a.¹</th>
                <th className="border p-2 text-right">FUM ($M)²</th>
              </tr>
            </thead>
            <tbody>
              {sortedETFs.map((etf, idx) => (
                <tr key={etf.symbol} className="hover:bg-gray-50">
                  <td className="border p-2 text-center align-middle">
                    {idx < 3 ? medals[idx] : (idx + 1)}
                  </td>
                  <td className="border p-2" style={{ paddingLeft: 32, position: 'relative' }}>
                    {etf.symbol}
                  </td>
                  <td className="border p-2">{etf.name}</td>
                  <td className="border p-2 text-right">
                    <span className={etf.performance[selectedPeriod] >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatPerformancePercentage(etf.performance[selectedPeriod])}
                    </span>
                  </td>
                  <td className="border p-2 text-right">{formatMER(etf.mer)}</td>
                  <td className="border p-2 text-right">{formatCurrency(etf.aum)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Source and Disclaimer */}
      <div className="mt-8 text-sm text-gray-500">
        <div className="mb-4">
          ¹Management expense ratio (MER) is the percentage of your total investment that’s charged each year to cover the fund’s management and operating costs<br />
          ²Funds under management (FUM) in a given ETF is the total value of all investors’ money currently held in that ETF
        </div>
        <div><strong>Source:</strong> ASX Investment products monthly report</div>
        <div className="mt-2">
          <strong>Disclaimer:</strong> This dashboard is provided for informational purposes only and does not constitute financial, investment, tax, or other professional advice. Past performance is not indicative of future results. You should conduct your own research and/or consult a qualified professional before making any investment decisions.
        </div>
      </div>
    </div>
  );
}

export default App;
