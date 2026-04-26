'use client';
import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';
import { Skeleton } from '../../components/Skeleton';
import { toast } from 'sonner';

const PAIRS = [
  { base: 'USD', quote: 'UZS' },
  { base: 'EUR', quote: 'UZS' },
  { base: 'RUB', quote: 'UZS' },
  { base: 'KRW', quote: 'UZS' },
];

const CURRENCIES = ['USD', 'EUR', 'RUB', 'KRW', 'UZS'];

interface RateData {
  rates?: Record<string, number>;
  result?: string;
  time_last_update_unix?: number;
}

function getPairRate(data: RateData | null, base: string, quote: string) {
  if (!data || !data.rates) return null;
  if (base === 'USD') return data.rates[quote];
  if (!data.rates[base]) return null;
  return data.rates[quote] / data.rates[base];
}

export default function RatesPage() {
  const [today, setToday] = useState<RateData | null>(null);
  const [yesterday, setYesterday] = useState<RateData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('UZS');
  const [fromAmount, setFromAmount] = useState('');

  const fetchRates = async () => {
    setLoading(true);
    try {
      const resToday = await fetch('https://open.er-api.com/v6/latest/USD');
      const dataToday = await resToday.json();
      setToday(dataToday);
      localStorage.setItem('cached_rates', JSON.stringify(dataToday));
      
      if (dataToday.time_last_update_unix) {
        const lastUpdateDate = new Date(dataToday.time_last_update_unix * 1000);
        setLastUpdated(lastUpdateDate.toLocaleString());
      }

      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const dateStr = yesterdayDate.toISOString().split('T')[0];

      try {
        const resYesterday = await fetch(`https://open.er-api.com/v6/history/USD/${dateStr}`);
        const dataYesterday = await resYesterday.json();
        if (dataYesterday.result === 'success') {
          setYesterday(dataYesterday);
        }
      } catch {
        setYesterday(null);
      }
    } catch (error) {
      console.error('Failed to fetch rates:', error);
      const cached = localStorage.getItem('cached_rates');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setToday(parsed);
          toast.warning('Live API failed. Using cached rates.');
        } catch {
          toast.error('Failed to load exchange rates.');
        }
      } else {
        toast.error('Failed to load exchange rates.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const toAmount = (() => {
    if (!fromAmount || !today || !today.rates) return '';
    const amount = parseFloat(fromAmount);
    if (isNaN(amount) || amount === 0) return '';
    const rate = getPairRate(today, fromCurrency, toCurrency);
    if (rate === null) return '';
    return (amount * rate).toFixed(2);
  })();

  return (
    <div>
      <div className="flex gap-6 items-stretch">
        <div className="flex-1">
          <div className="bg-white dark:bg-[#13161f] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Exchange Rates</h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">Updates every 10 min</span>
            </div>

            <div>
{loading ? (
                <div className="space-y-0">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : (
                PAIRS.map((pair, i) => {
                const rate = getPairRate(today, pair.base, pair.quote);
                const yesterdayRate = getPairRate(yesterday, pair.base, pair.quote);
                
                let changePercent = null;
                let isPositive = false;
                if (rate && yesterdayRate) {
                  changePercent = ((rate - yesterdayRate) / yesterdayRate) * 100;
                  isPositive = changePercent > 0;
                }
                
                const isLast = i === PAIRS.length - 1;

                return (
                  <div
                    key={pair.base + pair.quote}
                    className={`flex items-center justify-between py-4 ${!isLast ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}
                  >
                    <div className="font-medium">{pair.base}/{pair.quote}</div>
                    <div className="text-gray-900 dark:text-gray-300">
                      {rate ? rate.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
                    </div>
                    <div>
                      {changePercent !== null ? (
                        <span className={`inline-flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-500 dark:text-red-400'}`}>
                          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">—</span>
                      )}
                    </div>
                  </div>
                );
              })
              )}
            </div>

            {lastUpdated && (
              <div className="mt-4 text-right">
                <span className="text-xs text-gray-400 dark:text-gray-500">Last updated: {lastUpdated}</span>
              </div>
            )}
          </div>
        </div>

        <div className="w-80 flex-shrink-0">
          <div className="bg-white dark:bg-[#13161f] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl p-6 overflow-hidden h-full flex flex-col justify-between">
            <h3 className="text-lg font-semibold mb-6">Currency Converter</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">I want to sell</label>
                <div className="flex w-full items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 min-w-0 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm"
                  />
                  <select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                    className="shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleSwap}
                  className="bg-gray-100 dark:bg-gray-700 border dark:border-gray-600 rounded-full p-2"
                >
                  <ArrowUpDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">I will receive</label>
                <div className="flex w-full items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={toAmount}
                    readOnly
                    placeholder="0.00"
                    className="flex-1 min-w-0 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm"
                  />
                  <select
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}
                    className="shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
