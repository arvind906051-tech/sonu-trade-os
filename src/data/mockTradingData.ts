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
  DailyRiskState
} from '../types/tradeOs';

export const INITIAL_INDICES: Record<MarketIndexKey, IndexSpotData> = {
  NIFTY: {
    key: 'NIFTY',
    name: 'NIFTY 50',
    spotPrice: 24862.30,
    change: 128.50,
    changePercent: 0.52,
    high: 24895.10,
    low: 24710.20,
    open: 24745.00,
    lotSize: 25,
    tickSize: 0.05,
    pcr: 1.18,
    maxPain: 24800,
    atmStrike: 24850,
    expiryDates: ['24 OCT 2026 (W)', '31 OCT 2026 (M)', '07 NOV 2026 (W)', '28 NOV 2026 (M)']
  },
  BANKNIFTY: {
    key: 'BANKNIFTY',
    name: 'NIFTY BANK',
    spotPrice: 52445.60,
    change: 325.40,
    changePercent: 0.62,
    high: 52580.00,
    low: 52020.10,
    open: 52150.00,
    lotSize: 15,
    tickSize: 0.05,
    pcr: 0.94,
    maxPain: 52300,
    atmStrike: 52400,
    expiryDates: ['23 OCT 2026 (W)', '30 OCT 2026 (M)', '06 NOV 2026 (W)', '27 NOV 2026 (M)']
  },
  SENSEX: {
    key: 'SENSEX',
    name: 'BSE SENSEX',
    spotPrice: 81680.20,
    change: 442.10,
    changePercent: 0.54,
    high: 81790.00,
    low: 81180.50,
    open: 81290.00,
    lotSize: 10,
    tickSize: 0.05,
    pcr: 1.05,
    maxPain: 81500,
    atmStrike: 81700,
    expiryDates: ['25 OCT 2026 (W)', '01 NOV 2026 (W)', '29 NOV 2026 (M)']
  },
  FINNIFTY: {
    key: 'FINNIFTY',
    name: 'NIFTY FIN SERVICE',
    spotPrice: 23924.80,
    change: 88.60,
    changePercent: 0.37,
    high: 23970.00,
    low: 23810.00,
    open: 23840.00,
    lotSize: 40,
    tickSize: 0.05,
    pcr: 1.12,
    maxPain: 23900,
    atmStrike: 23900,
    expiryDates: ['22 OCT 2026 (W)', '29 OCT 2026 (M)', '05 NOV 2026 (W)']
  },
  MIDCPNIFTY: {
    key: 'MIDCPNIFTY',
    name: 'NIFTY MIDCAP SELECT',
    spotPrice: 13128.40,
    change: 64.20,
    changePercent: 0.49,
    high: 13160.00,
    low: 13045.00,
    open: 13070.00,
    lotSize: 75,
    tickSize: 0.05,
    pcr: 1.26,
    maxPain: 13100,
    atmStrike: 13125,
    expiryDates: ['21 OCT 2026 (W)', '28 OCT 2026 (M)', '04 NOV 2026 (W)']
  }
};

export const INITIAL_GLOBAL_ASSETS: GlobalMarketAsset[] = [
  { symbol: 'GIFT NIFTY', name: 'GIFT Nifty 50 Futures', price: 24920.0, change: 145.0, changePercent: 0.59, region: 'ASIA' },
  { symbol: 'DOW JONES', name: 'DJIA Futures', price: 43239.0, change: 112.5, changePercent: 0.26, region: 'US' },
  { symbol: 'S&P 500', name: 'S&P 500 Mini', price: 5864.25, change: 18.25, changePercent: 0.31, region: 'US' },
  { symbol: 'NASDAQ', name: 'Nasdaq 100 Mini', price: 20385.5, change: 92.0, changePercent: 0.45, region: 'US' },
  { symbol: 'NIKKEI 225', name: 'Japan Nikkei 225', price: 38981.7, change: -120.4, changePercent: -0.31, region: 'ASIA' },
  { symbol: 'DAX', name: 'German DAX Index', price: 19655.2, change: 44.8, changePercent: 0.23, region: 'EUROPE' },
  { symbol: 'BRENT CRUDE', name: 'Crude Oil (bbl)', price: 74.32, change: -0.84, changePercent: -1.12, region: 'COMMODITY' },
  { symbol: 'US 10Y', name: 'US 10Y Treasury Yield', price: 4.085, change: -0.015, changePercent: -0.37, region: 'US' },
  { symbol: 'USD/INR', name: 'US Dollar / Indian Rupee', price: 84.06, change: -0.04, changePercent: -0.05, region: 'CURRENCY' }
];

