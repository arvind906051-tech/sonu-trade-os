/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { MarketPulseBar } from './components/MarketPulseBar';
import { IndexOptionChains } from './components/IndexOptionChains';
import { EarlySignalPipeline } from './components/EarlySignalPipeline';
import { LiquidityBoard } from './components/LiquidityBoard';
import { RiskEnginePanel } from './components/RiskEnginePanel';
import { OrderStagingModal } from './components/OrderStagingModal';
import { DigiCoolsStore } from './components/DigiCoolsStore';
import { AuthModal } from './components/AuthModal';
import { AuthProvider } from './context/AuthContext';

import {
  MarketIndexKey,
  IndexSpotData,
  OptionChainRow,
  GlobalMarketAsset,
  FiiDiiFlow,
  EconomicEvent,
  SignalSetup,
  SectorItem,
  OiBuildupItem,
  DemandSupplyZone,
  RiskSettings,
  DailyRiskState,
  StagedOrder,
  PipelineStage
} from './types/tradeOs';

import {
  INITIAL_INDICES,
  INITIAL_GLOBAL_ASSETS,
  INITIAL_FII_DII,
  INITIAL_ECONOMIC_EVENTS,
  INITIAL_SETUPS,
  INITIAL_SECTORS,
  INITIAL_OI_BUILDUP,
  INITIAL_ZONES,
  INITIAL_RISK_SETTINGS,
  INITIAL_DAILY_RISK_STATE,
  generateOptionChain
} from './data/mockTradingData';

import { playTickSound, playSignalChime, playAlertWarning } from './utils/audio';
import { CheckCircle2, ShieldAlert, AlertCircle, X, Terminal } from 'lucide-react';

