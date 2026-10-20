"""
Angel One SmartAPI Client & WebSocket Manager:
- Handles TOTP session authentication via pyotp
- Resolves instrument tokens for NIFTY and BANKNIFTY options
- Connects to Angel One SmartWebSocketV2 for live ticks
- Ingests ticks into AnalyticsEngine (VWAP & OI)
- Provides resilient tick simulation when offline or testing without live credentials
"""

import asyncio
import json
import logging
import random
import time
from datetime import datetime
from typing import Callable, Dict, List, Optional, Set

import pyotp
import requests
from analytics import analytics_engine
from config import config

logger = logging.getLogger("smartapi_backend")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


class SmartAPIClient:
    def __init__(self):
        self.api_key = config.api_key
        self.client_code = config.client_code
        self.pin = config.pin
        self.totp_key = config.totp_key

        self.smart_connect = None
        self.auth_token = None
        self.refresh_token = None
        self.feed_token = None
        self.is_connected = False
        self.is_simulating = False

        # Token maps: token -> metadata
        self.instrument_tokens: Dict[str, Dict] = {}
        # Subscriber callbacks for broadcast
        self.tick_listeners: Set[Callable] = set()

        # Background tasks
        self._sim_task: Optional[asyncio.Task] = None
        self._ws_client = None

    def generate_totp(self) -> str:
        """Generates dynamic 6-digit TOTP from base32 secret."""
        if not self.totp_key:
            return ""
        totp = pyotp.TOTP(self.totp_key)
        return totp.now()

    def authenticate(self) -> bool:
        """
        Authenticates with Angel One SmartAPI using Client Code, PIN, and dynamic TOTP.
        """
        if not config.has_valid_credentials:
            logger.warning("Angel One credentials missing or incomplete in .env. Falling back to simulation mode.")
            return False

        try:
            from SmartApi import SmartConnect

            self.smart_connect = SmartConnect(api_key=self.api_key)
            totp_code = self.generate_totp()

            logger.info(f"Authenticating SmartAPI for client {self.client_code} with dynamic TOTP...")
            session_data = self.smart_connect.generateSession(self.client_code, self.pin, totp_code)

            if session_data and session_data.get("status"):
                self.auth_token = session_data["data"]["jwtToken"]
                self.refresh_token = session_data["data"]["refreshToken"]
                self.feed_token = session_data["data"]["feedToken"]
                self.is_connected = True
                logger.info("Successfully authenticated with Angel One SmartAPI.")
                return True
            else:
                logger.error(f"Authentication failed: {session_data.get('message', 'Unknown error')}")
                return False
        except Exception as e:
            logger.exception(f"Exception during SmartAPI authentication: {e}")
            return False

    def load_instrument_tokens(self) -> int:
        """
        Downloads the instrument master JSON and filters near-the-money
        NIFTY and BANKNIFTY strikes.
        """
        logger.info("Loading instrument token master list for NIFTY and BANKNIFTY...")
        try:
            resp = requests.get(config.scrip_master_url, timeout=15)
            if resp.status_code == 200:
                scrips = resp.json()
                logger.info(f"Fetched {len(scrips)} total instruments from Angel One scrip master.")

                # Filter NFO derivatives for NIFTY and BANKNIFTY
                count = 0
                for item in scrips:
                    name = item.get("name", "")
                    instrument_type = item.get("instrumenttype", "")
                    exch_seg = item.get("exch_seg", "")

                    if exch_seg == "NFO" and name in ("NIFTY", "BANKNIFTY") and instrument_type == "OPTIDX":
                        token = str(item.get("token"))
                        symbol = item.get("symbol", "")
                        strike = float(item.get("strike", 0)) / 100.0 if item.get("strike") else 0.0

                        # Filter near current price ranges to keep memory optimized
                        if name == "NIFTY" and (strike < 24000 or strike > 25800):
                            continue
                        if name == "BANKNIFTY" and (strike < 50500 or strike > 54500):
                            continue

                        self.instrument_tokens[token] = {
                            "token": token,
                            "symbol": symbol,
                            "name": name,
                            "strike": strike,
                            "option_type": "CE" if "CE" in symbol else "PE",
                            "expiry": item.get("expiry", ""),
                            "lotsize": int(item.get("lotsize", 25 if name == "NIFTY" else 15))
                        }
                        count += 1
                        if count >= 60:  # Enough strikes for 2 indices
                            break

                logger.info(f"Filtered {len(self.instrument_tokens)} option strikes for live tracking.")
                return len(self.instrument_tokens)
        except Exception as e:
            logger.warning(f"Could not download live scrip master ({e}). Initializing predefined token grid.")

        # Fallback predefined strike map
        self._init_fallback_tokens()
        return len(self.instrument_tokens)

    def _init_fallback_tokens(self):
        """Initializes realistic tokens for NIFTY (24500 - 25200) and BANKNIFTY (51800 - 53000)."""
        tokens = {}
        # NIFTY Strikes (Step 50)
        spot_nifty = 24850
        for i in range(-config.strike_depth, config.strike_depth + 1):
            st = spot_nifty + i * 50
            # CE
            ce_token = f"991{st}"
            tokens[ce_token] = {
                "token": ce_token,
                "symbol": f"NIFTY {st} CE",
                "name": "NIFTY",
                "strike": float(st),
                "option_type": "CE",
                "expiry": "24-OCT-2026",
                "lotsize": 25
            }
            # PE
            pe_token = f"992{st}"
            tokens[pe_token] = {
                "token": pe_token,
                "symbol": f"NIFTY {st} PE",
                "name": "NIFTY",
                "strike": float(st),
                "option_type": "PE",
                "expiry": "24-OCT-2026",
                "lotsize": 25
            }

        # BANKNIFTY Strikes (Step 100)
        spot_bn = 52400
        for i in range(-config.strike_depth, config.strike_depth + 1):
            st = spot_bn + i * 100
            # CE
            ce_token = f"981{st}"
            tokens[ce_token] = {
                "token": ce_token,
                "symbol": f"BANKNIFTY {st} CE",
                "name": "BANKNIFTY",
                "strike": float(st),
                "option_type": "CE",
                "expiry": "23-OCT-2026",
                "lotsize": 15
            }
            # PE
            pe_token = f"982{st}"
            tokens[pe_token] = {
                "token": pe_token,
                "symbol": f"BANKNIFTY {st} PE",
                "name": "BANKNIFTY",
                "strike": float(st),
                "option_type": "PE",
                "expiry": "23-OCT-2026",
                "lotsize": 15
            }

        self.instrument_tokens = tokens
        logger.info(f"Initialized fallback token grid with {len(tokens)} strikes.")

    def add_tick_listener(self, callback: Callable):
        self.tick_listeners.add(callback)

    def remove_tick_listener(self, callback: Callable):
        self.tick_listeners.discard(callback)

    def _broadcast_tick(self, tick_payload: Dict):
        for listener in list(self.tick_listeners):
            try:
                listener(tick_payload)
            except Exception as e:
                logger.error(f"Error in tick listener callback: {e}")

    def on_live_tick(self, ws, msg):
        """
        Callback triggered when a live binary/JSON tick arrives from Angel One WebSocket.
        """
        try:
            if isinstance(msg, bytes):
                # SmartWebSocketV2 binary packet parsing
                # Byte positions per Angel One V2 spec:
                # token (25 bytes), last_traded_price (int64 / 100), volume (int64), open_interest (int64)
                if len(msg) >= 43:
                    token = msg[1:26].decode("utf-8").strip("\x00")
                    ltp = int.from_bytes(msg[43:51], byteorder="little") / 100.0
                    vol = int.from_bytes(msg[51:59], byteorder="little")
                    oi = int.from_bytes(msg[59:67], byteorder="little") if len(msg) >= 67 else 0
                    self._process_tick_data(token, ltp, vol, oi)
            elif isinstance(msg, dict):
                token = str(msg.get("token"))
                ltp = float(msg.get("last_traded_price", 0)) / 100.0 if msg.get("last_traded_price", 0) > 10000 else float(msg.get("last_traded_price", 0))
                vol = int(msg.get("volume_trade_for_the_day", 0))
                oi = int(msg.get("open_interest", 0))
                self._process_tick_data(token, ltp, vol, oi)
        except Exception as e:
            logger.error(f"Error parsing live tick: {e}")

    def _process_tick_data(self, token: str, price: float, volume: int, oi: int):
        meta = self.instrument_tokens.get(token, {})
        symbol = meta.get("symbol", f"TOKEN_{token}")

        # Ingest into analytics engine
        vwap, buildup = analytics_engine.update_tick(
            token=token,
            symbol=symbol,
            price=price,
            volume=volume,
            open_interest=oi
        )

        payload = {
            "type": "tick",
            "token": token,
            "symbol": symbol,
            "index_name": meta.get("name", "NIFTY"),
            "strike": meta.get("strike", 0),
            "option_type": meta.get("option_type", "CE"),
            "ltp": price,
            "volume": volume,
            "open_interest": oi,
            "vwap": vwap,
            "buildup": buildup,
            "timestamp": datetime.now().isoformat()
        }
        self._broadcast_tick(payload)

    def start_websocket(self):
        """
        Launches SmartWebSocketV2 connection if credentials are valid,
        or launches real-time tick simulator.
        """
        if self.is_connected and self.auth_token and self.feed_token:
            try:
                from SmartApi.smartWebSocketV2 import SmartWebSocketV2

                logger.info("Initializing Angel One SmartWebSocketV2 connection...")
                self._ws_client = SmartWebSocketV2(
                    auth_token=self.auth_token,
                    api_key=self.api_key,
                    client_code=self.client_code,
                    feed_token=self.feed_token
                )
                self._ws_client.on_data = self.on_live_tick

                # Prepare token subscription
                tokens_list = list(self.instrument_tokens.keys())[:50]
                token_exchange_list = [{"exchangeType": 2, "tokens": tokens_list}]  # 2 = NFO
                
                # Mode 3 = SnapQuote (LTP, Volume, OI, High, Low)
                self._ws_client.connect()
                self._ws_client.subscribe("aitos_stream", 3, token_exchange_list)
                logger.info(f"Subscribed to {len(tokens_list)} strikes on SmartWebSocketV2.")
                return
            except Exception as e:
                logger.error(f"Failed to start Angel One live WebSocket: {e}. Falling back to simulation.")

        # Fallback to realistic live tick simulation
        self.is_simulating = True
        logger.info("Starting high-fidelity real-time tick simulator for NIFTY & BANKNIFTY...")
        self._start_simulation_loop()

    def _start_simulation_loop(self):
        """Simulates live tick updates across all strikes with real VWAP & OI progression."""
        # Initialize base state in AnalyticsEngine for all strikes
        spot_n = 24862.30
        spot_bn = 52445.60
        analytics_engine.update_spot("NIFTY", spot_n, 24733.80)
        analytics_engine.update_spot("BANKNIFTY", spot_bn, 52120.20)

        for token, meta in self.instrument_tokens.items():
            is_nifty = meta["name"] == "NIFTY"
            spot = spot_n if is_nifty else spot_bn
            st = meta["strike"]
            diff = spot - st
            is_ce = meta["option_type"] == "CE"

            # Compute realistic base price
            intrinsic = max(0, diff if is_ce else -diff)
            extrinsic = max(15, (220 - abs(diff) * 0.15) * (1.8 if not is_nifty else 1.0))
            base_price = round(intrinsic + extrinsic, 2)
            base_vol = random.randint(15000, 180000)
            base_oi = random.randint(45000, 140000)

            analytics_engine.update_tick(
                token=token,
                symbol=meta["symbol"],
                price=base_price,
                volume=base_vol,
                open_interest=base_oi,
                open_oi=int(base_oi * 0.92),
                previous_close=round(base_price * 0.95, 2)
            )

        async def tick_worker():
            tokens = list(self.instrument_tokens.keys())
            while True:
                try:
                    # Pick 2-4 random strikes to tick every 400ms
                    batch = random.sample(tokens, min(4, len(tokens)))
                    for token in batch:
                        meta = self.instrument_tokens[token]
                        curr_state = analytics_engine.strike_oi_tracker.get(token)
                        if not curr_state:
                            continue

                        # Random walk price tick
                        price_jitter = round((random.random() - 0.49) * (1.2 if meta["name"] == "BANKNIFTY" else 0.45), 2)
                        new_price = max(0.5, round(curr_state.ltp + price_jitter, 2))
                        
                        # Increment volume
                        inc_vol = random.randint(25, 250) * meta.get("lotsize", 25)
                        new_vol = curr_state.volume + inc_vol

                        # Increment or decrement OI (simulating writing or unwinding)
                        oi_drift = random.choice([-1, 1, 1, 1]) * random.randint(50, 400)
                        new_oi = max(1000, curr_state.current_oi + oi_drift)

                        vwap, buildup = analytics_engine.update_tick(
                            token=token,
                            symbol=meta["symbol"],
                            price=new_price,
                            volume=new_vol,
                            open_interest=new_oi
                        )

                        payload = {
                            "type": "tick",
                            "token": token,
                            "symbol": meta["symbol"],
                            "index_name": meta["name"],
                            "strike": meta["strike"],
                            "option_type": meta["option_type"],
                            "ltp": new_price,
                            "volume": new_vol,
                            "open_interest": new_oi,
                            "vwap": vwap,
                            "buildup": buildup,
                            "timestamp": datetime.now().strftime("%H:%M:%S")
                        }
                        self._broadcast_tick(payload)

                    await asyncio.sleep(0.4)
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    logger.error(f"Simulation tick error: {e}")
                    await asyncio.sleep(1)

        try:
            loop = asyncio.get_running_loop()
            self._sim_task = loop.create_task(tick_worker())
        except RuntimeError:
            pass

    def stop(self):
        if self._sim_task:
            self._sim_task.cancel()
        if self._ws_client:
            try:
                self._ws_client.close_connection()
            except Exception:
                pass


smartapi_client = SmartAPIClient()
