"""
FastAPI Backend Server & WebSocket Gateway for Angel One SmartAPI
Features:
- Live streaming tick data via WebSocket (/ws/stream)
- Real-time Option Chain for NIFTY and BANKNIFTY
- Per-strike Open Interest (OI) changes & dynamic Buildup classification
- Session VWAP calculation with standard deviation bands
- CORS support for React frontend dashboard
"""

import asyncio
import json
import logging
from contextlib import asynccontextmanager
from typing import Dict, List, Set

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from analytics import analytics_engine
from config import config
from smartapi_client import smartapi_client

logger = logging.getLogger("aitos_api")


class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        if not self.active_connections:
            return
        payload = json.dumps(message)
        dead_sockets = set()
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception:
                dead_sockets.add(connection)

        for dead in dead_sockets:
            self.active_connections.discard(dead)


manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup:
    logger.info("Starting AITOS Trade OS Backend Engine...")
    
    # 1. Load instrument tokens for NIFTY & BANKNIFTY
    smartapi_client.load_instrument_tokens()

    # 2. Authenticate or fallback to simulation
    is_live = smartapi_client.authenticate()
    
    # 3. Start WebSocket streamer
    smartapi_client.start_websocket()

    # 4. Wire tick broadcaster to WebSocket clients
    loop = asyncio.get_running_loop()

    def on_tick_received(tick_data: dict):
        # Schedule broadcast on asyncio event loop
        asyncio.run_coroutine_threadsafe(manager.broadcast(tick_data), loop)

    smartapi_client.add_tick_listener(on_tick_received)

    # 5. Periodic option chain matrix broadcast task (every 1.5s)
    async def periodic_matrix_broadcast():
        while True:
            try:
                await asyncio.sleep(1.5)
                if manager.active_connections:
                    nifty_chain = analytics_engine.get_option_chain_summary("NIFTY")
                    banknifty_chain = analytics_engine.get_option_chain_summary("BANKNIFTY")
                    
                    await manager.broadcast({
                        "type": "matrix_update",
                        "NIFTY": nifty_chain.dict(),
                        "BANKNIFTY": banknifty_chain.dict()
                    })
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in matrix broadcast: {e}")
                await asyncio.sleep(2)

    broadcast_task = loop.create_task(periodic_matrix_broadcast())

    yield

    # Shutdown:
    logger.info("Shutting down SmartAPI backend...")
    broadcast_task.cancel()
    smartapi_client.stop()