function TradeOSDashboard() {
  const [activeTab, setActiveTab] = useState<string>('command-center');
  const [isSimulatingTicks, setIsSimulatingTicks] = useState<boolean>(true);

  // Core State
  const [indices, setIndices] = useState<Record<MarketIndexKey, IndexSpotData>>(INITIAL_INDICES);
  const [selectedIndex, setSelectedIndex] = useState<MarketIndexKey>('NIFTY');
  const [globalAssets, setGlobalAssets] = useState<GlobalMarketAsset[]>(INITIAL_GLOBAL_ASSETS);
  const [vixValue, setVixValue] = useState<number>(13.42);
  const [vixChange, setVixChange] = useState<number>(0.38);
  const [fiiDii, setFiiDii] = useState<FiiDiiFlow>(INITIAL_FII_DII);
  const [economicEvents, setEconomicEvents] = useState<EconomicEvent[]>(INITIAL_ECONOMIC_EVENTS);
  const [setups, setSetups] = useState<SignalSetup[]>(INITIAL_SETUPS);
  const [sectors, setSectors] = useState<SectorItem[]>(INITIAL_SECTORS);
  const [oiBuildup, setOiBuildup] = useState<OiBuildupItem[]>(INITIAL_OI_BUILDUP);
  const [zones, setZones] = useState<DemandSupplyZone[]>(INITIAL_ZONES);

  // Risk Management State
  const [riskSettings, setRiskSettings] = useState<RiskSettings>(INITIAL_RISK_SETTINGS);
  const [dailyRiskState, setDailyRiskState] = useState<DailyRiskState>(INITIAL_DAILY_RISK_STATE);

  // Backend FastAPI WebSocket state
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  // Order Staging Modal State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [activeStagedOrder, setActiveStagedOrder] = useState<Partial<StagedOrder> | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<{ id: string; title: string; message: string; type: 'success' | 'alert' | 'warning' }[]>([]);

  const addToast = (title: string, message: string, type: 'success' | 'alert' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev.slice(-3), { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Option Chain for the selected index
  const [optionRows, setOptionRows] = useState<OptionChainRow[]>(() =>
    generateOptionChain('NIFTY', INITIAL_INDICES.NIFTY.spotPrice)
  );

  // Re-generate option chain when index changes
  useEffect(() => {
    setOptionRows(generateOptionChain(selectedIndex, indices[selectedIndex].spotPrice));
  }, [selectedIndex]);

  // Connect to Python FastAPI WebSocket backend if running
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      try {
        ws = new WebSocket('ws://localhost:8000/ws/stream');

        ws.onopen = () => {
          setIsBackendConnected(true);
          addToast('FastAPI Backend Connected', 'Receiving live ticks from Angel One backend gateway', 'success');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'tick') {
              // Update specific strike row in option chain
              setOptionRows((prevRows) => {
                return prevRows.map((row) => {
                  if (row.strike === data.strike) {
                    if (data.option_type === 'CE') {
                      return {
                        ...row,
                        callLTP: data.ltp,
                        callVolume: data.volume,
                        callOI: data.open_interest
                      };
                    } else if (data.option_type === 'PE') {
                      return {
                        ...row,
                        putLTP: data.ltp,
                        putVolume: data.volume,
                        putOI: data.open_interest
                      };
                    }
                  }
                  return row;
                });
              });
            } else if (data.type === 'matrix_update') {
              const currentMatrix = data[selectedIndex];
              if (currentMatrix) {
                setIndices((prev) => ({
                  ...prev,
                  [selectedIndex]: {
                    ...prev[selectedIndex],
                    pcr: currentMatrix.pcr,
                    maxPain: currentMatrix.max_pain,
                    spotPrice: currentMatrix.spot_price,
                    change: currentMatrix.spot_change,
                    changePercent: currentMatrix.spot_change_pct
                  }
                }));
              }
            }
          } catch {
            // Ignore parse error
          }
        };

        ws.onclose = () => {
          setIsBackendConnected(false);
          // Try to reconnect periodically
          reconnectTimeout = setTimeout(connectWs, 5000);
        };

        ws.onerror = () => {
          setIsBackendConnected(false);
          ws?.close();
        };
      } catch {
        setIsBackendConnected(false);
      }
    };

    connectWs();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [selectedIndex]);

  // Periodic simulated live ticks (runs if backend is not streaming or fallback enabled)
  useEffect(() => {
    if (!isSimulatingTicks || isBackendConnected) return;

    const interval = setInterval(() => {
      // Micro-tick spot price for the active index
      setIndices((prev) => {
        const current = prev[selectedIndex];
        const delta = (Math.random() - 0.48) * (selectedIndex === 'BANKNIFTY' ? 12 : 4);
        const newSpot = +(current.spotPrice + delta).toFixed(2);
        const newChange = +(current.change + delta).toFixed(2);
        const newChangePct = +((newChange / (current.open || 1)) * 100).toFixed(2);

        return {
          ...prev,
          [selectedIndex]: {
            ...current,
            spotPrice: newSpot,
            change: newChange,
            changePercent: newChangePct,
            high: Math.max(current.high, newSpot),
            low: Math.min(current.low, newSpot)
          }
        };
      });

      // Update Option Chain row LTPs subtly
      setOptionRows((prevRows) => {
        return prevRows.map((row) => {
          if (Math.abs(row.strike - indices[selectedIndex].atmStrike) <= 200) {
            const callDrift = (Math.random() - 0.49) * 0.8;
            const putDrift = -callDrift * 0.85;
            return {
              ...row,
              callLTP: Math.max(0.5, +(row.callLTP + callDrift).toFixed(2)),
              putLTP: Math.max(0.5, +(row.putLTP + putDrift).toFixed(2))
            };
          }
          return row;
        });
      });

      // VIX micro variation
      setVixValue((prev) => +(prev + (Math.random() - 0.5) * 0.04).toFixed(2));
    }, 2800);

    return () => clearInterval(interval);
  }, [isSimulatingTicks, selectedIndex, indices]);

  // Stage Advancement Handler
  const handleAdvanceStage = useCallback((setupId: string) => {
    const stageOrder: PipelineStage[] = ['WATCH', 'EARLY_WARNING', 'BUILDING', 'CONFIRMED', 'ENTRY_READY'];
    setSetups((prev) =>
      prev.map((s) => {
        if (s.id === setupId) {
          const currIdx = stageOrder.indexOf(s.stage);
          if (currIdx < stageOrder.length - 1) {
            const nextStage = stageOrder[currIdx + 1];
            addToast(
              'Signal Advanced',
              `${s.suggestedInstrument} moved to ${nextStage.replace('_', ' ')}`,
              nextStage === 'ENTRY_READY' ? 'alert' : 'success'
            );
            return { ...s, stage: nextStage };
          }
        }
        return s;
      })
    );
  }, []);

  const handleAddSignal = useCallback((newSetup: SignalSetup) => {
    setSetups((prev) => [newSetup, ...prev]);
    addToast('New Signal Detected', `${newSetup.suggestedInstrument} (${newSetup.index}) captured on radar`, 'warning');
  }, []);

  const handleStageStrikeOrSetup = useCallback((order: Partial<StagedOrder>) => {
    setActiveStagedOrder(order);
    setIsOrderModalOpen(true);
  }, []);

  // Risk Simulation Handlers
  const handleSimulateTradeResult = useCallback((isWin: boolean, amount: number = 7000) => {
    setDailyRiskState((prev) => {
      const pnlChange = isWin ? amount : -amount;
      const nextPnl = prev.currentDailyPnl + pnlChange;
      const nextWins = isWin ? prev.winsToday + 1 : prev.winsToday;
      const nextLosses = !isWin ? prev.lossesToday + 1 : prev.lossesToday;
      const nextConsecutive = isWin ? 0 : prev.consecutiveLosses + 1;
      const nextPeak = Math.max(prev.peakDailyPnl, nextPnl);
      const nextDrawdown = Math.max(0, nextPeak - nextPnl);

      const willBeReduced = nextConsecutive >= 2;
      const willBeLockedOut = nextConsecutive >= riskSettings.consecutiveLossHaltThreshold;

      if (willBeLockedOut) {
        addToast(
          'CIRCUIT BREAKER HALT TRIGGERED',
          `3 consecutive losses recorded. Trading execution is frozen to protect capital.`,
          'alert'
        );
      } else if (willBeReduced) {
        addToast(
          'Risk Safeguard Active',
          `2 consecutive losses: 50% max position sizing enforced.`,
          'warning'
        );
      } else if (isWin) {
        addToast('Trade Booked Win', `Realized +₹${amount.toLocaleString()} into daily P&L.`, 'success');
      }

      return {
        ...prev,
        currentDailyPnl: nextPnl,
        peakDailyPnl: nextPeak,
        tradesToday: prev.tradesToday + 1,
        winsToday: nextWins,
        lossesToday: nextLosses,
        consecutiveLosses: nextConsecutive,
        currentDrawdownFromPeak: nextDrawdown,
        isSizeReducedByCircuit: willBeReduced,
        isLockedOut: willBeLockedOut
      };
    });
  }, [riskSettings.consecutiveLossHaltThreshold]);

  const handleResetRiskState = useCallback(() => {
    playSignalChime();
    setDailyRiskState({
      currentDailyPnl: 0,
      peakDailyPnl: 0,
      tradesToday: 0,
      winsToday: 0,
      lossesToday: 0,
      consecutiveLosses: 0,
      currentDrawdownFromPeak: 0,
      isSizeReducedByCircuit: false,
      isLockedOut: false
    });
    setRiskSettings((prev) => ({ ...prev, isKillSwitchActive: false }));
    addToast('Risk State Reset', 'Daily counters and circuit breakers reset to nominal.', 'success');
  }, []);

  const handleToggleKillSwitch = useCallback(() => {
    setRiskSettings((prev) => {
      const next = !prev.isKillSwitchActive;
      if (next) {
        addToast(
          'EMERGENCY KILL SWITCH ACTIVATED',
          'All trading halted. Staged orders blocked until manually revoked.',
          'alert'
        );
      } else {
        addToast('Desk Lock Revoked', 'Trading operations re-enabled under active risk rules.', 'success');
      }
      return { ...prev, isKillSwitchActive: next };
    });
  }, []);

  const handleConfirmExecution = useCallback((order: StagedOrder) => {
    // Add to daily risk state as an active trade
    setDailyRiskState((prev) => ({
      ...prev,
      tradesToday: prev.tradesToday + 1
    }));
    addToast(
      'Order Transmitted & Filled',
      `${order.action} ${order.lots} Lots ${order.instrument} @ ₹${order.entryPrice.toFixed(2)}`,
      'success'
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#070a0f] text-[#e2e8f0] flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-200">
      {/* Universal Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSimulatingTicks={isSimulatingTicks}
        setIsSimulatingTicks={setIsSimulatingTicks}
        onOpenOrderModal={() => setIsOrderModalOpen(true)}
        isKillSwitchActive={riskSettings.isKillSwitchActive}
        isLockedOut={dailyRiskState.isLockedOut}
        isBackendConnected={isBackendConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-4 lg:p-6 space-y-6">
        {/* Desk Locked Out Banner if circuit tripped or Kill Switch on */}
        {(riskSettings.isKillSwitchActive || dailyRiskState.isLockedOut) && (
          <div className="bg-rose-950/80 border border-rose-700 p-3.5 rounded-lg text-rose-200 text-xs font-mono flex items-center justify-between shadow-lg animate-pulse">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <strong className="text-white text-sm">
                  {riskSettings.isKillSwitchActive ? 'EMERGENCY KILL SWITCH ENGAGED' : 'CONSECUTIVE LOSS CIRCUIT LOCKOUT ACTIVATED'}
                </strong>
                <p className="text-rose-300/90 text-[11px] mt-0.5">
                  Execution gateway is locked to prevent emotional drawdowns. Review your trading plan or reset counters in the Risk Engine.
                </p>
              </div>
            </div>
            <button
              onClick={handleResetRiskState}
              className="px-3 py-1.5 bg-rose-900 hover:bg-rose-800 text-white rounded font-bold transition-colors cursor-pointer text-xs"
            >
              Reset Circuit
            </button>
          </div>
        )}

        {/* View Mode Switching */}
        {activeTab === 'command-center' && (
          <>
            {/* Panel 1: Market Pulse Bar */}
            <MarketPulseBar
              globalAssets={globalAssets}
              vixValue={vixValue}
              vixChange={vixChange}
              fiiDii={fiiDii}
              economicEvents={economicEvents}
              onSelectEvent={(ev) =>
                addToast('Event Brief', `${ev.title}: ${ev.impact} impact scheduled for ${ev.timeIST}`, 'warning')
              }
            />

            {/* Panel 2: Index Option Chains */}
            <IndexOptionChains
              indices={indices}
              selectedIndex={selectedIndex}
              onSelectIndex={setSelectedIndex}
              optionRows={optionRows}
              onStageStrike={handleStageStrikeOrSetup}
            />

            {/* Panel 3: Early-Signal Pipeline */}
            <EarlySignalPipeline
              setups={setups}
              onAdvanceStage={handleAdvanceStage}
              onAddSignal={handleAddSignal}
              onStageSetup={handleStageStrikeOrSetup}
              indices={indices}
            />

            {/* Panel 4: Liquidity Board */}
            <LiquidityBoard
              sectors={sectors}
              oiBuildup={oiBuildup}
              zones={zones}
              selectedIndex={selectedIndex}
              onSelectIndex={setSelectedIndex}
              indices={indices}
            />

            {/* Panel 5: Risk Engine Panel */}
            <RiskEnginePanel
              settings={riskSettings}
              dailyState={dailyRiskState}
              onUpdateSettings={(newVals) => setRiskSettings((prev) => ({ ...prev, ...newVals }))}
              onSimulateTradeResult={handleSimulateTradeResult}
              onResetRiskState={handleResetRiskState}
              onToggleKillSwitch={handleToggleKillSwitch}
              indices={indices}
              selectedIndex={selectedIndex}
            />
          </>
        )}

        {/* Standalone Views for deep focus */}
        {activeTab === 'option-chains' && (
          <IndexOptionChains
            indices={indices}
            selectedIndex={selectedIndex}
            onSelectIndex={setSelectedIndex}
            optionRows={optionRows}
            onStageStrike={handleStageStrikeOrSetup}
          />
        )}

        {activeTab === 'signal-pipeline' && (
          <EarlySignalPipeline
            setups={setups}
            onAdvanceStage={handleAdvanceStage}
            onAddSignal={handleAddSignal}
            onStageSetup={handleStageStrikeOrSetup}
            indices={indices}
          />
        )}

        {activeTab === 'liquidity-board' && (
          <LiquidityBoard
            sectors={sectors}
            oiBuildup={oiBuildup}
            zones={zones}
            selectedIndex={selectedIndex}
            onSelectIndex={setSelectedIndex}
            indices={indices}
          />
        )}

        {activeTab === 'risk-engine' && (
          <RiskEnginePanel
            settings={riskSettings}
            dailyState={dailyRiskState}
            onUpdateSettings={(newVals) => setRiskSettings((prev) => ({ ...prev, ...newVals }))}
            onSimulateTradeResult={handleSimulateTradeResult}
            onResetRiskState={handleResetRiskState}
            onToggleKillSwitch={handleToggleKillSwitch}
            indices={indices}
            selectedIndex={selectedIndex}
          />
        )}

        {/* DigiCools Store & Subscriptions Panel */}
        {activeTab === 'digicools-store' && (
          <DigiCoolsStore onNotify={addToast} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#192235] bg-[#090d14] py-3 px-6 text-xs font-mono text-slate-500">
        <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-400 font-medium">sonu (Ghochu) Trade OS v3.4</span>
            <span>·</span>
            <span>NSE / BSE Derivatives Command Center</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Capital: ₹{riskSettings.accountCapital.toLocaleString()}</span>
            <span>·</span>
            <span>Max Risk: {riskSettings.riskPerTradePct}% (₹{((riskSettings.accountCapital * riskSettings.riskPerTradePct) / 100).toLocaleString()})</span>
            <span>·</span>
            <span>Latency: 14ms (Direct Gateway)</span>
          </div>
        </div>
      </footer>

      {/* Order Staging Ticket Modal */}
      <OrderStagingModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        stagedOrder={activeStagedOrder}
        indices={indices}
        riskSettings={riskSettings}
        dailyRiskState={dailyRiskState}
        onConfirmExecution={handleConfirmExecution}
      />

      {/* Supabase Authentication Modal */}
      <AuthModal />

      {/* Tactical Toast Stack */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-3 rounded-lg border shadow-xl backdrop-blur-md pointer-events-auto flex items-start gap-2.5 text-xs font-mono transition-all ${
              t.type === 'alert'
                ? 'bg-rose-950/90 border-rose-700 text-rose-200'
                : t.type === 'warning'
                ? 'bg-amber-950/90 border-amber-700 text-amber-200'
                : 'bg-[#0f172a]/95 border-emerald-700 text-emerald-200'
            }`}
          >
            {t.type === 'alert' ? (
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            ) : t.type === 'warning' ? (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <strong className="block text-white font-bold">{t.title}</strong>
              <p className="text-[11px] opacity-90 mt-0.5 leading-snug">{t.message}</p>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TradeOSDashboard />
    </AuthProvider>
  );
}
