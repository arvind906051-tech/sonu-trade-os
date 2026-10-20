"""
Real-Time Analytics Engine:
- Session VWAP calculation per strike and underlying
- Per-strike Open Interest (OI) Change & Buildup classification (Long Build-up, Short Build-up, Short Covering, Long Unwinding)
- Put-Call Ratio (PCR) & Max Pain strike computation
"""

import math
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel, Field


class VWAPState(BaseModel):
    token: str
    symbol: str
    cumulative_volume: int = 0
    cumulative_pv: float = 0.0  # Sum of (price * volume)
    current_vwap: float = 0.0
    last_price: float = 0.0
    high_price: float = 0.0
    low_price: float = 9999999.0
    upper_band_1: float = 0.0
    lower_band_1: float = 0.0
    tick_count: int = 0


class StrikeOIData(BaseModel):
    token: str
    strike: float
    option_type: str  # "CE" or "PE"
    index_name: str   # "NIFTY" or "BANKNIFTY"
    ltp: float
    previous_close: float
    price_change: float = 0.0
    price_change_pct: float = 0.0
    current_oi: int
    open_oi: int  # Starting session OI
    oi_change: int = 0
    oi_change_pct: float = 0.0
    volume: int = 0
    vwap: float = 0.0
    buildup_category: str = "Neutral"  # Long Build-up, Short Build-up, Short Covering, Long Unwinding
    implication: str = ""


class OptionChainMatrix(BaseModel):
    index_name: str
    spot_price: float
    spot_change: float
    spot_change_pct: float
    pcr: float
    max_pain: float
    atm_strike: float
    total_call_oi: int
    total_put_oi: int
    total_call_volume: int
    total_put_volume: int
    updated_at: str
    strikes: List[Dict] = Field(default_factory=list)