export const INITIAL_FII_DII: FiiDiiFlow = {
  fiiCashNetCr: -1284.5,
  diiCashNetCr: 2410.8,
  fiiIndexFuturesLongPct: 37.8,
  fiiIndexFuturesShortPct: 62.2,
  diiIndexFuturesLongPct: 68.4,
  institutionalBias: 'Mildly Bullish',
  updatedAt: '15:30 IST (Provisional EOD)'
};

export const INITIAL_ECONOMIC_EVENTS: EconomicEvent[] = [
  {
    id: 'ev-1',
    timeIST: '11:00 IST',
    country: 'IN',
    title: 'India Manufacturing PMI Flash',
    impact: 'Medium',
    actual: '58.4',
    forecast: '57.8',
    previous: '57.5',
    status: 'Released'
  },
  {
    id: 'ev-2',
    timeIST: '14:30 IST',
    country: 'IN',
    title: 'RBI MPC Bi-Monthly Policy Meeting Minutes',
    impact: 'High',
    forecast: 'Neutral Stance',
    previous: 'Repo at 6.50%',
    status: 'Live',
    countdownMinutes: 12
  },
  {
    id: 'ev-3',
    timeIST: '18:00 IST',
    country: 'US',
    title: 'US Core CPI Index (MoM)',
    impact: 'High',
    forecast: '0.2%',
    previous: '0.3%',
    status: 'Upcoming',
    countdownMinutes: 220
  },
  {
    id: 'ev-4',
    timeIST: '19:30 IST',
    country: 'US',
    title: 'Initial Jobless Claims (Weekly)',
    impact: 'Medium',
    forecast: '218K',
    previous: '221K',
    status: 'Upcoming',
    countdownMinutes: 310
  },
  {
    id: 'ev-5',
    timeIST: '15:30 IST',
    country: 'IN',
    title: 'Weekly Derivatives Settlement Expiry',
    impact: 'High',
    previous: 'Max Pain 24,800',
    status: 'Live',
    countdownMinutes: 72
  }
];

