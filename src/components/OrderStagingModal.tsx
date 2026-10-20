import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import {
  StagedOrder,
  MarketIndexKey,
  IndexSpotData,
  RiskSettings,
  DailyRiskState
} from '../types/tradeOs';
import { playAlertWarning, playSignalChime } from '../utils/audio';

interface OrderStagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  stagedOrder: Partial<StagedOrder> | null;
  indices: Record<MarketIndexKey, IndexSpotData>;
  riskSettings: RiskSettings;
  dailyRiskState: DailyRiskState;
  onConfirmExecution: (order: StagedOrder) => void;
}

export const OrderStagingModal: React.FC<OrderStagingModalProps> = ({
  isOpen,
  onClose,
  stagedOrder,
  indices,
  riskSettings,
  dailyRiskState,
  onConfirmExecution
}) => {
  if (!isOpen) return null;

  const defaultIndex: MarketIndexKey = stagedOrder?.index || 'NIFTY';
  const spotData = indices[defaultIndex];

  const [indexKey, setIndexKey] = useState<MarketIndexKey>(defaultIndex);
  const [instrument, setInstrument] = useState<string>(
    stagedOrder?.instrument || `${defaultIndex} ${spotData.atmStrike} CE`
  );
  const [action, setAction] = useState<'BUY' | 'SELL'>(stagedOrder?.action || 'BUY');
  const [lots, setLots] = useState<number>(stagedOrder?.lots || 2);
  const [entryPrice, setEntryPrice] = useState<number>(stagedOrder?.entryPrice || 145);
  const [stopLoss, setStopLoss] = useState<number>(stagedOrder?.stopLoss || 115);
  const [target, setTarget] = useState<number>(stagedOrder?.target || 215);

  useEffect(() => {
    if (stagedOrder) {
      if (stagedOrder.index) setIndexKey(stagedOrder.index);
      if (stagedOrder.instrument) setInstrument(stagedOrder.instrument);
      if (stagedOrder.action) setAction(stagedOrder.action);
      if (stagedOrder.lots) setLots(stagedOrder.lots);
      if (stagedOrder.entryPrice) setEntryPrice(stagedOrder.entryPrice);
      if (stagedOrder.stopLoss) setStopLoss(stagedOrder.stopLoss);
      if (stagedOrder.target) setTarget(stagedOrder.target);
    }
  }, [stagedOrder]);

  const lotSize = indices[indexKey]?.lotSize || 25;
  const totalQty = lots * lotSize;
  const slDifference = Math.max(0.5, Math.abs(entryPrice - stopLoss));
  const targetDifference = Math.max(0.5, Math.abs(target - entryPrice));

  const totalRiskAmount = +(slDifference * totalQty).toFixed(2);
  const totalPotentialReward = +(targetDifference * totalQty).toFixed(2);
  const calculatedRrRatio = +(targetDifference / slDifference).toFixed(2);

  const maxTradeBudget = (riskSettings.accountCapital * riskSettings.riskPerTradePct) / 100;
  const isRiskBudgetExceeded = totalRiskAmount > maxTradeBudget;
  const isCircuitSizingActive = dailyRiskState.isSizeReducedByCircuit;
  const isExecutionBlocked = riskSettings.isKillSwitchActive || dailyRiskState.isLockedOut;

  // Margin required estimate
  const marginRequired =
    action === 'BUY'
      ? Math.round(entryPrice * totalQty)
      : Math.round(entryPrice * totalQty + 125000 * lots);

  const handleExecute = () => {
    if (isExecutionBlocked) {
      playAlertWarning();
      return;
    }
    playSignalChime();
    const finalOrder: StagedOrder = {
      index: indexKey,
      instrument,
      action,
      lots,
      totalQty,
      entryPrice,
      stopLoss,
      target,
      riskAmount: totalRiskAmount,
      potentialReward: totalPotentialReward,
      rrRatio: calculatedRrRatio,
      marginRequired
    };
    onConfirmExecution(finalOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0f1420] border border-[#232c40] rounded-xl max-w-xl w-full p-5 shadow-2xl relative">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1b2333]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-white tracking-wide uppercase">
                Order Staging Ticket
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                AITOS Execution Engine · Pre-trade Risk Allocation Checked
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-3.5 my-4 text-xs font-mono">
          {/* Index & Action Switcher */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 uppercase mb-1 block">Underlying Index</label>
              <select
                value={indexKey}
                onChange={(e) => {
                  const newIdx = e.target.value as MarketIndexKey;
                  setIndexKey(newIdx);
                  setInstrument(`${newIdx} ${indices[newIdx].atmStrike} CE`);
                }}
                className="w-full bg-[#131a26] border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {(['NIFTY', 'BANKNIFTY', 'SENSEX', 'FINNIFTY', 'MIDCPNIFTY'] as const).map((k) => (
                  <option key={k} value={k}>
                    {k} (Spot: {indices[k].spotPrice.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase mb-1 block">Order Action</label>
              <div className="grid grid-cols-2 gap-1.5 bg-[#131a26] p-1 rounded border border-slate-700">
                <button
                  type="button"
                  onClick={() => setAction('BUY')}
                  className={`py-1 rounded font-bold transition-colors cursor-pointer ${
                    action === 'BUY'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => setAction('SELL')}
                  className={`py-1 rounded font-bold transition-colors cursor-pointer ${
                    action === 'SELL'
                      ? 'bg-rose-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  SELL
                </button>
              </div>
            </div>
          </div>

          {/* Instrument Tag */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase mb-1 block">Contract Instrument</label>
            <input
              type="text"
              value={instrument}
              onChange={(e) => setInstrument(e.target.value)}
              className="w-full bg-[#131a26] border border-slate-700 rounded px-2.5 py-1.5 text-amber-300 font-bold font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Lots & Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] text-slate-400 uppercase">Lots</label>
                <span className="text-[10px] text-slate-500">Lot size: {lotSize}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={lots}
                  onChange={(e) => setLots(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-[#131a26] border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase mb-1 block">Total Derivative Qty</label>
              <div className="bg-[#131a26] border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-bold">
                {totalQty} Units
              </div>
            </div>
          </div>

          {/* Entry, Stop Loss, Target */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 uppercase mb-1 block">Entry (₹)</label>
              <input
                type="number"
                step="0.05"
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value))}
                className="w-full bg-[#131a26] border border-slate-700 rounded px-2 py-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-rose-400 uppercase mb-1 block">Stop Loss (₹)</label>
              <input
                type="number"
                step="0.05"
                value={stopLoss}
                onChange={(e) => setStopLoss(Number(e.target.value))}
                className="w-full bg-[#131a26] border border-rose-900 rounded px-2 py-1.5 text-rose-300 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-emerald-400 uppercase mb-1 block">Target 1 (₹)</label>
              <input
                type="number"
                step="0.05"
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                className="w-full bg-[#131a26] border border-emerald-900 rounded px-2 py-1.5 text-emerald-300 font-mono"
              />
            </div>
          </div>

          {/* Risk Engine Compliance Summary Strip */}
          <div className="bg-[#0b0e15] border border-slate-800 rounded p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Total Trade Risk:</span>
              <span
                className={`font-bold tabular-nums ${
                  isRiskBudgetExceeded ? 'text-rose-400' : 'text-slate-200'
                }`}
              >
                ₹{totalRiskAmount.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Per-Trade Stop Budget:</span>
              <span className="text-slate-300 font-bold tabular-nums">
                ₹{maxTradeBudget.toLocaleString()} ({riskSettings.riskPerTradePct}%)
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Reward-to-Risk:</span>
              <span
                className={`font-bold ${
                  calculatedRrRatio >= 2.0 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                1:{calculatedRrRatio} (+₹{totalPotentialReward.toLocaleString()})
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-900">
              <span className="text-slate-400">Est. Margin / Outlay:</span>
              <span className="text-amber-300 font-bold tabular-nums">
                ₹{marginRequired.toLocaleString()}
              </span>
            </div>

            {/* Warnings if any */}
            {isRiskBudgetExceeded && (
              <div className="flex items-center gap-1.5 text-[10px] text-rose-400 bg-rose-950/40 border border-rose-800/60 p-1.5 rounded">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Risk exceeds per-trade stop budget (₹{maxTradeBudget.toLocaleString()}). Consider lowering lot count.</span>
              </div>
            )}

            {isCircuitSizingActive && (
              <div className="flex items-center gap-1.5 text-[10px] text-amber-300 bg-amber-950/40 border border-amber-800/60 p-1.5 rounded">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Circuit Breaker Active: 50% max position sizing enforced due to consecutive losses.</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1b2333]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded text-xs font-mono text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExecute}
            disabled={isExecutionBlocked}
            className={`px-5 py-2 rounded text-xs font-mono font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-sm ${
              isExecutionBlocked
                ? 'bg-rose-950 text-rose-300 border border-rose-800 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-400 text-black'
            }`}
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>{isExecutionBlocked ? 'TRADING BLOCKED BY CIRCUIT' : 'TRANSMIT STAGED ORDER'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
