export type MarketIndexKey = 'NIFTY' | 'BANKNIFTY' | 'SENSEX' | 'FINNIFTY' | 'MIDCPNIFTY';

export interface IndexSpotData {
  key: MarketIndexKey;
  name: string;
  spotPrice: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  lotSize: number;
  tickSize: number;
  pcr: number;
  maxPain: number;
  atmStrike: number;
  expiryDates: string[];
}

export interface OptionChainRow {
  strike: number;
  callOI: number;
  callOIChange: number;
  callVolume: number;
  callIV: number;
  callDelta: number;
  callLTP: number;
  callChange: number;
  putLTP: number;
  putChange: number;
  putIV: number;
  putDelta: number;
  putVolume: number;
  putOIChange: number;
  putOI: number;
}

export interface GlobalMarketAsset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  region: 'US' | 'ASIA' | 'EUROPE' | 'COMMODITY' | 'CURRENCY';
}

export interface FiiDiiFlow {
  fiiCashNetCr: number;
  diiCashNetCr: number;
  fiiIndexFuturesLongPct: number;
  fiiIndexFuturesShortPct: number;
  diiIndexFuturesLongPct: number;
  institutionalBias: 'Bullish' | 'Mildly Bullish' | 'Neutral' | 'Mildly Bearish' | 'Bearish';
  updatedAt: string;
}

export interface EconomicEvent {
  id: string;
  timeIST: string;
  country: string;
  title: string;
  impact: 'High' | 'Medium' | 'Low';
  actual?: string;
  forecast?: string;
  previous: string;
  status: 'Upcoming' | 'Live' | 'Released';
  countdownMinutes?: number;
}

export type PipelineStage = 'WATCH' | 'EARLY_WARNING' | 'BUILDING' | 'CONFIRMED' | 'ENTRY_READY';

export interface SignalSetup {
  id: string;
  index: MarketIndexKey;
  direction: 'LONG' | 'SHORT' | 'VOL_EXPANSION' | 'RANGE_FADE';
  stage: PipelineStage;
  title: string;
  suggestedInstrument: string; // e.g. "NIFTY 24900 CE"
  confluences: string[];
  spotTrigger: number;
  entryPrice: number;
  stopLoss: number;
  target1: number;
  target2: number;
  riskReward: string;
  confidenceScore: number;
  detectedAt: string;
  estimatedMovePts: number;
}

export interface SectorItem {
  id: string;
  name: string;
  symbol: string;
  changePercent: number;
  weightInNifty: number; // e.g., 34.2%
  advanceCount: number;
  declineCount: number;
  topStock: string;
  topStockChange: number;
}

export interface OiBuildupItem {
  symbol: string;
  index: MarketIndexKey;
  category: 'Long Build-up' | 'Short Build-up' | 'Long Unwinding' | 'Short Covering';
  priceChangePercent: number;
  oiChangePercent: number;
  totalOiLakhs: number;
  implication: string;
}

export interface DemandSupplyZone {
  id: string;
  index: MarketIndexKey;
  levelType: 'Major Supply (R2)' | 'Minor Supply (R1)' | 'POC / Value High' | 'Minor Demand (S1)' | 'Major Demand (S2)' | 'Virgin CPR';
  priceRange: [number, number];
  touchCount: number;
  strength: 'High' | 'Medium' | 'Critical';
  distancePts: number;
}

export interface RiskSettings {
  accountCapital: number;
  riskPerTradePct: number; // e.g., 1.0%
  maxDailyLossPct: number; // e.g., 2.5%
  consecutiveLossHaltThreshold: number; // default 3
  isKillSwitchActive: boolean;
  lockoutUntil: string | null;
}

export interface DailyRiskState {
  currentDailyPnl: number;
  peakDailyPnl: number;
  tradesToday: number;
  winsToday: number;
  lossesToday: number;
  consecutiveLosses: number;
  currentDrawdownFromPeak: number;
  isSizeReducedByCircuit: boolean;
  isLockedOut: boolean;
}

export interface StagedOrder {
  setupId?: string;
  index: MarketIndexKey;
  instrument: string;
  action: 'BUY' | 'SELL';
  lots: number;
  totalQty: number;
  entryPrice: number;
  stopLoss: number;
  target: number;
  riskAmount: number;
  potentialReward: number;
  rrRatio: number;
  marginRequired: number;
}