export function generateOptionChain(index: MarketIndexKey, spot: number): OptionChainRow[] {
  const step = index === 'NIFTY' ? 50 : index === 'BANKNIFTY' ? 100 : index === 'SENSEX' ? 100 : index === 'FINNIFTY' ? 50 : 25;
  const atm = Math.round(spot / step) * step;
  const rows: OptionChainRow[] = [];
  const strikeRange = 6; // 6 strikes above and below ATM = 13 strikes

  for (let i = -strikeRange; i <= strikeRange; i++) {
    const strike = atm + i * step;
    const diff = spot - strike;
    const isCallITM = diff > 0;
    const isPutITM = diff < 0;

    // Call pricing model estimate
    const callIntrinsic = Math.max(0, diff);
    const callExtrinsic = Math.max(12, (180 - Math.abs(diff) * 0.18) * (1 + (index === 'BANKNIFTY' ? 1.2 : 0)));
    const callLTP = +(callIntrinsic + callExtrinsic).toFixed(2);
    const callDelta = +(isCallITM ? Math.min(0.95, 0.5 + Math.abs(diff) * 0.0012) : Math.max(0.05, 0.5 - Math.abs(diff) * 0.0012)).toFixed(2);
    const callIV = +(12.4 + (i > 0 ? i * 0.28 : Math.abs(i) * 0.15)).toFixed(1);
    const callOI = Math.round((75000 + Math.abs(i * 9200) + (i === 1 ? 48000 : 0)) * (index === 'NIFTY' ? 1 : 0.6));
    const callOIChange = Math.round((i >= 0 ? 12000 - i * 1800 : -4500 - i * 800));
    const callVolume = Math.round(callOI * 1.85);

    // Put pricing model estimate
    const putIntrinsic = Math.max(0, -diff);
    const putExtrinsic = Math.max(12, (180 - Math.abs(diff) * 0.18) * (1 + (index === 'BANKNIFTY' ? 1.2 : 0)));
    const putLTP = +(putIntrinsic + putExtrinsic).toFixed(2);
    const putDelta = +(isPutITM ? -Math.min(0.95, 0.5 + Math.abs(diff) * 0.0012) : -Math.max(0.05, 0.5 - Math.abs(diff) * 0.0012)).toFixed(2);
    const putIV = +(12.9 + (i < 0 ? Math.abs(i) * 0.32 : i * 0.12)).toFixed(1);
    const putOI = Math.round((82000 + Math.abs(i * 10500) + (i === -1 ? 52000 : 0)) * (index === 'NIFTY' ? 1 : 0.6));
    const putOIChange = Math.round((i <= 0 ? 15400 - Math.abs(i) * 1400 : -2200 + i * 500));
    const putVolume = Math.round(putOI * 1.72);

    rows.push({
      strike,
      callOI,
      callOIChange,
      callVolume,
      callIV,
      callDelta,
      callLTP,
      callChange: +(callLTP * 0.12 * (diff >= 0 ? 1 : -0.8)).toFixed(2),
      putLTP,
      putChange: +(putLTP * 0.12 * (diff <= 0 ? 1 : -0.8)).toFixed(2),
      putIV,
      putDelta,
      putVolume,
      putOIChange,
      putOI
    });
  }

  return rows;
}

export const INITIAL_SETUPS: SignalSetup[] = [
  {
    id: 'sig-1',
    index: 'NIFTY',
    direction: 'LONG',
    stage: 'ENTRY_READY',
    title: 'Gamma Expansion Breakout',
    suggestedInstrument: 'NIFTY 24900 CE',
    confluences: ['Spot holding above VWAP (24,820)', '24,800 PE OI surge +1.2M (Heavy Writing)', 'DII cash inflow acceleration', 'USD/INR softening'],
    spotTrigger: 24870.0,
    entryPrice: 142.50,
    stopLoss: 114.00,
    target1: 185.00,
    target2: 228.00,
    riskReward: '1:3.0',
    confidenceScore: 92,
    detectedAt: '11:42 IST',
    estimatedMovePts: 85
  },
  {
    id: 'sig-2',
    index: 'BANKNIFTY',
    direction: 'SHORT',
    stage: 'CONFIRMED',
    title: 'HDFC Resistance Rejection',
    suggestedInstrument: 'BANKNIFTY 52400 PE',
    confluences: ['Major supply rejection at 52,550', '52,500 CE Call writing build-up', 'PSU bank index cooling off from intraday high'],
    spotTrigger: 52410.0,
    entryPrice: 285.00,
    stopLoss: 330.00,
    target1: 220.00,
    target2: 170.00,
    riskReward: '1:2.6',
    confidenceScore: 84,
    detectedAt: '12:05 IST',
    estimatedMovePts: 160
  },
  {
    id: 'sig-3',
    index: 'FINNIFTY',
    direction: 'LONG',
    stage: 'BUILDING',
    title: 'Expiry Strike Pin Squeeze',
    suggestedInstrument: 'FINNIFTY 23950 CE',
    confluences: ['Short covering triggered in 23,900 CE', 'NBFC heavyweights Bajaj Finserv & Chola green', 'PCR rising from 0.98 to 1.12'],
    spotTrigger: 23935.0,
    entryPrice: 78.00,
    stopLoss: 58.00,
    target1: 115.00,
    target2: 140.00,
    riskReward: '1:2.8',
    confidenceScore: 78,
    detectedAt: '12:18 IST',
    estimatedMovePts: 45
  },
  {
    id: 'sig-4',
    index: 'MIDCPNIFTY',
    direction: 'VOL_EXPANSION',
    stage: 'EARLY_WARNING',
    title: 'Volume Compression Squeeze',
    suggestedInstrument: 'MIDCPNIFTY 13150 CE',
    confluences: ['Bollinger Band squeeze on 15m chart', 'Midcap breadth 42 Advances / 8 Declines', 'OI concentration at 13,100 Straddle'],
    spotTrigger: 13145.0,
    entryPrice: 62.00,
    stopLoss: 48.00,
    target1: 88.00,
    target2: 110.00,
    riskReward: '1:2.5',
    confidenceScore: 71,
    detectedAt: '12:22 IST',
    estimatedMovePts: 32
  },
  {
    id: 'sig-5',
    index: 'SENSEX',
    direction: 'RANGE_FADE',
    stage: 'WATCH',
    title: 'Mean Reversion at POC Level',
    suggestedInstrument: 'SENSEX 81700 Strangle',
    confluences: ['Testing Point of Control (81,650)', 'India VIX flat at 13.4', 'Theta decay curve steepening for Friday expiry'],
    spotTrigger: 81700.0,
    entryPrice: 480.00,
    stopLoss: 540.00,
    target1: 390.00,
    target2: 320.00,
    riskReward: '1:2.7',
    confidenceScore: 66,
    detectedAt: '12:30 IST',
    estimatedMovePts: 120
  }
];

