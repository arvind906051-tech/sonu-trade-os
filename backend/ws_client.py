"""
Standalone Python WebSocket Client:
Connects to the FastAPI Angel One backend (/ws/stream), streams live ticks,
and displays real-time Session VWAP and per-strike OI buildup calculations.
"""

import asyncio
import json
import sys
import websockets
from datetime import datetime

# ANSI Color codes for clean terminal display
GREEN = "\033[92m"
RED = "\033[91m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"


def format_buildup_badge(buildup: str) -> str:
    if buildup == "Long Build-up":
        return f"{GREEN}[LONG BUILD-UP]{RESET}"
    elif buildup == "Short Build-up":
        return f"{RED}[SHORT BUILD-UP]{RESET}"
    elif buildup == "Short Covering":
        return f"{CYAN}[SHORT COVERING]{RESET}"
    elif buildup == "Long Unwinding":
        return f"{YELLOW}[LONG UNWINDING]{RESET}"
    return f"{RESET}[NEUTRAL]{RESET}"


async def run_client(ws_url: str = "ws://localhost:8000/ws/stream"):
    print(f"\n{BOLD}===================================================================={RESET}")
    print(f"{BOLD}   AITOS Trade OS - Real-Time SmartAPI WebSocket Terminal Client    {RESET}")
    print(f"{BOLD}===================================================================={RESET}")
    print(f"Connecting to: {CYAN}{ws_url}{RESET} ...\n")

    while True:
        try:
            async with websockets.connect(ws_url) as ws:
                print(f"{GREEN}Connected successfully to live feed!{RESET}\n")
                print(f"{'TIME':<10} | {'SYMBOL':<18} | {'LTP (₹)':<10} | {'VWAP (₹)':<10} | {'OI (LOTS)':<10} | {'OI BUILD-UP DYNAMICS'}")
                print("-" * 88)

                # Send initial ping
                await ws.send(json.dumps({"action": "ping"}))

                async for raw_message in ws:
                    data = json.loads(raw_message)
                    msg_type = data.get("type")

                    if msg_type == "tick":
                        symbol = data.get("symbol", "N/A")
                        ltp = data.get("ltp", 0.0)
                        vwap = data.get("vwap", 0.0)
                        oi = data.get("open_interest", 0)
                        buildup = data.get("buildup", "Neutral")
                        time_str = data.get("timestamp", datetime.now().strftime("%H:%M:%S"))

                        badge = format_buildup_badge(buildup)
                        vwap_color = GREEN if ltp >= vwap else RED

                        print(
                            f"{time_str:<10} | {BOLD}{symbol:<18}{RESET} | {ltp:<10.2f} | "
                            f"{vwap_color}{vwap:<10.2f}{RESET} | {oi:<10} | {badge}"
                        )

                    elif msg_type == "matrix_update":
                        # Periodic summary
                        nifty = data.get("NIFTY", {})
                        bn = data.get("BANKNIFTY", {})
                        sys.stdout.write(
                            f"\r{CYAN}[INDEX SNAPSHOT]{RESET} NIFTY: {BOLD}{nifty.get('spot_price')}{RESET} (PCR: {nifty.get('pcr')}, Pain: {nifty.get('max_pain')}) | "
                            f"BANKNIFTY: {BOLD}{bn.get('spot_price')}{RESET} (PCR: {bn.get('pcr')}, Pain: {bn.get('max_pain')})\n"
                        )
                        sys.stdout.flush()

                    elif msg_type == "connected":
                        print(f"{YELLOW}Server Handshake:{RESET} {data.get('message')}")
                        print(f"Indices Monitored: {', '.join(data.get('indices', []))}\n")

        except (websockets.ConnectionClosedError, ConnectionRefusedError) as e:
            print(f"{RED}Disconnected from server ({e}). Reconnecting in 3 seconds...{RESET}")
            await asyncio.sleep(3)
        except Exception as e:
            print(f"{RED}Unexpected error: {e}{RESET}")
            await asyncio.sleep(3)


if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else "ws://localhost:8000/ws/stream"
    try:
        asyncio.run(run_client(url))
    except KeyboardInterrupt:
        print(f"\n{YELLOW}Client stopped by user.{RESET}")
