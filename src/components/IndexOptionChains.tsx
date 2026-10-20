import React, { useState } from 'react';
import {
  Layers,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  BarChart2,
  SlidersHorizontal,
  PlusCircle
} from 'lucide-react';
import {
  MarketIndexKey,
  IndexSpotData,
  OptionChainRow,
  StagedOrder
} from '../types/tradeOs';
import { playTickSound } from '../utils/audio';

interface IndexOptionChainsProps {
  indices: Record<MarketIndexKey, IndexSpotData>;
  selectedIndex: MarketIndexKey;
  onSelectIndex: (index: MarketIndexKey) => void;
  optionRows: OptionChainRow[];
  onStageStrike: (order: Partial<StagedOrder>) => void;
}

export const IndexOptionChains: React.FC<IndexOptionChainsProps> = ({
  indices,
  selectedIndex,
  onSelectIndex,
  optionRows,
  onStageStrike
}) => {
  const currentSpot = indices[selectedIndex];
  const [selectedExpiry, setSelectedExpiry] = useState(currentSpot.expiryDates[0]);
  const [strikeFilter, setStrikeFilter] = useState<'ATM_5' | 'ATM_8' | 'ALL'>('ATM_5');

  const indexTabs: MarketIndexKey[] = ['NIFTY', 'BANKNIFTY', 'SENSEX', 'FINNIFTY', 'MIDCPNIFTY'];

  // Filter strikes
  const atmIndex = optionRows.findIndex((r) => r.strike === currentSpot.atmStrike);
  const filteredRows = optionRows.filter((_, idx) => {
    if (strikeFilter === 'ALL' || atmIndex === -1) return true;
    const limit = strikeFilter === 'ATM_5' ? 5 : 8;
    return idx >= atmIndex - limit && idx <= atmIndex + limit;
  });

  // Calculate totals
  const totalCallOI = optionRows.reduce((acc, r) => acc + r.callOI, 0);
  const totalPutOI = optionRows.reduce((acc, r) => acc + r.putOI, 0);
  const totalCallChg = optionRows.reduce((acc, r) => acc + r.callOIChange, 0);
  const totalPutChg = optionRows.reduce((acc, r) => acc + r.putOIChange, 0);

  const pcrRatio = (totalPutOI / (totalCallOI || 1)).toFixed(2);
  const pcrSentiment =
    +pcrRatio > 1.25 ? 'Strong Bullish (Heavy Put Writing)' : +pcrRatio > 1.0 ? 'Mild Bullish' : +pcrRatio > 0.85 ? 'Neutral' : 'Bearish (Heavy Call Writing)';

  // Find ATM row
  const atmRow = optionRows.find((r) => r.strike === currentSpot.atmStrike);
  const straddleCost = atmRow ? (atmRow.callLTP + atmRow.putLTP).toFixed(2) : '0';

  const handleStrikeClick = (row: OptionChainRow, type: 'CE' | 'PE') => {
    playTickSound(type === 'CE');
    const instrument = `${selectedIndex} ${row.strike} ${type}`;
    const price = type === 'CE' ? row.callLTP : row.putLTP;
    const sl = +(price * 0.8).toFixed(2);
    const target = +(price * 1.4).toFixed(2);

    onStageStrike({
      index: selectedIndex,
      instrument,
      action: 'BUY',
      lots: 2,
      totalQty: 2 * currentSpot.lotSize,
      entryPrice: price,
      stopLoss: sl,
      target,
      riskAmount: (price - sl) * 2 * currentSpot.lotSize,
      potentialReward: (target - price) * 2 * currentSpot.lotSize,
      rrRatio: +((target - price) / (price - sl)).toFixed(2)
    });
  };

  return (
    <div className="bg-[#0f141f] border border-[#1e2638] rounded-lg p-4 shadow-sm mb-6">
      {/* Panel Header & Index Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-[#1b2234]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
            Index Option Chains
          </h2>
          <span className="hidden sm:inline text-xs text-slate-500 font-mono">
            Real-Time Derivatives Grid · Strike Volatility & Open Interest
          </span>
        </div>

        {/* Index Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {indexTabs.map((key) => {
            const ind = indices[key];
            const isSelected = selectedIndex === key;
            const isUp = ind.change >= 0;
            return (
              <button
                key={key}
                onClick={() => {
                  onSelectIndex(key);
                  setSelectedExpiry(indices[key].expiryDates[0]);
                }}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-semibold shadow-sm'
                    : 'bg-[#090d14] border border-[#192235] text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className="font-bold">{key}</span>
                <span className="tabular-nums font-semibold text-white">
                  {ind.spotPrice.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                </span>
                <span className={`text-[10px] ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isUp ? '+' : ''}
                  {ind.changePercent.toFixed(2)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3 my-3">
        {/* Spot & Range */}
        <div className="bg-[#0b0e15] border border-[#192235] p-2.5 rounded">
          <div className="text-[10px] font-mono text-slate-500 uppercase">
            {currentSpot.name} Spot
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-bold font-mono text-white tabular-nums">
              {currentSpot.spotPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span
              className={`text-xs font-mono font-medium ${
                currentSpot.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {currentSpot.change >= 0 ? '+' : ''}
              {currentSpot.change.toFixed(2)}
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">
            Lot: {currentSpot.lotSize} | Tick: ₹{currentSpot.tickSize}
          </div>
        </div>

        {/* Expiry Selector */}
        <div className="bg-[#0b0e15] border border-[#192235] p-2.5 rounded">
          <div className="text-[10px] font-mono text-slate-500 uppercase">
            Selected Expiry
          </div>
          <div className="relative mt-1">
            <select
              value={selectedExpiry}
              onChange={(e) => setSelectedExpiry(e.target.value)}
              aria-label="Select option expiry cycle"
              className="w-full bg-[#121824] border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer appearance-none"
            >
              {currentSpot.expiryDates.map((exp) => (
                <option key={exp} value={exp}>
                  {exp}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
          </div>
          <div className="text-[10px] font-mono text-emerald-400 mt-1">
            Current Weekly Cycle
          </div>
        </div>

        {/* PCR */}
        <div className="bg-[#0b0e15] border border-[#192235] p-2.5 rounded">
          <div className="text-[10px] font-mono text-slate-500 uppercase">
            Put/Call Ratio (PCR)
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-base font-bold font-mono text-amber-400 tabular-nums">
              {pcrRatio}
            </span>
            <span className="text-[11px] font-mono text-slate-300 truncate">
              {pcrSentiment}
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">
            Total PE: {(totalPutOI / 100000).toFixed(1)}L vs CE: {(totalCallOI / 100000).toFixed(1)}L
          </div>
        </div>

        {/* Max Pain & ATM Straddle */}
        <div className="bg-[#0b0e15] border border-[#192235] p-2.5 rounded">
          <div className="text-[10px] font-mono text-slate-500 uppercase">
            Max Pain / ATM Straddle
          </div>
          <div className="flex items-baseline justify-between mt-0.5">
            <span className="text-sm font-bold font-mono text-white tabular-nums">
              Pain: {currentSpot.maxPain}
            </span>
            <span className="text-xs font-mono text-amber-300">
              ₹{straddleCost}
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">
            ATM Strike: <strong className="text-slate-300">{currentSpot.atmStrike}</strong>
          </div>
        </div>

        {/* Open Interest Ratio Bar */}
        <div className="bg-[#0b0e15] border border-[#192235] p-2.5 rounded col-span-2 flex flex-col justify-between">
          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-emerald-400">Total Put OI: {(totalPutOI / 100000).toFixed(1)}L ({totalPutChg >= 0 ? '+' : ''}{(totalPutChg / 1000).toFixed(0)}k)</span>
            <span className="text-rose-400">Total Call OI: {(totalCallOI / 100000).toFixed(1)}L ({totalCallChg >= 0 ? '+' : ''}{(totalCallChg / 1000).toFixed(0)}k)</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex my-1">
            <div
              className="bg-emerald-500 transition-all"
              style={{ width: `${(totalPutOI / (totalPutOI + totalCallOI)) * 100}%` }}
              title="Put Open Interest (Support Support)"
            />
            <div
              className="bg-rose-500 transition-all"
              style={{ width: `${(totalCallOI / (totalPutOI + totalCallOI)) * 100}%` }}
              title="Call Open Interest (Resistance Defended)"
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
            <span>Net PE Dominance: {((totalPutOI / (totalPutOI + totalCallOI)) * 100).toFixed(1)}%</span>
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Strike View:</span>
              <button
                onClick={() => setStrikeFilter('ATM_5')}
                className={`px-1.5 py-0.2 rounded cursor-pointer ${
                  strikeFilter === 'ATM_5' ? 'bg-slate-700 text-white font-bold' : 'hover:text-slate-300'
                }`}
              >
                ±5
              </button>
              <button
                onClick={() => setStrikeFilter('ATM_8')}
                className={`px-1.5 py-0.2 rounded cursor-pointer ${
                  strikeFilter === 'ATM_8' ? 'bg-slate-700 text-white font-bold' : 'hover:text-slate-300'
                }`}
              >
                ±8
              </button>
              <button
                onClick={() => setStrikeFilter('ALL')}
                className={`px-1.5 py-0.2 rounded cursor-pointer ${
                  strikeFilter === 'ALL' ? 'bg-slate-700 text-white font-bold' : 'hover:text-slate-300'
                }`}
              >
                All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Option Chain Grid */}
      <div className="overflow-x-auto border border-[#1b2234] rounded">
        <table className="w-full text-xs font-mono border-collapse min-w-[980px]">
          <thead>
            {/* Split Top Header */}
            <tr className="bg-[#0b0e15] border-b border-[#1b2234] text-slate-400 uppercase text-[10px] tracking-wider">
              <th colSpan={6} className="py-2 px-3 text-center text-emerald-400 border-r border-[#1b2234] bg-emerald-950/20">
                CALL OPTIONS (CE)
              </th>
              <th className="py-2 px-4 text-center text-amber-300 bg-amber-950/20 font-bold border-r border-[#1b2234]">
                STRIKE
              </th>
              <th colSpan={6} className="py-2 px-3 text-center text-rose-400 bg-rose-950/20">
                PUT OPTIONS (PE)
              </th>
            </tr>
            {/* Columns Header */}
            <tr className="bg-[#0d121c] border-b border-[#1b2234] text-slate-400 text-[10px]">
              <th className="py-1.5 px-2 text-right">OI (Lots)</th>
              <th className="py-1.5 px-2 text-right">Chg OI</th>
              <th className="py-1.5 px-2 text-right">Volume</th>
              <th className="py-1.5 px-2 text-right">IV %</th>
              <th className="py-1.5 px-2 text-right">Delta</th>
              <th className="py-1.5 px-3 text-right text-emerald-400 font-semibold border-r border-[#1b2234]">
                Call LTP
              </th>

              <th className="py-1.5 px-4 text-center text-slate-200 font-bold border-r border-[#1b2234]">
                Strike Price
              </th>

              <th className="py-1.5 px-3 text-left text-rose-400 font-semibold border-r border-[#1b2234]/40">
                Put LTP
              </th>
              <th className="py-1.5 px-2 text-left">Delta</th>
              <th className="py-1.5 px-2 text-left">IV %</th>
              <th className="py-1.5 px-2 text-left">Volume</th>
              <th className="py-1.5 px-2 text-left">Chg OI</th>
              <th className="py-1.5 px-2 text-left">OI (Lots)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#161c2a]">
            {filteredRows.map((row) => {
              const isAtm = row.strike === currentSpot.atmStrike;
              const isCallITM = row.strike < currentSpot.spotPrice;
              const isPutITM = row.strike > currentSpot.spotPrice;

              return (
                <tr
                  key={row.strike}
                  className={`transition-colors hover:bg-slate-800/40 tabular-nums ${
                    isAtm ? 'bg-amber-500/10 font-medium' : ''
                  }`}
                >
                  {/* CALLS */}
                  <td className={`py-1.5 px-2 text-right text-slate-300 ${isCallITM ? 'bg-emerald-950/15' : ''}`}>
                    {row.callOI.toLocaleString()}
                  </td>
                  <td
                    className={`py-1.5 px-2 text-right font-medium ${
                      row.callOIChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    } ${isCallITM ? 'bg-emerald-950/15' : ''}`}
                  >
                    {row.callOIChange >= 0 ? '+' : ''}
                    {row.callOIChange.toLocaleString()}
                  </td>
                  <td className={`py-1.5 px-2 text-right text-slate-400 ${isCallITM ? 'bg-emerald-950/15' : ''}`}>
                    {row.callVolume.toLocaleString()}
                  </td>
                  <td className={`py-1.5 px-2 text-right text-slate-400 ${isCallITM ? 'bg-emerald-950/15' : ''}`}>
                    {row.callIV}
                  </td>
                  <td className={`py-1.5 px-2 text-right text-slate-300 ${isCallITM ? 'bg-emerald-950/15' : ''}`}>
                    {row.callDelta}
                  </td>
                  <td
                    onClick={() => handleStrikeClick(row, 'CE')}
                    title={`Click to stage BUY ${selectedIndex} ${row.strike} CE`}
                    className={`py-1.5 px-3 text-right font-bold text-emerald-400 border-r border-[#1b2234] cursor-pointer hover:bg-emerald-500/20 transition-colors ${
                      isCallITM ? 'bg-emerald-950/25' : ''
                    }`}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>₹{row.callLTP.toFixed(2)}</span>
                      <PlusCircle className="w-3 h-3 text-emerald-500 opacity-60 hover:opacity-100" />
                    </div>
                  </td>

                  {/* STRIKE */}
                  <td
                    className={`py-1.5 px-4 text-center font-bold border-r border-[#1b2234] ${
                      isAtm
                        ? 'bg-amber-500/25 text-amber-300 ring-1 ring-amber-500/50'
                        : 'bg-[#0e131d] text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{row.strike.toLocaleString()}</span>
                      {isAtm && (
                        <span className="text-[9px] px-1 py-0.2 bg-amber-500 text-black font-extrabold rounded">
                          ATM
                        </span>
                      )}
                    </div>
                  </td>

                  {/* PUTS */}
                  <td
                    onClick={() => handleStrikeClick(row, 'PE')}
                    title={`Click to stage BUY ${selectedIndex} ${row.strike} PE`}
                    className={`py-1.5 px-3 text-left font-bold text-rose-400 border-r border-[#1b2234]/40 cursor-pointer hover:bg-rose-500/20 transition-colors ${
                      isPutITM ? 'bg-rose-950/25' : ''
                    }`}
                  >
                    <div className="flex items-center justify-start gap-1">
                      <PlusCircle className="w-3 h-3 text-rose-500 opacity-60 hover:opacity-100" />
                      <span>₹{row.putLTP.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className={`py-1.5 px-2 text-left text-slate-300 ${isPutITM ? 'bg-rose-950/15' : ''}`}>
                    {row.putDelta}
                  </td>
                  <td className={`py-1.5 px-2 text-left text-slate-400 ${isPutITM ? 'bg-rose-950/15' : ''}`}>
                    {row.putIV}
                  </td>
                  <td className={`py-1.5 px-2 text-left text-slate-400 ${isPutITM ? 'bg-rose-950/15' : ''}`}>
                    {row.putVolume.toLocaleString()}
                  </td>
                  <td
                    className={`py-1.5 px-2 text-left font-medium ${
                      row.putOIChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    } ${isPutITM ? 'bg-rose-950/15' : ''}`}
                  >
                    {row.putOIChange >= 0 ? '+' : ''}
                    {row.putOIChange.toLocaleString()}
                  </td>
                  <td className={`py-1.5 px-2 text-left text-slate-300 ${isPutITM ? 'bg-rose-950/15' : ''}`}>
                    {row.putOI.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Quick Option Chain Guide Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-[11px] text-slate-500 font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-950/50 border border-emerald-800" />
            <span>Call ITM (In-The-Money)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-950/50 border border-rose-800" />
            <span>Put ITM (In-The-Money)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            <span>ATM Spot Pin</span>
          </span>
        </div>
        <div className="text-slate-400">
          Tip: Click any Call or Put LTP cell to instantly populate the Order Staging Ticket
        </div>
      </div>
    </div>
  );
};
