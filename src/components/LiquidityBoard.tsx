import React, { useState } from 'react';
import {
  Grid,
  TrendingUp,
  TrendingDown,
  Layers,
  Shield,
  Filter,
  BarChart3,
  MapPin,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  SectorItem,
  OiBuildupItem,
  DemandSupplyZone,
  MarketIndexKey,
  IndexSpotData
} from '../types/tradeOs';

interface LiquidityBoardProps {
  sectors: SectorItem[];
  oiBuildup: OiBuildupItem[];
  zones: DemandSupplyZone[];
  selectedIndex: MarketIndexKey;
  onSelectIndex: (index: MarketIndexKey) => void;
  indices: Record<MarketIndexKey, IndexSpotData>;
}

export const LiquidityBoard: React.FC<LiquidityBoardProps> = ({
  sectors,
  oiBuildup,
  zones,
  selectedIndex,
  onSelectIndex,
  indices
}) => {
  const [subTab, setSubTab] = useState<'ALL' | 'SECTORS' | 'OI_BUILDUP' | 'ZONES'>('ALL');
  const [oiCategoryFilter, setOiCategoryFilter] = useState<'ALL' | 'Long Build-up' | 'Short Build-up' | 'Short Covering' | 'Long Unwinding'>('ALL');

  const currentSpot = indices[selectedIndex];

  // Filtered OI buildup
  const filteredOi = oiBuildup.filter((item) => {
    if (oiCategoryFilter !== 'ALL' && item.category !== oiCategoryFilter) return false;
    return true;
  });

  // Filtered zones for selected index
  const filteredZones = zones.filter((z) => z.index === selectedIndex);

  // Sector stats
  const totalAdvances = sectors.reduce((acc, s) => acc + s.advanceCount, 0);
  const totalDeclines = sectors.reduce((acc, s) => acc + s.declineCount, 0);

  return (
    <div className="bg-[#0f141f] border border-[#1e2638] rounded-lg p-4 shadow-sm mb-6">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1b2234]">
        <div className="flex items-center gap-2">
          <Grid className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
            Liquidity Board
          </h2>
          <span className="hidden sm:inline text-xs text-slate-500 font-mono">
            Sector Heatmap · Institutional OI Build-Up · Orderflow Zones
          </span>
        </div>

        {/* View Mode Pills */}
        <div className="flex items-center gap-1 text-xs font-mono bg-[#0b0e15] border border-[#192235] p-1 rounded">
          <button
            onClick={() => setSubTab('ALL')}
            className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
              subTab === 'ALL' ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Unified Board
          </button>
          <button
            onClick={() => setSubTab('SECTORS')}
            className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
              subTab === 'SECTORS' ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sector Heatmap
          </button>
          <button
            onClick={() => setSubTab('OI_BUILDUP')}
            className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
              subTab === 'OI_BUILDUP' ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            OI Build-up
          </button>
          <button
            onClick={() => setSubTab('ZONES')}
            className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
              subTab === 'ZONES' ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Demand / Supply Zones
          </button>
        </div>
      </div>

      {/* Grid Layout depending on Tab */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-4">
        {/* Section 1: Sector Heatmap (Span 4 or 12) */}
        {(subTab === 'ALL' || subTab === 'SECTORS') && (
          <div className={`${subTab === 'SECTORS' ? 'lg:col-span-12' : 'lg:col-span-4'} flex flex-col justify-between`}>
            <div className="bg-[#0b0e15] border border-[#182030] rounded p-3 h-full flex flex-col justify-between">
              {/* Top subheader */}
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#161d2c] text-xs font-mono">
                  <span className="font-semibold text-slate-300">Sector Performance Heatmap</span>
                  <span className="text-[10px] text-emerald-400">
                    Adv: {totalAdvances} / Dec: {totalDeclines}
                  </span>
                </div>

                {/* Sector Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1 gap-2 max-h-[360px] overflow-y-auto pr-1">
                  {sectors.map((sec) => {
                    const isPositive = sec.changePercent >= 0;
                    return (
                      <div
                        key={sec.id}
                        className={`p-2 rounded border transition-colors ${
                          isPositive
                            ? sec.changePercent > 1.0
                              ? 'bg-emerald-950/40 border-emerald-800/60'
                              : 'bg-emerald-950/20 border-emerald-900/40'
                            : 'bg-rose-950/20 border-rose-900/40'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-200">{sec.name}</span>
                            <span className="text-[10px] text-slate-500 font-normal">
                              ({sec.weightInNifty}% wt)
                            </span>
                          </div>
                          <span
                            className={`font-bold tabular-nums flex items-center ${
                              isPositive ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isPositive ? '+' : ''}
                            {sec.changePercent.toFixed(2)}%
                          </span>
                        </div>

                        {/* Top constituent & breadth */}
                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-1">
                          <span>
                            Top: <strong className="text-slate-300">{sec.topStock}</strong> ({sec.topStockChange >= 0 ? '+' : ''}
                            {sec.topStockChange}%)
                          </span>
                          <span className="text-slate-500">
                            A/D: {sec.advanceCount}:{sec.declineCount}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] font-mono text-slate-500 flex justify-between">
                <span>Heavyweight Driver: HDFCBANK & INFY</span>
                <span className="text-emerald-400">High Sector Breadth</span>
              </div>
            </div>
          </div>
        )}

        {/* Section 2: OI Build-up Matrix (Span 4 or 12) */}
        {(subTab === 'ALL' || subTab === 'OI_BUILDUP') && (
          <div className={`${subTab === 'OI_BUILDUP' ? 'lg:col-span-12' : 'lg:col-span-4'} flex flex-col justify-between`}>
            <div className="bg-[#0b0e15] border border-[#182030] rounded p-3 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#161d2c] text-xs font-mono">
                  <span className="font-semibold text-slate-300">Open Interest Build-Up</span>
                  {/* Category filter */}
                  <select
                    value={oiCategoryFilter}
                    onChange={(e) => setOiCategoryFilter(e.target.value as any)}
                    aria-label="Filter Open Interest buildup category"
                    className="bg-[#121824] border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-slate-300 cursor-pointer"
                  >
                    <option value="ALL">All Dynamics</option>
                    <option value="Long Build-up">Long Build-up</option>
                    <option value="Short Build-up">Short Build-up</option>
                    <option value="Short Covering">Short Covering</option>
                    <option value="Long Unwinding">Long Unwinding</option>
                  </select>
                </div>

                {/* OI Matrix Cards */}
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {filteredOi.map((item, idx) => {
                    const isLongBuild = item.category === 'Long Build-up';
                    const isShortCover = item.category === 'Short Covering';
                    const isShortBuild = item.category === 'Short Build-up';

                    return (
                      <div
                        key={idx}
                        className="p-2 rounded bg-[#0e131d] border border-[#1a2233] text-xs font-mono"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">{item.symbol}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                              isLongBuild
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : isShortCover
                                ? 'bg-sky-950 text-sky-300 border border-sky-800'
                                : isShortBuild
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {item.category}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1 text-[10px] my-1 text-slate-400">
                          <div>
                            Price:{' '}
                            <strong className={item.priceChangePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              {item.priceChangePercent >= 0 ? '+' : ''}
                              {item.priceChangePercent}%
                            </strong>
                          </div>
                          <div>
                            OI:{' '}
                            <strong className={item.oiChangePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              {item.oiChangePercent >= 0 ? '+' : ''}
                              {item.oiChangePercent}%
                            </strong>
                          </div>
                          <div className="text-right">
                            Total: <strong className="text-slate-300">{item.totalOiLakhs}L</strong>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-500 leading-tight">
                          {item.implication}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] font-mono text-slate-500 flex justify-between">
                <span>Green: Bullish Accumulation</span>
                <span>Cyan: Short Capitulation</span>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Demand / Supply Zones (Span 4 or 12) */}
        {(subTab === 'ALL' || subTab === 'ZONES') && (
          <div className={`${subTab === 'ZONES' ? 'lg:col-span-12' : 'lg:col-span-4'} flex flex-col justify-between`}>
            <div className="bg-[#0b0e15] border border-[#182030] rounded p-3 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#161d2c] text-xs font-mono">
                  <span className="font-semibold text-slate-300">{selectedIndex} Liquidity Zones</span>
                  <span className="text-[10px] text-amber-400">
                    Spot: {currentSpot.spotPrice.toLocaleString()}
                  </span>
                </div>

                {/* Zones List */}
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {filteredZones.map((z) => {
                    const isSupply = z.levelType.includes('Supply');
                    const isDemand = z.levelType.includes('Demand');
                    const isPoc = z.levelType.includes('POC');

                    return (
                      <div
                        key={z.id}
                        className={`p-2 rounded border text-xs font-mono ${
                          isSupply
                            ? 'bg-rose-950/15 border-rose-900/40'
                            : isDemand
                            ? 'bg-emerald-950/15 border-emerald-900/40'
                            : 'bg-amber-950/15 border-amber-900/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-bold ${
                              isSupply ? 'text-rose-300' : isDemand ? 'text-emerald-300' : 'text-amber-300'
                            }`}
                          >
                            {z.levelType}
                          </span>
                          <span
                            className={`text-[10px] px-1 py-0.2 rounded font-semibold ${
                              z.strength === 'Critical'
                                ? 'bg-slate-800 text-amber-300 border border-amber-700/50'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {z.strength}
                          </span>
                        </div>

                        <div className="flex justify-between items-baseline my-1">
                          <span className="text-sm font-bold font-mono text-white tabular-nums">
                            {z.priceRange[0]} - {z.priceRange[1]}
                          </span>
                          <span
                            className={`text-[11px] font-semibold tabular-nums ${
                              z.distancePts > 0 ? 'text-rose-400' : z.distancePts < 0 ? 'text-emerald-400' : 'text-amber-300'
                            }`}
                          >
                            {z.distancePts > 0 ? `+${z.distancePts} pts (Above)` : z.distancePts < 0 ? `${z.distancePts} pts (Below)` : 'CURRENT AT SPOT'}
                          </span>
                        </div>

                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                          <span>Rejection touches: {z.touchCount}</span>
                          <span>Order absorption: Active</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] font-mono text-slate-500 flex justify-between">
                <span>Value Area High (VAH) to Value Area Low (VAL)</span>
                <span className="text-amber-400">Virgin CPR Untested</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
