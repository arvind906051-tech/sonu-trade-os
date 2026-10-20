import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Unlock,
  Sliders,
  DollarSign,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Power,
  Calculator
} from 'lucide-react';
import {
  RiskSettings,
  DailyRiskState,
  MarketIndexKey,
  IndexSpotData
} from '../types/tradeOs';
import { playAlertWarning, playSignalChime, playTickSound } from '../utils/audio';

interface RiskEnginePanelProps {
  settings: RiskSettings;
  dailyState: DailyRiskState;
  onUpdateSettings: (newSettings: Partial<RiskSettings>) => void;
  onSimulateTradeResult: (isWin: boolean, amount?: number) => void;
  onResetRiskState: () => void;
  onToggleKillSwitch: () => void;
  indices: Record<MarketIndexKey, IndexSpotData>;
  selectedIndex: MarketIndexKey;
}

export const RiskEnginePanel: React.FC<RiskEnginePanelProps> = ({
  settings,
  dailyState,
  onUpdateSettings,
  onSimulateTradeResult,
  onResetRiskState,
  onToggleKillSwitch,
  indices,
  selectedIndex
}) => {
  const currentSpot = indices[selectedIndex];

  // Quick calculator state
  const [calcStopPts, setCalcStopPts] = useState<number>(30);
  const [calcIndex, setCalcIndex] = useState<MarketIndexKey>(selectedIndex);

  const maxStopBudgetRupees = (settings.accountCapital * settings.riskPerTradePct) / 100;
  const maxDailyLossRupees = (settings.accountCapital * settings.maxDailyLossPct) / 100;

  // Auto lot size calculation: maxBudget / (stopPts * lotSize)
  const calcLotSize = indices[calcIndex].lotSize;
  const calculatedMaxLots = Math.max(
    1,
    Math.floor(maxStopBudgetRupees / (calcStopPts * calcLotSize || 1))
  );
  // Apply circuit reduction if 2 consecutive losses
  const effectiveAllowedLots = dailyState.isSizeReducedByCircuit
    ? Math.max(1, Math.floor(calculatedMaxLots * 0.5))
    : calculatedMaxLots;

  const currentLossCapacity = maxDailyLossRupees + dailyState.currentDailyPnl;
  const dailyLossPctUsed = Math.min(
    100,
    dailyState.currentDailyPnl < 0
      ? (Math.abs(dailyState.currentDailyPnl) / maxDailyLossRupees) * 100
      : 0
  );

  const handleSimulateWin = () => {
    playSignalChime();
    onSimulateTradeResult(true, 7500);
  };

  const handleSimulateLoss = () => {
    playAlertWarning();
    onSimulateTradeResult(false, 6000);
  };

  const handleEmergencyKillSwitch = () => {
    playAlertWarning();
    onToggleKillSwitch();
  };

  return (
    <div className="bg-[#0f141f] border border-[#1e2638] rounded-lg p-4 shadow-sm mb-6">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1b2234]">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
            Risk Engine Panel
          </h2>
          <span className="hidden sm:inline text-xs text-slate-500 font-mono">
            Stop Budget · Daily Loss Limits · Consecutive Loss Circuit Breaker
          </span>
        </div>

        {/* Circuit status & Kill Switch status */}
        <div className="flex items-center gap-2">
          <div
            className={`px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 ${
              settings.isKillSwitchActive || dailyState.isLockedOut
                ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                : dailyState.isSizeReducedByCircuit
                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
            }`}
          >
            {settings.isKillSwitchActive || dailyState.isLockedOut ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>DESK LOCKED</span>
              </>
            ) : dailyState.isSizeReducedByCircuit ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>50% SIZING RESTRICTION</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ACTIVE RISK CLEAR</span>
              </>
            )}
          </div>

          <button
            onClick={handleEmergencyKillSwitch}
            className={`px-3 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              settings.isKillSwitchActive
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
            }`}
          >
            <Power className="w-3 h-3" />
            <span>{settings.isKillSwitchActive ? 'REVOKE HALT' : 'KILL SWITCH'}</span>
          </button>
        </div>
      </div>

      {/* 3 Main Engine Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        {/* Module 1: Per-Trade Stop Budget */}
        <div className="bg-[#0b0e15] border border-[#182030] rounded p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#161d2c] text-xs font-mono">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                Per-Trade Stop Budget
              </span>
              <span className="text-[10px] text-amber-400 font-bold">
                Max ₹{maxStopBudgetRupees.toLocaleString()}
              </span>
            </div>

            {/* Capital & Risk controls */}
            <div className="space-y-2 text-xs font-mono">
              <div>
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span>Trading Capital:</span>
                  <span className="text-white font-bold tabular-nums">
                    ₹{settings.accountCapital.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min={200000}
                  max={5000000}
                  step={100000}
                  value={settings.accountCapital}
                  onChange={(e) => onUpdateSettings({ accountCapital: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span>Risk Per Trade:</span>
                  <span className="text-amber-400 font-bold tabular-nums">
                    {settings.riskPerTradePct}% (₹{maxStopBudgetRupees.toLocaleString()})
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[0.5, 1.0, 1.5, 2.0].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => onUpdateSettings({ riskPerTradePct: pct })}
                      className={`py-1 text-[11px] rounded cursor-pointer ${
                        settings.riskPerTradePct === pct
                          ? 'bg-amber-500 text-black font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Sizing Calculator Box */}
              <div className="mt-3 bg-[#0e131d] border border-slate-800 p-2.5 rounded">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                  <span className="flex items-center gap-1 font-semibold text-slate-300">
                    <Calculator className="w-3 h-3 text-sky-400" />
                    Auto Lot Sizer
                  </span>
                  <span className="text-[10px] text-slate-500">Lot: {calcLotSize} qty</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">SL Points</label>
                    <input
                      type="number"
                      value={calcStopPts}
                      onChange={(e) => setCalcStopPts(Math.max(5, Number(e.target.value)))}
                      className="w-full bg-[#141b27] border border-slate-700 rounded px-2 py-0.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Index</label>
                    <select
                      value={calcIndex}
                      onChange={(e) => setCalcIndex(e.target.value as MarketIndexKey)}
                      aria-label="Select target index for risk sizing"
                      className="w-full bg-[#141b27] border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 font-mono text-[11px]"
                    >
                      {(['NIFTY', 'BANKNIFTY', 'SENSEX', 'FINNIFTY', 'MIDCPNIFTY'] as const).map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Allowed Position:</span>
                  <div className="text-right">
                    <span className="font-bold text-emerald-400 text-sm tabular-nums">
                      {effectiveAllowedLots} Lots
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1">
                      ({effectiveAllowedLots * calcLotSize} Qty)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 text-[10px] text-slate-500 font-mono">
            {dailyState.isSizeReducedByCircuit && (
              <span className="text-amber-400 font-semibold">
                * Reduced 50% due to consecutive loss safeguard
              </span>
            )}
          </div>
        </div>

        {/* Module 2: Daily Loss Limits & P&L Drawdown */}
        <div className="bg-[#0b0e15] border border-[#182030] rounded p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#161d2c] text-xs font-mono">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                Daily Loss Limits
              </span>
              <span className="text-[10px] text-slate-400">
                Limit: ₹{maxDailyLossRupees.toLocaleString()} ({settings.maxDailyLossPct}%)
              </span>
            </div>

            {/* Daily PnL Big Display */}
            <div className="bg-[#0e131d] border border-slate-800 p-2.5 rounded my-1">
              <div className="text-[10px] font-mono text-slate-500 uppercase">
                Current Realized P&L
              </div>
              <div className="flex items-baseline justify-between mt-0.5">
                <span
                  className={`text-xl font-bold font-mono tabular-nums ${
                    dailyState.currentDailyPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {dailyState.currentDailyPnl >= 0 ? '+' : ''}₹{dailyState.currentDailyPnl.toLocaleString()}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Peak: +₹{dailyState.peakDailyPnl.toLocaleString()}
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-1 flex justify-between">
                <span>Drawdown from Peak: ₹{dailyState.currentDrawdownFromPeak.toLocaleString()}</span>
                <span>Trades: {dailyState.tradesToday} ({dailyState.winsToday}W / {dailyState.lossesToday}L)</span>
              </div>
            </div>

            {/* Daily Drawdown Gauge */}
            <div className="my-3">
              <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                <span>Loss Budget Consumption</span>
                <span className="text-rose-400 font-bold">{dailyLossPctUsed.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    dailyLossPctUsed > 75 ? 'bg-rose-500 animate-pulse' : dailyLossPctUsed > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${dailyLossPctUsed}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>Safe Threshold (70%)</span>
                <span>Lockout at -₹{maxDailyLossRupees.toLocaleString()}</span>
              </div>
            </div>

            {/* Daily loss slider */}
            <div className="text-xs font-mono">
              <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                <span>Adjust Daily Drawdown Cap:</span>
                <span className="text-slate-300 font-bold">{settings.maxDailyLossPct}%</span>
              </div>
              <input
                type="range"
                min={1.0}
                max={5.0}
                step={0.5}
                value={settings.maxDailyLossPct}
                onChange={(e) => onUpdateSettings({ maxDailyLossPct: Number(e.target.value) })}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-900 flex justify-between">
            <span>Remaining Loss Runway:</span>
            <span className="text-emerald-400 font-bold tabular-nums">
              ₹{Math.max(0, currentLossCapacity).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Module 3: Consecutive Loss Halt Indicators & Circuit Breaker */}
        <div className="bg-[#0b0e15] border border-[#182030] rounded p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#161d2c] text-xs font-mono">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Consecutive Loss Circuit
              </span>
              <span className="text-[10px] text-slate-400">
                Threshold: {settings.consecutiveLossHaltThreshold} Losses
              </span>
            </div>

            {/* 3-Stage Circuit Visualizer */}
            <div className="space-y-2 my-2">
              {/* State 1 */}
              <div
                className={`p-2 rounded border text-xs font-mono flex items-center justify-between ${
                  dailyState.consecutiveLosses === 0
                    ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div>
                  <div className="font-bold">0-1 Consecutive Loss: Normal Operation</div>
                  <div className="text-[10px] text-slate-500">100% position size allowable</div>
                </div>
                {dailyState.consecutiveLosses <= 1 && !dailyState.isLockedOut && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                    ACTIVE
                  </span>
                )}
              </div>

              {/* State 2 */}
              <div
                className={`p-2 rounded border text-xs font-mono flex items-center justify-between ${
                  dailyState.consecutiveLosses === 2 && !dailyState.isLockedOut
                    ? 'bg-amber-950/40 border-amber-600 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div>
                  <div className="font-bold">2 Consecutive Losses: Soft Brake</div>
                  <div className="text-[10px] text-slate-500">Forces 50% max lot reduction</div>
                </div>
                {dailyState.consecutiveLosses === 2 && !dailyState.isLockedOut && (
                  <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-bold">
                    TRIGGERED
                  </span>
                )}
              </div>

              {/* State 3 */}
              <div
                className={`p-2 rounded border text-xs font-mono flex items-center justify-between ${
                  dailyState.consecutiveLosses >= 3 || dailyState.isLockedOut
                    ? 'bg-rose-950/60 border-rose-600 text-rose-300 animate-pulse'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div>
                  <div className="font-bold">3 Consecutive Losses: HARD LOCKOUT</div>
                  <div className="text-[10px] text-slate-500">Desk locked, execution frozen</div>
                </div>
                {(dailyState.consecutiveLosses >= 3 || dailyState.isLockedOut) && (
                  <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-bold">
                    LOCKED OUT
                  </span>
                )}
              </div>
            </div>

            {/* Test Simulation Buttons */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <div className="text-[10px] font-mono text-slate-400">Desk Simulator (Test Rules):</div>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                <button
                  onClick={handleSimulateWin}
                  className="py-1 px-2 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 rounded cursor-pointer transition-colors"
                >
                  + Simulate Win
                </button>
                <button
                  onClick={handleSimulateLoss}
                  className="py-1 px-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 rounded cursor-pointer transition-colors"
                >
                  - Simulate Loss
                </button>
              </div>

              <button
                onClick={onResetRiskState}
                className="w-full py-1 text-[11px] font-mono text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Daily Counters</span>
              </button>
            </div>
          </div>

          <div className="mt-2 text-[10px] font-mono text-slate-500 flex justify-between">
            <span>Consecutive Loss Streak: {dailyState.consecutiveLosses}</span>
            <span className={dailyState.consecutiveLosses >= 2 ? 'text-amber-400' : 'text-slate-400'}>
              {dailyState.consecutiveLosses >= 3 ? 'Trading Frozen' : dailyState.consecutiveLosses === 2 ? 'Half Size' : 'Normal Sizing'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
