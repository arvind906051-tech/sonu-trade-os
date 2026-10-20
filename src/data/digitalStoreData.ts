import { SubscriptionPlan, DigitalProduct } from '../types/authAndStore';

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'PRO_TRADER',
    name: 'Pro Trader Membership',
    priceInr: 1999,
    billingPeriod: 'monthly',
    tagline: 'For active F&O index derivatives traders',
    popular: true,
    features: [
      'Real-time streaming Option Chains (NIFTY, BANKNIFTY, SENSEX, FINNIFTY, MIDCPNIFTY)',
      'Sub-second Greeks (Delta, Theta, Gamma, IV Skew) & Max Pain updates',
      'Early-Signal Pipeline scanner triggers & Confluence checks',
      'Sector Heatmap & Institutional OI Build-Up matrix',
      'Per-Trade Stop Budget & Dynamic Lot Size calculator',
      'Consecutive Loss Circuit Breaker auto-protection'
    ]
  },
  {
    id: 'INSTITUTIONAL',
    name: 'Institutional Command',
    priceInr: 4999,
    billingPeriod: 'monthly',
    tagline: 'For prop desks, fund managers & high-volume algorithmic traders',
    popular: false,
    features: [
      'Everything in Pro Trader',
      'Direct Angel One SmartAPI WebSocket backend integration',
      'Live Session VWAP with ±1.28σ and ±2.0σ volatility bands',
      'Orderflow & Microstructure Demand/Supply Zone feeds',
      'Priority multi-device execution gateway & Emergency Kill Switch',
      'VIP Discord access & weekly quantitative options review'
    ]
  }
];

export const DIGITAL_PRODUCTS: DigitalProduct[] = [
  {
    id: 'digi-journal-01',
    title: 'AITOS F&O Intraday Trade Journal & Mistake Tracker',
    category: 'JOURNAL',
    priceInr: 499,
    originalPriceInr: 999,
    badge: 'BESTSELLER',
    description: 'Battle-tested trading journal system featuring automated Risk:Reward calculations, emotional drawdown audits, and weekly expectancy analytics.',
    features: [
      'Notion Template with pre-configured formula databases',
      'Printable High-Res PDF Daily Intraday Execution Worksheets',
      'Pre-trade emotional checklist & circuit breaker rules',
      'Trade review analytics & quarterly profit expectancy dashboard'
    ],
    fileFormat: 'Notion Template + 45-Page Printable PDF',
    rating: 4.9,
    reviewsCount: 342,
    demoContent: 'Includes: 1. Trade Pre-Mortem Form, 2. Intraday Scalp Log, 3. Psychology Audit, 4. Weekly R-Multiple Chart'
  },
  {
    id: 'digi-toolkit-02',
    title: 'SmartAPI Algorithmic Execution Toolkit & Python Bot',
    category: 'TOOLKIT',
    priceInr: 1499,
    originalPriceInr: 2999,
    badge: 'PRO TOOLS',
    description: 'Production-ready Python FastAPI scripts, SmartWebSocketV2 streaming clients, and automated OI change detectors for Angel One.',
    features: [
      'Complete Python FastAPI & SmartConnect boilerplate',
      'WebSocket V2 binary packet unpacker for high-frequency ticks',
      'Real-time session VWAP accumulator & strike Greeks calculator',
      'Jupyter notebooks for historical intraday backtesting'
    ],
    fileFormat: 'Python 3.11+ Source (.ZIP) + Jupyter Notebooks',
    rating: 4.8,
    reviewsCount: 189,
    demoContent: 'Includes: main.py, smartapi_client.py, analytics.py, backtester.ipynb, requirements.txt, full setup documentation'
  },
  {
    id: 'digi-prompt-03',
    title: 'Quantitative Trader AI Prompt Pack (50+ Prompts)',
    category: 'PROMPT_PACK',
    priceInr: 299,
    originalPriceInr: 599,
    badge: 'POPULAR',
    description: 'Curated prompt engineering library to turn Gemini, Claude, and GPT-4 into your personal options volatility analyst, macro strategist, and trade risk auditor.',
    features: [
      '50+ High-Context Prompts for Market Structure, Gamma Squeezes & OI Analysis',
      'EOD Trade Log Auditor prompt to detect psychological leaks',
      'Macro Sentiment & FII/DII Institutional Flow Decoder',
      'Option Strategy Payoff & Breakeven Optimizer'
    ],
    fileFormat: 'Markdown (.MD) + Notion Pack + PDF Cheatsheet',
    rating: 4.9,
    reviewsCount: 421,
    demoContent: 'Features 5 Categories: 1. Macro Analysis, 2. Options Volatility & Gamma, 3. Post-Trade Review, 4. Risk Guardrails, 5. Strategy Synthesizer'
  },
  {
    id: 'digi-playbook-04',
    title: 'Institutional Orderflow & Volume Profile Playbook',
    category: 'PLAYBOOK',
    priceInr: 799,
    originalPriceInr: 1499,
    badge: 'ADVANCED',
    description: 'Master reading Point of Control (POC), Value Area High/Low (VAH/VAL), and Delta divergences on Nifty and Bank Nifty intraday charts.',
    features: [
      '120-page full-color visual case studies on index breakouts',
      'How to spot fakeouts vs institutional block absorption',
      'Virgin CPR and Opening Range Breakout (ORB) rules',
      'Gamma pin mechanics on weekly settlement days'
    ],
    fileFormat: '120-Page Color PDF + High-Res Chart Library',
    rating: 4.7,
    reviewsCount: 215,
    demoContent: 'Contains 18 annotated institutional footprint charts and 6 core repeatable execution setups.'
  }
];
