# AITOS Trade OS - Angel One SmartAPI Backend & WebSocket Streamer

A production-ready Python **FastAPI** backend and **WebSocket client** connecting to **Angel One SmartAPI** for high-frequency index options data.

---

## Key Features

1. **Angel One SmartAPI Authentication**:
   - Automated dynamic TOTP authentication via `pyotp`
   - Session generation (`generateSession`) retrieving JWT auth token and feed token
   - Near-the-money instrument token filtering from official Scrip Master JSON.

2. **Real-time Session VWAP**:
   - Volume-Weighted Average Price tracking per strike and underlying index:
     $$\text{VWAP} = \frac{\sum (P_i \times V_i)}{\sum V_i}$$
   - Continuous standard deviation bands (+1.28$\sigma$, -1.28$\sigma$).

3. **Per-Strike Open Interest (OI) Dynamics**:
   - Real-time classification based on instantaneous price change ($\Delta P$) and open interest change ($\Delta OI$):
     - **Long Build-up**: $\Delta P > 0$ and $\Delta OI > 0$ (Fresh bullish accumulation)
     - **Short Build-up**: $\Delta P < 0$ and $\Delta OI > 0$ (Aggressive shorting / resistance defense)
     - **Short Covering**: $\Delta P > 0$ and $\Delta OI < 0$ (Bear panic / short squeeze)
     - **Long Unwinding**: $\Delta P < 0$ and $\Delta OI < 0$ (Long profit-taking / liquidation)

4. **Option Chain Analytics for NIFTY & BANKNIFTY**:
   - Put-Call Ratio (PCR)
   - Max Pain strike calculation
   - Per-strike Call & Put matrix with real-time Greeks, LTP, Volume, and OI.

5. **Dual Operation Mode (Live + High-Fidelity Simulation)**:
   - When credentials are provided and market is open $\rightarrow$ connects to live Angel One SmartWebSocketV2.
   - When credentials are not yet set or testing outside market hours $\rightarrow$ automatically spins up a high-frequency tick simulator so frontend dashboards and clients receive realistic live feeds without waiting for market hours.

---

## Directory Layout

```
backend/
├── main.py              # FastAPI application & WebSocket /ws/stream server
├── smartapi_client.py   # Angel One SmartConnect & SmartWebSocketV2 manager
├── analytics.py         # Session VWAP & OI classification engine
├── ws_client.py         # Standalone terminal WebSocket client
├── config.py            # Environment settings and credential validations
├── requirements.txt     # Python dependencies
├── .env.example         # Template for Angel One credentials
└── README.md            # Setup and execution guide
```

---

## Quick Start Guide

### 1. Create a Python Virtual Environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Credentials (Optional for Live Trading)

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update your credentials:
- `ANGEL_API_KEY`: API Key from [Angel One SmartAPI Portal](https://smartapi.angelbroking.com/)
- `ANGEL_CLIENT_CODE`: Your Angel One account client ID
- `ANGEL_PIN`: 4-digit Account PIN
- `ANGEL_TOTP_KEY`: Base32 TOTP secret from Authenticator setup

*(If left blank, `SIMULATION_MODE=true` will automatically generate live realistic ticks for testing)*

### 4. Run the FastAPI Server

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The server will be available at:
- Interactive API Docs (Swagger UI): `http://localhost:8000/docs`
- WebSocket Feed: `ws://localhost:8000/ws/stream`

### 5. Run the Standalone WebSocket Client

Open a second terminal window and run:

```bash
python ws_client.py
```

You will see live colored ticks streaming with timestamp, symbol, LTP, real-time Session VWAP, Open Interest, and color-coded Buildup classification (Long Build-up, Short Build-up, Short Covering, Long Unwinding).

---

## REST Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/status` | Current connection state, market mode, and tracked strikes count |
| `GET` | `/api/option-chain/NIFTY` | Real-time Option Chain for NIFTY with PCR, Max Pain & per-strike Greeks |
| `GET` | `/api/option-chain/BANKNIFTY` | Real-time Option Chain for BANKNIFTY with per-strike VWAP & OI |
| `GET` | `/api/oi-buildup` | Aggregated Long Buildup, Short Buildup, Short Covering, Long Unwinding |
| `GET` | `/api/vwap/{token}` | Instantaneous session VWAP and $\pm 1.28\sigma$ standard deviation bands |
| `WS` | `/ws/stream` | Full-duplex WebSocket streaming tick and matrix snapshots |

---

## WebSocket Protocol Specification

### Connect

Connect to `ws://localhost:8000/ws/stream`. On connection, the server sends a handshake message:

```json
{
  "type": "connected",
  "message": "Connected to AITOS Trade OS SmartAPI WebSocket Gateway",
  "indices": ["NIFTY", "BANKNIFTY"],
  "NIFTY": { ... },
  "BANKNIFTY": { ... }
}
```

### Live Tick Message Format

```json
{
  "type": "tick",
  "token": "99124850",
  "symbol": "NIFTY 24850 CE",
  "index_name": "NIFTY",
  "strike": 24850.0,
  "option_type": "CE",
  "ltp": 142.50,
  "volume": 68400,
  "open_interest": 82400,
  "vwap": 139.80,
  "buildup": "Long Build-up",
  "timestamp": "11:42:05"
}
```

### Client Messages

- **Ping**: Send `{"action": "ping"}` $\rightarrow$ receives `{"type": "pong", "time": ...}`
- **Get Matrix**: Send `{"action": "get_chain", "index": "NIFTY"}` $\rightarrow$ receives latest option chain snapshot