app = FastAPI(
    title="AITOS Trade OS - Angel One SmartAPI Backend",
    description="Real-Time Options Derivatives Gateway, Session VWAP, and Open Interest Buildup Engine",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend (Vite port 3000, 5173, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def get_root():
    return {
        "system": "AITOS Trade OS - Backend Gateway",
        "status": "OPERATIONAL",
        "angel_connected": smartapi_client.is_connected,
        "mode": "LIVE_SMARTAPI" if smartapi_client.is_connected else "SIMULATION_FEED",
        "tracked_strikes": len(smartapi_client.instrument_tokens),
        "docs_url": "/docs"
    }


@app.get("/api/status")
def get_status():
    return {
        "status": "online",
        "is_angel_connected": smartapi_client.is_connected,
        "is_simulating": smartapi_client.is_simulating,
        "active_ws_clients": len(manager.active_connections),
        "tracked_instruments": len(smartapi_client.instrument_tokens),
        "indices_supported": ["NIFTY", "BANKNIFTY"],
        "vwap_active_tokens": len(analytics_engine.vwap_tracker),
        "oi_tracked_tokens": len(analytics_engine.strike_oi_tracker)
    }


@app.get("/api/option-chain/{index_name}")
def get_option_chain(index_name: str):
    """
    Returns real-time Option Chain for NIFTY or BANKNIFTY
    with per-strike Call & Put LTP, Delta, IV, Volume, OI, OI Change, Buildup, and VWAP.
    """
    idx_upper = index_name.upper()
    if idx_upper not in ("NIFTY", "BANKNIFTY"):
        raise HTTPException(status_code=400, detail="Only 'NIFTY' and 'BANKNIFTY' are currently supported.")

    summary = analytics_engine.get_option_chain_summary(idx_upper)
    return summary


@app.get("/api/oi-buildup")
def get_oi_buildup(index_name: str = "ALL"):
    """
    Returns categorized Open Interest dynamics:
    - Long Build-up
    - Short Build-up
    - Short Covering
    - Long Unwinding
    """
    strikes = analytics_engine.strike_oi_tracker.values()
    if index_name.upper() in ("NIFTY", "BANKNIFTY"):
        strikes = [s for s in strikes if s.index_name == index_name.upper()]

    categorized = {
        "Long Build-up": [],
        "Short Build-up": [],
        "Short Covering": [],
        "Long Unwinding": []
    }

    for item in strikes:
        cat = item.buildup_category
        if cat in categorized:
            categorized[cat].append({
                "token": item.token,
                "symbol": f"{item.index_name} {int(item.strike)} {item.option_type}",
                "strike": item.strike,
                "option_type": item.option_type,
                "index": item.index_name,
                "ltp": item.ltp,
                "price_change_pct": item.price_change_pct,
                "current_oi": item.current_oi,
                "oi_change": item.oi_change,
                "oi_change_pct": item.oi_change_pct,
                "volume": item.volume,
                "vwap": item.vwap,
                "implication": item.implication
            })

    # Sort each category by absolute OI change descending
    for cat in categorized:
        categorized[cat].sort(key=lambda x: abs(x["oi_change"]), reverse=True)

    return {
        "index": index_name.upper(),
        "summary": {cat: len(items) for cat, items in categorized.items()},
        "dynamics": categorized
    }


@app.get("/api/vwap/{token}")
def get_vwap(token: str):
    """
    Returns real-time session VWAP state and standard deviation bands for a given token.
    """
    v_state = analytics_engine.vwap_tracker.get(token)
    if not v_state:
        raise HTTPException(status_code=404, detail=f"No VWAP data tracked for token '{token}'")

    return {
        "token": token,
        "symbol": v_state.symbol,
        "last_price": v_state.last_price,
        "session_vwap": v_state.current_vwap,
        "upper_band_1": v_state.upper_band_1,
        "lower_band_1": v_state.lower_band_1,
        "cumulative_volume": v_state.cumulative_volume,
        "tick_count": v_state.tick_count
    }


@app.websocket("/ws/stream")
async def websocket_stream(websocket: WebSocket):
    """
    Bi-directional WebSocket streaming endpoint:
    - Broadcasts live ticks (LTP, Volume, OI, VWAP, Buildup)
    - Broadcasts option chain matrix updates every 1.5s
    - Accepts ping or subscription configuration from client
    """
    await manager.connect(websocket)
    try:
        # Send initial connection handshake with initial state
        initial_payload = {
            "type": "connected",
            "message": "Connected to AITOS Trade OS SmartAPI WebSocket Gateway",
            "indices": ["NIFTY", "BANKNIFTY"],
            "NIFTY": analytics_engine.get_option_chain_summary("NIFTY").dict(),
            "BANKNIFTY": analytics_engine.get_option_chain_summary("BANKNIFTY").dict()
        }
        await websocket.send_text(json.dumps(initial_payload))

        while True:
            # Listen for client messages (e.g. ping/pong, subscribe)
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                action = msg.get("action")
                if action == "ping":
                    await websocket.send_text(json.dumps({"type": "pong", "time": asyncio.get_event_loop().time()}))
                elif action == "get_chain":
                    idx = msg.get("index", "NIFTY").upper()
                    chain = analytics_engine.get_option_chain_summary(idx)
                    await websocket.send_text(json.dumps({"type": "chain_response", "data": chain.dict()}))
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket client error: {e}")
        manager.disconnect(websocket)


if __name__ == "__main__":
    uvicorn.run("main:app", host=config.host, port=config.port, reload=True)
