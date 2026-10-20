"""
Configuration and Environment Settings for Angel One SmartAPI Backend.
"""

import os
from typing import Optional
from pydantic import BaseModel
from dotenv import load_dotenv

# Load .env if present
load_dotenv()


class AppConfig(BaseModel):
    # Angel One SmartAPI Credentials
    api_key: str = os.getenv("ANGEL_API_KEY", "")
    client_code: str = os.getenv("ANGEL_CLIENT_CODE", "")
    pin: str = os.getenv("ANGEL_PIN", "")
    totp_key: str = os.getenv("ANGEL_TOTP_KEY", "")

    # Server config
    host: str = os.getenv("BACKEND_HOST", "0.0.0.0")
    port: int = int(os.getenv("BACKEND_PORT", "8000"))

    # Simulation fallback mode
    simulation_mode: bool = os.getenv("SIMULATION_MODE", "true").lower() in ("true", "1", "yes")

    # Options strike depth (e.g. 8 strikes below and 8 strikes above ATM)
    strike_depth: int = int(os.getenv("OPTION_CHAIN_STRIKE_DEPTH", "8"))

    # Angel One Instrument Scrip Master URL
    scrip_master_url: str = "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json"

    @property
    def has_valid_credentials(self) -> bool:
        return bool(
            self.api_key
            and self.client_code
            and self.pin
            and self.totp_key
            and not self.api_key.startswith("YOUR_")
        )


config = AppConfig()