class AnalyticsEngine:
    def __init__(self):
        # Maps token -> VWAPState
        self.vwap_tracker: Dict[str, VWAPState] = {}
        # Maps token -> StrikeOIData
        self.strike_oi_tracker: Dict[str, StrikeOIData] = {}
        # Spot price cache
        self.spot_cache: Dict[str, float] = {"NIFTY": 24862.30, "BANKNIFTY": 52445.60}
        self.spot_close_cache: Dict[str, float] = {"NIFTY": 24733.80, "BANKNIFTY": 52120.20}

    def update_tick(
        self,
        token: str,
        symbol: str,
        price: float,
        volume: int,
        open_interest: int,
        high: Optional[float] = None,
        low: Optional[float] = None,
        open_oi: Optional[int] = None,
        previous_close: Optional[float] = None
    ) -> Tuple[float, str]:
        """
        Ingest a tick:
        1. Updates real-time Session VWAP
        2. Calculates OI change and classifies buildup
        Returns (vwap, buildup_category)
        """
        # 1. Update VWAP Tracker
        if token not in self.vwap_tracker:
            self.vwap_tracker[token] = VWAPState(
                token=token,
                symbol=symbol,
                last_price=price,
                high_price=high or price,
                low_price=low or price
            )

        v_state = self.vwap_tracker[token]
        # Incremental tick volume calculation (or total traded volume)
        incremental_vol = volume if v_state.cumulative_volume == 0 else max(1, volume - v_state.cumulative_volume)
        
        # In Indian exchange tick feeds, volume is often cumulative total for the day.
        # If feed provides cumulative volume:
        if volume > v_state.cumulative_volume:
            inc_vol = volume - v_state.cumulative_volume
            v_state.cumulative_volume = volume
            v_state.cumulative_pv += price * inc_vol
        else:
            # Single tick volume
            inc_vol = max(1, volume)
            v_state.cumulative_volume += inc_vol
            v_state.cumulative_pv += price * inc_vol

        v_state.last_price = price
        v_state.high_price = max(v_state.high_price, price)
        v_state.low_price = min(v_state.low_price, price)
        v_state.tick_count += 1

        if v_state.cumulative_volume > 0:
            v_state.current_vwap = round(v_state.cumulative_pv / v_state.cumulative_volume, 2)
            # Estimate standard deviation band
            diff = abs(price - v_state.current_vwap)
            v_state.upper_band_1 = round(v_state.current_vwap + 1.28 * diff, 2)
            v_state.lower_band_1 = round(max(0.1, v_state.current_vwap - 1.28 * diff), 2)
        else:
            v_state.current_vwap = price

        # 2. Update OI and Buildup Tracker
        if token not in self.strike_oi_tracker:
            base_open_oi = open_oi if open_oi and open_oi > 0 else open_interest
            base_prev_close = previous_close if previous_close and previous_close > 0 else price
            
            # Extract strike and type if symbol has them
            opt_type = "CE" if "CE" in symbol.upper() else "PE" if "PE" in symbol.upper() else "FUT"
            index_name = "BANKNIFTY" if "BANKNIFTY" in symbol.upper() else "NIFTY"
            
            # Attempt to extract strike number from symbol
            strike_val = 0.0
            for part in symbol.split():
                if part.isdigit():
                    strike_val = float(part)
                    break

            self.strike_oi_tracker[token] = StrikeOIData(
                token=token,
                strike=strike_val,
                option_type=opt_type,
                index_name=index_name,
                ltp=price,
                previous_close=base_prev_close,
                current_oi=open_interest,
                open_oi=base_open_oi,
                volume=volume,
                vwap=v_state.current_vwap
            )

        oi_state = self.strike_oi_tracker[token]
        oi_state.ltp = price
        oi_state.current_oi = open_interest
        oi_state.volume = volume
        oi_state.vwap = v_state.current_vwap

        # Price change
        oi_state.price_change = round(price - oi_state.previous_close, 2)
        oi_state.price_change_pct = round(
            (oi_state.price_change / (oi_state.previous_close or 1)) * 100, 2
        )

        # OI Change
        oi_state.oi_change = open_interest - oi_state.open_oi
        oi_state.oi_change_pct = round(
            (oi_state.oi_change / (oi_state.open_oi or 1)) * 100, 2
        )

        # Categorize Buildup based on Price & OI Delta
        category, implication = self.classify_oi_buildup(
            oi_state.price_change, oi_state.oi_change, oi_state.option_type
        )
        oi_state.buildup_category = category
        oi_state.implication = implication

        return v_state.current_vwap, category

    @staticmethod
    def classify_oi_buildup(price_change: float, oi_change: int, option_type: str = "") -> Tuple[str, str]:
        """
        Classifies institutional open interest build-up dynamics:
        - Price Up & OI Up   -> Long Build-up (Bullish positioning)
        - Price Down & OI Up -> Short Build-up (Bearish positioning / aggressive writing)
        - Price Up & OI Down -> Short Covering (Bearish capitulation / short squeeze)
        - Price Down & OI Down -> Long Unwinding (Long liquidation / profit booking)
        """
        # Threshold to avoid micro-jitter noise
        if abs(price_change) < 0.05 and abs(oi_change) < 20:
            return "Neutral", "Low participation / consolidation"

        if price_change >= 0 and oi_change >= 0:
            category = "Long Build-up"
            if option_type == "CE":
                implication = "Bullish call buying / momentum buildup"
            elif option_type == "PE":
                implication = "Bearish put buying / downside hedging"
            else:
                implication = "Fresh long positions added by buyers"

        elif price_change < 0 and oi_change >= 0:
            category = "Short Build-up"
            if option_type == "CE":
                implication = "Aggressive Call writing (Resistance defended)"
            elif option_type == "PE":
                implication = "Aggressive Put writing (Support established)"
            else:
                implication = "Fresh short positions created by sellers"

        elif price_change >= 0 and oi_change < 0:
            category = "Short Covering"
            if option_type == "CE":
                implication = "Call writers panicking / upward short squeeze"
            elif option_type == "PE":
                implication = "Put sellers closing shorts on market rebound"
            else:
                implication = "Sellers covering short positions"

        else:  # price_change < 0 and oi_change < 0
            category = "Long Unwinding"
            if option_type == "CE":
                implication = "Call buyers cutting losses on market dip"
            elif option_type == "PE":
                implication = "Put buyers booking profit / unwinding protection"
            else:
                implication = "Long holders closing out positions"

        return category, implication

    def update_spot(self, index_name: str, spot_price: float, previous_close: Optional[float] = None):
        self.spot_cache[index_name] = spot_price
        if previous_close:
            self.spot_close_cache[index_name] = previous_close

    def compute_max_pain(self, strikes: List[float], call_ois: Dict[float, int], put_ois: Dict[float, int]) -> float:
        """
        Max Pain Theory: The strike at which option buyers lose the maximum value
        (i.e. option writers/sellers experience the minimum financial loss).
        """
        if not strikes:
            return 0.0

        min_total_loss = float("inf")
        max_pain_strike = strikes[0]

        for test_strike in strikes:
            total_loss = 0.0
            # Call buyers payoff: max(0, test_strike - K) * Call OI
            for k, call_oi in call_ois.items():
                if test_strike > k:
                    total_loss += (test_strike - k) * call_oi

            # Put buyers payoff: max(0, K - test_strike) * Put OI
            for k, put_oi in put_ois.items():
                if test_strike < k:
                    total_loss += (k - test_strike) * put_oi

            if total_loss < min_total_loss:
                min_total_loss = total_loss
                max_pain_strike = test_strike

        return max_pain_strike

    def get_option_chain_summary(self, index_name: str) -> OptionChainMatrix:
        """
        Aggregates per-strike analytics for the given index (NIFTY / BANKNIFTY)
        including PCR, Max Pain, and detailed strike rows.
        """
        spot = self.spot_cache.get(index_name, 24860.0 if index_name == "NIFTY" else 52440.0)
        spot_close = self.spot_close_cache.get(index_name, spot * 0.995)
        spot_change = round(spot - spot_close, 2)
        spot_change_pct = round((spot_change / spot_close) * 100, 2)

        # Filter tracked strikes for this index
        index_strikes = [
            data for data in self.strike_oi_tracker.values()
            if data.index_name == index_name and data.strike > 0
        ]

        # Group by strike
        strikes_set = sorted(list(set(d.strike for d in index_strikes)))
        call_ois: Dict[float, int] = {}
        put_ois: Dict[float, int] = {}
        strike_rows = []

        total_call_oi = 0
        total_put_oi = 0
        total_call_vol = 0
        total_put_vol = 0

        # Determine ATM strike
        step = 50 if index_name == "NIFTY" else 100
        atm_strike = round(spot / step) * step

        for st in strikes_set:
            ce_data = next((d for d in index_strikes if d.strike == st and d.option_type == "CE"), None)
            pe_data = next((d for d in index_strikes if d.strike == st and d.option_type == "PE"), None)

            c_oi = ce_data.current_oi if ce_data else 0
            p_oi = pe_data.current_oi if pe_data else 0
            call_ois[st] = c_oi
            put_ois[st] = p_oi

            total_call_oi += c_oi
            total_put_oi += p_oi
            if ce_data:
                total_call_vol += ce_data.volume
            if pe_data:
                total_put_vol += pe_data.volume

            strike_rows.append({
                "strike": st,
                "is_atm": st == atm_strike,
                "call": ce_data.dict() if ce_data else None,
                "put": pe_data.dict() if pe_data else None
            })

        pcr = round(total_put_oi / (total_call_oi or 1), 2)
        max_pain = self.compute_max_pain(strikes_set, call_ois, put_ois) if strikes_set else atm_strike

        import datetime
        return OptionChainMatrix(
            index_name=index_name,
            spot_price=spot,
            spot_change=spot_change,
            spot_change_pct=spot_change_pct,
            pcr=pcr,
            max_pain=max_pain,
            atm_strike=atm_strike,
            total_call_oi=total_call_oi,
            total_put_oi=total_put_oi,
            total_call_volume=total_call_vol,
            total_put_volume=total_put_vol,
            updated_at=datetime.datetime.now().strftime("%H:%M:%S IST"),
            strikes=strike_rows
        )


analytics_engine = AnalyticsEngine()