export const INITIAL_SECTORS: SectorItem[] = [
  { id: 'sec-1', name: 'NIFTY BANK', symbol: 'BANK', changePercent: 0.62, weightInNifty: 33.8, advanceCount: 9, declineCount: 3, topStock: 'HDFCBANK', topStockChange: 0.95 },
  { id: 'sec-2', name: 'NIFTY IT', symbol: 'IT', changePercent: 1.34, weightInNifty: 13.9, advanceCount: 8, declineCount: 2, topStock: 'INFY', topStockChange: 1.82 },
  { id: 'sec-3', name: 'NIFTY AUTO', symbol: 'AUTO', changePercent: 0.48, weightInNifty: 7.2, advanceCount: 11, declineCount: 4, topStock: 'TATAMOTORS', topStockChange: 1.15 },
  { id: 'sec-4', name: 'NIFTY METAL', symbol: 'METAL', changePercent: -0.38, weightInNifty: 4.1, advanceCount: 4, declineCount: 11, topStock: 'TATASTEEL', topStockChange: -0.85 },
  { id: 'sec-5', name: 'NIFTY PHARMA', symbol: 'PHARMA', changePercent: 0.22, weightInNifty: 4.8, advanceCount: 12, declineCount: 8, topStock: 'SUNPHARMA', topStockChange: 0.65 },
  { id: 'sec-6', name: 'NIFTY FMCG', symbol: 'FMCG', changePercent: -0.18, weightInNifty: 8.5, advanceCount: 5, declineCount: 10, topStock: 'ITC', topStockChange: -0.42 },
  { id: 'sec-7', name: 'NIFTY ENERGY', symbol: 'ENERGY', changePercent: 0.85, weightInNifty: 11.4, advanceCount: 7, declineCount: 3, topStock: 'RELIANCE', topStockChange: 1.05 },
  { id: 'sec-8', name: 'NIFTY REALTY', symbol: 'REALTY', changePercent: 1.45, weightInNifty: 2.1, advanceCount: 8, declineCount: 2, topStock: 'DLF', topStockChange: 1.95 },
  { id: 'sec-9', name: 'NIFTY PSU BANK', symbol: 'PSUBANK', changePercent: 1.88, weightInNifty: 3.2, advanceCount: 11, declineCount: 1, topStock: 'SBIN', topStockChange: 2.10 }
];

