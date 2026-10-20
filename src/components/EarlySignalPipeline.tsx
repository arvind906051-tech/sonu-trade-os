import React, { useState } from 'react';
import {
  Compass,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Zap,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  Search,
  Sparkles,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import {
  PipelineStage,
  SignalSetup,
  MarketIndexKey,
  StagedOrder,
  IndexSpotData
} from '../types/tradeOs';
import { playSignalChime, playTickSound } from '../utils/audio';

interface EarlySignalPipelineProps {
  setups: SignalSetup[];
  onAdvanceStage: (setupId: string) => void;
  onAddSignal: (setup: SignalSetup) => void;
  onStageSetup: (order: Partial<StagedOrder>) => void;
  indices: Record<MarketIndexKey, IndexSpotData>;
}

export const EarlySignalPipeline: React.FC<EarlySignalPipelineProps> = ({
  setups,
  onAdvanceStage,
  onAddSignal,
  onStageSetup,
  indices
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | MarketIndexKey>('ALL');
  const [selectedDirection, setSelectedDirection] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const stages: { key: PipelineStage; label: string; desc: string; color: string; stepNumber: number }[] = [
    { key: 'WATCH', label: 'WATCH', desc: 'Scanner tracking radar', color: 'border-slate-700 text-slate-300', stepNumber: 1 },
    { key: 'EARLY_WARNING', label: 'EARLY WARNING', desc: 'Gamma or OI anomaly', color: 'border-blue-700 text-blue-300', stepNumber: 2 },
    { key: 'BUILDING', label: 'BUILDING', desc: 'VWAP & Flow confluence', color: 'border-amber-600 text-amber-300', stepNumber: 3 },
    { key: 'CONFIRMED', label: 'CONFIRMED', desc: 'Volume expansion verified', color: 'border-emerald-600 text-emerald-300', stepNumber: 4 },
    { key: 'ENTRY_READY', label: 'ENTRY READY', desc: 'Execution trigger armed', color: 'border-amber-400 text-amber-300', stepNumber: 5 }
  ];

  const filteredSetups = setups.filter((s) => {
    if (selectedFilter !== 'ALL' && s.index !== selectedFilter) return false;
    if (selectedDirection !== 'ALL' && s.direction !== selectedDirection) return false;
    return true;
  });

  const handleAdvance = (setupId: string, currentStage: PipelineStage) => {
    playSignalChime();
    onAdvanceStage(setupId);
  };

  const handleStageOrder = (s: SignalSetup) => {
    const spot = indices[s.index];
    const lotSize = spot ? spot.lotSize : 25;
    const diff = Math.abs(s.entryPrice - s.stopLoss);
    const targetDiff = Math.abs(s.target1 - s.entryPrice);
    const rr = +(targetDiff / (diff || 1)).toFixed(2);

    playTickSound(true);
    onStageSetup({
      setupId: s.id,
      index: s.index,
      instrument: s.suggestedInstrument,
      action: s.direction === 'SHORT' ? 'BUY' : 'BUY', // Options buying (CE or PE)
      lots: 2,
      totalQty: 2 * lotSize,
      entryPrice: s.entryPrice,
      stopLoss: s.stopLoss,
      target: s.target1,
      riskAmount: diff * 2 * lotSize,
      potentialReward: targetDiff * 2 * lotSize,
      rrRatio: rr
    });
  };

  const handleSimulateNewSignal = () => {
    playSignalChime();
    const mockNew: SignalSetup = {
      id: `sig-${Date.now().toString().slice(-4)}`,
      index: 'BANKNIFTY',
      direction: 'LONG',
      stage: 'WATCH',
      title: 'PSU Bank Breakout Catalyst',
      suggestedInstrument: 'BANKNIFTY 52600 CE',
      confluences: ['SBIN testing 52-week breakout', 'Bank Nifty PCR rising above 1.10', 'Futures premium expanding +45 pts'],
      spotTrigger: 52480,
      entryPrice: 310,
      stopLoss: 255,
      target1: 420,
      target2: 510,
      riskReward: '1:2.9',
      confidenceScore: 74,
      detectedAt: new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }) + ' IST',
      estimatedMovePts: 140
    };
    onAddSignal(mockNew);
  };

  return (
    <div className="bg-[#0f141f] border border-[#1e2638] rounded-lg p-4 shadow-sm mb-6">
      {/* Panel Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-[#1b2234]">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
            Early-Signal Pipeline
          </h2>
          <span className="hidden sm:inline text-xs text-slate-500 font-mono">
            5-Stage Real-Time Trade Qualification Engine
          </span>
        </div>

        {/* Filter Bar & Action */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Index filter buttons */}
          <div className="flex items-center gap-1 bg-[#0b0e15] border border-[#192235] p-1 rounded">
            {(['ALL', 'NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'SENSEX'] as const).map((idx) => (
              <button
                key={idx}
                onClick={() => setSelectedFilter(idx)}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  selectedFilter === idx
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {idx}
              </button>
            ))}
          </div>

          {/* Direction filter */}
          <div className="flex items-center gap-1 bg-[#0b0e15] border border-[#192235] p-1 rounded">
            {(['ALL', 'LONG', 'SHORT'] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => setSelectedDirection(dir)}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  selectedDirection === dir
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {dir}
              </button>
            ))}
          </div>

          {/* Simulate New Signal Scan Button */}
          <button
            onClick={handleSimulateNewSignal}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Search className="w-3 h-3" />
            <span>Scan Radar</span>
          </button>
        </div>
      </div>

      {/* Visual 5-Stage Pipeline Progress Header */}
      <div className="my-4 bg-[#0a0d14] border border-[#182030] p-3 rounded">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 relative">
          {stages.map((stage, idx) => {
            const countInStage = setups.filter((s) => s.stage === stage.key).length;
            const isEntryReady = stage.key === 'ENTRY_READY';
            return (
              <div
                key={stage.key}
                className={`p-2 rounded border relative flex flex-col justify-between ${
                  isEntryReady
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                    : 'bg-[#0f141f]/70 border-[#1f283d]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-bold text-slate-300">
                      {stage.stepNumber}
                    </span>
                    <span className={`font-bold ${isEntryReady ? 'text-amber-400' : 'text-slate-200'}`}>
                      {stage.label}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      countInStage > 0
                        ? isEntryReady
                          ? 'bg-amber-500 text-black'
                          : 'bg-slate-700 text-slate-200'
                        : 'text-slate-600'
                    }`}
                  >
                    {countInStage}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 truncate font-mono">
                  {stage.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5-Column Swimlane of Signals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {stages.map((stage) => {
          const stageSetups = filteredSetups.filter((s) => s.stage === stage.key);

          return (
            <div
              key={stage.key}
              className="bg-[#0b0e15] border border-[#182030] rounded p-2.5 flex flex-col min-h-[380px]"
            >
              {/* Column Title */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#161d2d] text-xs font-mono">
                <span className="font-semibold text-slate-300">{stage.label}</span>
                <span className="text-[10px] text-slate-500">{stageSetups.length} active</span>
              </div>

              {/* Card List in Stage */}
              <div className="space-y-2.5 flex-1 overflow-y-auto pr-0.5">
                {stageSetups.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-center p-3 text-[11px] text-slate-600 font-mono border border-dashed border-slate-900 rounded">
                    <span>No setups at {stage.label}</span>
                    <span className="text-[9px] text-slate-700 mt-1">Advances from scanner flow</span>
                  </div>
                ) : (
                  stageSetups.map((setup) => {
                    const isLong = setup.direction === 'LONG';
                    const isExpanded = expandedCardId === setup.id;
                    const isEntry = setup.stage === 'ENTRY_READY';

                    return (
                      <div
                        key={setup.id}
                        className={`rounded border transition-all text-xs font-mono p-2.5 flex flex-col justify-between ${
                          isEntry
                            ? 'bg-[#121926] border-amber-500/50 shadow-md ring-1 ring-amber-500/20'
                            : 'bg-[#0f1420] border-[#222c40] hover:border-slate-600'
                        }`}
                      >
                        {/* Top: Instrument & Direction */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-bold text-slate-200">{setup.index}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded font-bold text-[10px] flex items-center gap-0.5 ${
                                isLong
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-rose-950 text-rose-300 border border-rose-800'
                              }`}
                            >
                              {isLong ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                              {setup.direction}
                            </span>
                          </div>

                          <div className="text-slate-100 font-bold text-xs leading-tight mb-1">
                            {setup.title}
                          </div>

                          <div className="text-[11px] text-amber-300 font-semibold mb-2">
                            {setup.suggestedInstrument}
                          </div>

                          {/* Trigger & RR Strip */}
                          <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-[#090c13] p-1.5 rounded mb-2 border border-slate-900">
                            <div>
                              <span className="text-slate-500 block">Spot Trigger</span>
                              <span className="text-slate-200 font-bold tabular-nums">
                                {setup.spotTrigger.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">R:R Ratio</span>
                              <span className="text-emerald-400 font-bold">{setup.riskReward}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Est. Move</span>
                              <span className="text-slate-300 tabular-nums">+{setup.estimatedMovePts} pts</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Score</span>
                              <span className="text-amber-300 font-bold">{setup.confidenceScore}%</span>
                            </div>
                          </div>

                          {/* Confluences Drawer */}
                          <div className="space-y-1 mb-2">
                            {setup.confluences.slice(0, isExpanded ? setup.confluences.length : 2).map((conf, cIdx) => (
                              <div key={cIdx} className="flex items-start gap-1 text-[10px] text-slate-400">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                                <span className="leading-tight">{conf}</span>
                              </div>
                            ))}
                            {setup.confluences.length > 2 && (
                              <button
                                onClick={() => setExpandedCardId(isExpanded ? null : setup.id)}
                                className="text-[9px] text-slate-500 hover:text-slate-300 cursor-pointer underline"
                              >
                                {isExpanded ? 'Show less' : `+${setup.confluences.length - 2} more confluences`}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Card Action Buttons */}
                        <div className="pt-2 border-t border-[#1b2333] space-y-1.5">
                          {isEntry ? (
                            <button
                              onClick={() => handleStageOrder(setup)}
                              className="w-full py-1.5 px-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                            >
                              <Zap className="w-3.5 h-3.5 fill-current" />
                              <span>STAGE EXECUTION</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAdvance(setup.id, setup.stage)}
                              className="w-full py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span>Advance Stage</span>
                              <ArrowRight className="w-3 h-3 text-amber-400" />
                            </button>
                          )}
                          <div className="flex justify-between items-center text-[9px] text-slate-500">
                            <span>Detected: {setup.detectedAt}</span>
                            <span className="text-slate-400">SL: ₹{setup.stopLoss}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
