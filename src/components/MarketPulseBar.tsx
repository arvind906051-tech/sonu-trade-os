import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Globe,
  Activity,
  DollarSign,
  Calendar,
  ChevronRight,
  Clock,
  AlertCircle
} from 'lucide-react';
import { GlobalMarketAsset, FiiDiiFlow, EconomicEvent } from '../types/tradeOs';

interface MarketPulseBarProps {
  globalAssets: GlobalMarketAsset[];
  vixValue: number;
  vixChange: number;
  fiiDii: FiiDiiFlow;
  economicEvents: EconomicEvent[];
  onSelectEvent?: (event: EconomicEvent) => void;
}

export const MarketPulseBar: React.FC<MarketPulseBarProps> = ({
  globalAssets,
  vixValue,
  vixChange,
  fiiDii,
  economicEvents,
  onSelectEvent
}) => {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<'ALL' | 'HIGH'>('ALL');

  // Compute overall global bias
  const avgGlobalChange =
    globalAssets
      .filter((a) => a.region === 'US' || a.region === 'ASIA' || a.region === 'EUROPE')
      .reduce((acc, curr) => acc + curr.changePercent, 0) / 6;

  const globalSentiment =
    avgGlobalChange > 0.35
      ? 'Bullish'
      : avgGlobalChange > 0.05
      ? 'Mildly Bullish'
      : avgGlobalChange > -0.2
      ? 'Neutral'
      : 'Bearish';

  const vixChangePct = ((vixChange / (vixValue - vixChange)) * 100).toFixed(2);
  const isVixUp = vixChange >= 0;

  const filteredEvents =
    eventFilter === 'HIGH'
      ? economicEvents.filter((e) => e.impact === 'High')
      : economicEvents;

  const netCashFlow = fiiDii.diiCashNetCr + fiiDii.fiiCashNetCr;

  return (
    <div className="bg-[#0f141f] border border-[#1e2638] rounded-lg p-4 shadow-sm mb-6">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1b2234]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
            Market Pulse Bar
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Macro Sentiment · Volatility Regime · Institutional Flows · Event Triggers
          </span>
        </div>

        {/* Global summary badge */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Global Bias:</span>
          <span
            className={`font-semibold px-2 py-0.5 rounded text-xs ${
              globalSentiment.includes('Bullish')
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                : globalSentiment.includes('Bearish')
                ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            {globalSentiment} ({avgGlobalChange > 0 ? '+' : ''}
            {avgGlobalChange.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Grid of 4 Core Pulse Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pt-4">
        {/* Module 1: Global Bias Ticker */}
        <div className="bg-[#0b0e15] border border-[#192235] rounded p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>Global Indices & Macro</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/30 px-1.5 py-0.5 rounded">
              GIFT Nifty +145 pts
            </span>
          </div>

          {/* Asset list */}
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {globalAssets.map((asset) => {
              const isPositive = asset.change >= 0;
              const isSelected = selectedAsset === asset.symbol;
              return (
                <button
                  key={asset.symbol}
                  onClick={() => setSelectedAsset(isSelected ? null : asset.symbol)}
                  className={`w-full flex items-center justify-between text-xs py-1 px-1.5 rounded transition-colors text-left cursor-pointer ${
                    isSelected ? 'bg-slate-800/80 border border-slate-700' : 'hover:bg-slate-850/50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-medium text-slate-200">{asset.symbol}</span>
                    <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                      {asset.region}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono tabular-nums">
                    <span className="text-slate-300">{asset.price.toLocaleString()}</span>
                    <span
                      className={`text-[11px] font-medium flex items-center ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {asset.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-900 flex justify-between text-[11px] text-slate-500 font-mono">
            <span>US 10Y: 4.085%</span>
            <span>Brent: $74.32</span>
            <span>USD/INR: 84.06</span>
          </div>
        </div>

        {/* Module 2: India VIX & Volatility Regime */}
        <div className="bg-[#0b0e15] border border-[#192235] rounded p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>India VIX Regime</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Rank: 28th Pct
            </span>
          </div>

          <div className="flex items-baseline justify-between my-1">
            <div>
              <span className="text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
                {vixValue.toFixed(2)}
              </span>
              <span
                className={`ml-2 text-xs font-mono font-semibold tabular-nums inline-flex items-center ${
                  isVixUp ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {isVixUp ? <TrendingUp className="w-3 h-3 mr-0.5 inline" /> : <TrendingDown className="w-3 h-3 mr-0.5 inline" />}
                {isVixUp ? '+' : ''}
                {vixChange.toFixed(2)} ({isVixUp ? '+' : ''}
                {vixChangePct}%)
              </span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950/50 text-blue-300 border border-blue-800/40">
              Low IV Regime
            </span>
          </div>

          {/* VIX Day Range Bar */}
          <div className="my-2">
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1">
              <span>Day Low: 12.85</span>
              <span>Day High: 13.68</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 rounded-full"
                style={{ width: `${Math.min(100, Math.max(10, ((vixValue - 10) / 15) * 100))}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded p-2 text-[11px] text-slate-400 leading-relaxed font-sans">
            <span className="font-semibold text-slate-300">Desk Implication:</span> Option buying risk is limited; favor Debit Spreads & Long Gamma scalps. Caution on aggressive naked CE/PE writes.
          </div>
        </div>

        {/* Module 3: FII / DII Cash Flow & Derivatives */}
        <div className="bg-[#0b0e15] border border-[#192235] rounded p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>FII / DII Institutional Flow</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Provisional EOD</span>
          </div>

          {/* Cash breakdown */}
          <div className="grid grid-cols-2 gap-2 my-1">
            <div className="bg-slate-900/80 border border-slate-800 p-2 rounded">
              <div className="text-[10px] font-mono text-slate-400">FII Cash Net</div>
              <div className="text-sm font-bold font-mono text-rose-400 tabular-nums">
                -₹{Math.abs(fiiDii.fiiCashNetCr).toFixed(1)} Cr
              </div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-2 rounded">
              <div className="text-[10px] font-mono text-slate-400">DII Cash Net</div>
              <div className="text-sm font-bold font-mono text-emerald-400 tabular-nums">
                +₹{fiiDii.diiCashNetCr.toFixed(1)} Cr
              </div>
            </div>
          </div>

          {/* Net Flow bar */}
          <div className="my-1.5">
            <div className="flex justify-between text-[11px] font-mono mb-1">
              <span className="text-slate-400">Combined Net Flow:</span>
              <span className={`font-semibold tabular-nums ${netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netCashFlow >= 0 ? '+' : ''}₹{netCashFlow.toFixed(1)} Cr
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>FII Index Fut Long: <strong className="text-slate-300">{fiiDii.fiiIndexFuturesLongPct}%</strong></span>
              <span>Short: <strong className="text-rose-400">{fiiDii.fiiIndexFuturesShortPct}%</strong></span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-slate-900 text-slate-400">
            <span>Composite Bias:</span>
            <span className="text-amber-400 font-medium">{fiiDii.institutionalBias}</span>
          </div>
        </div>

        {/* Module 4: Economic Events & High-Impact Triggers */}
        <div className="bg-[#0b0e15] border border-[#192235] rounded p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Calendar className="w-3.5 h-3.5 text-violet-400" />
              <span>Economic Event Triggers</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono">
              <button
                onClick={() => setEventFilter('ALL')}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${
                  eventFilter === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setEventFilter('HIGH')}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${
                  eventFilter === 'HIGH' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                High Only
              </button>
            </div>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {filteredEvents.map((ev) => {
              const isHigh = ev.impact === 'High';
              return (
                <div
                  key={ev.id}
                  onClick={() => onSelectEvent && onSelectEvent(ev)}
                  className="p-1.5 rounded bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors cursor-pointer text-xs"
                >
                  <div className="flex items-center justify-between text-[11px] mb-0.5">
                    <span className="font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {ev.timeIST}
                    </span>
                    <span
                      className={`font-mono text-[10px] px-1 py-0.2 rounded font-semibold ${
                        isHigh ? 'bg-rose-950 text-rose-300 border border-rose-800/50' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {ev.impact} Impact
                    </span>
                  </div>
                  <div className="text-slate-200 font-medium truncate">{ev.title}</div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-0.5">
                    <span>Exp: {ev.forecast || 'N/A'}</span>
                    {ev.countdownMinutes ? (
                      <span className="text-amber-400 font-semibold">{ev.countdownMinutes}m remaining</span>
                    ) : (
                      <span className="text-emerald-400">Released ({ev.actual})</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-900 text-[11px] font-mono text-slate-500 flex justify-between items-center">
            <span>Weekly Derivatives Expiry Today</span>
            <span className="text-emerald-400">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