export const INITIAL_OI_BUILDUP: OiBuildupItem[] = [
  { symbol: 'NIFTY 24900 CE', index: 'NIFTY', category: 'Short Covering', priceChangePercent: 24.5, oiChangePercent: -18.2, totalOiLakhs: 48.2, implication: 'Bears unwinding calls; upward acceleration' },
  { symbol: 'NIFTY 24800 PE', index: 'NIFTY', category: 'Long Build-up', priceChangePercent: -18.4, oiChangePercent: 32.5, totalOiLakhs: 72.8, implication: 'Heavy put writing creating strong floor' },
  { symbol: 'BANKNIFTY 52500 CE', index: 'BANKNIFTY', category: 'Short Build-up', priceChangePercent: -12.1, oiChangePercent: 28.4, totalOiLakhs: 54.1, implication: 'Call writers defending 52,500 resistance' },
  { symbol: 'HDFCBANK', index: 'BANKNIFTY', category: 'Long Build-up', priceChangePercent: 0.95, oiChangePercent: 8.6, totalOiLakhs: 185.0, implication: 'Institutional buying supporting Nifty Bank' },
  { symbol: 'INFY', index: 'NIFTY', category: 'Short Covering', priceChangePercent: 1.82, oiChangePercent: -9.4, totalOiLakhs: 82.3, implication: 'IT heavy lifting behind broad market gain' },
  { symbol: 'TATASTEEL', index: 'NIFTY', category: 'Long Unwinding', priceChangePercent: -0.85, oiChangePercent: -4.8, totalOiLakhs: 124.5, implication: 'Long liquidation following global steel tariffs' },
  { symbol: 'FINNIFTY 23900 PE', index: 'FINNIFTY', category: 'Long Build-up', priceChangePercent: -22.0, oiChangePercent: 44.2, totalOiLakhs: 38.6, implication: 'Expiry base established at 23,900' }
];

export const INITIAL_ZONES: DemandSupplyZone[] = [
  { id: 'z-1', index: 'NIFTY', levelType: 'Major Supply (R2)', priceRange: [24980, 25020], touchCount: 4, strength: 'Critical', distancePts: 128 },
  { id: 'z-2', index: 'NIFTY', levelType: 'Minor Supply (R1)', priceRange: [24910, 24935], touchCount: 2, strength: 'Medium', distancePts: 52 },
  { id: 'z-3', index: 'NIFTY', levelType: 'POC / Value High', priceRange: [24840, 24865], touchCount: 7, strength: 'Critical', distancePts: 0 },
  { id: 'z-4', index: 'NIFTY', levelType: 'Virgin CPR', priceRange: [24775, 24790], touchCount: 0, strength: 'High', distancePts: -82 },
  { id: 'z-5', index: 'NIFTY', levelType: 'Major Demand (S2)', priceRange: [24680, 24720], touchCount: 3, strength: 'High', distancePts: -160 },
  { id: 'z-6', index: 'BANKNIFTY', levelType: 'Major Supply (R2)', priceRange: [52800, 52950], touchCount: 3, strength: 'Critical', distancePts: 410 },
  { id: 'z-7', index: 'BANKNIFTY', levelType: 'POC / Value High', priceRange: [52380, 52450], touchCount: 6, strength: 'High', distancePts: 12 },
  { id: 'z-8', index: 'BANKNIFTY', levelType: 'Major Demand (S2)', priceRange: [51950, 52050], touchCount: 4, strength: 'Critical', distancePts: -420 }
];

export const INITIAL_RISK_SETTINGS: RiskSettings = {
  accountCapital: 1000000, // ₹10,00,000 base capital
  riskPerTradePct: 1.0,    // 1% max per trade = ₹10,000
  maxDailyLossPct: 2.5,    // 2.5% max daily drawdown = ₹25,000
  consecutiveLossHaltThreshold: 3,
  isKillSwitchActive: false,
  lockoutUntil: null
};

export const INITIAL_DAILY_RISK_STATE: DailyRiskState = {
  currentDailyPnl: 14250, // +₹14,250 today
  peakDailyPnl: 18500,
  tradesToday: 4,
  winsToday: 3,
  lossesToday: 1,
  consecutiveLosses: 0,
  currentDrawdownFromPeak: 4250,
  isSizeReducedByCircuit: false,
  isLockedOut: false
};
