"""
OceanPulse - Harbor Wholesale Price Service
Provides wholesale fish prices across major Sri Lankan fishery harbors
(Peliyagoda Central, Beruwala, Negombo, Galle, Mirissa, Trincomalee, Tangalle)
and calculates net revenue optimization for landing harbor selection.
"""

from typing import Dict, List, Any
import random

# Major commercial species in Sri Lanka
FISH_SPECIES = [
    {
        "id": "yellowfin_tuna",
        "name_en": "Yellowfin Tuna",
        "name_si": "කෙලවල්ලා",
        "scientific_name": "Thunnus albacares",
        "base_price_lkr": 1850.0,
        "export_grade": True
    },
    {
        "id": "skipjack_tuna",
        "name_en": "Skipjack Tuna",
        "name_si": "බලයා",
        "scientific_name": "Katsuwonus pelamis",
        "base_price_lkr": 880.0,
        "export_grade": False
    },
    {
        "id": "sailfish",
        "name_en": "Sailfish / Marlin",
        "name_si": "තලපතා",
        "scientific_name": "Istiophorus platypterus",
        "base_price_lkr": 1450.0,
        "export_grade": True
    },
    {
        "id": "trevally",
        "name_en": "Trevally / Jack",
        "name_si": "පරව්",
        "scientific_name": "Caranx spp.",
        "base_price_lkr": 1150.0,
        "export_grade": False
    },
    {
        "id": "sardinella",
        "name_en": "Sardinella",
        "name_si": "හුරුල්ලා",
        "scientific_name": "Sardinella gibbosa",
        "base_price_lkr": 520.0,
        "export_grade": False
    },
    {
        "id": "tiger_prawns",
        "name_en": "Sea Tiger Prawns",
        "name_si": "මුහුදු ඉස්සෝ",
        "scientific_name": "Penaeus monodon",
        "base_price_lkr": 2400.0,
        "export_grade": True
    }
]

HARBOR_PROFILES = [
    {
        "id": "peliyagoda",
        "name": "Peliyagoda Central Market",
        "name_si": "පෑලියගොඩ මධ්‍යම මත්ස්‍ය වෙළඳසැල",
        "district": "Colombo",
        "lat": 6.9620,
        "lon": 79.8820,
        "premium_factor": 1.12,  # Central market commands highest urban retail/wholesale prices
        "daily_volume_tons": 185.0,
        "saturation": "Moderate",
        "is_landing_harbor": False  # Inland transit hub fed by coastal harbors
    },
    {
        "id": "beruwala",
        "name": "Beruwala Fishery Harbor",
        "name_si": "බේරුවල ධීවර වරාය",
        "district": "Kalutara",
        "lat": 6.4312,
        "lon": 79.9790,
        "premium_factor": 1.05,
        "daily_volume_tons": 92.0,
        "saturation": "Moderate",
        "is_landing_harbor": True
    },
    {
        "id": "negombo",
        "name": "Negombo Fishery Harbor",
        "name_si": "මීගමුව ධීවර වරාය",
        "district": "Gampaha",
        "lat": 7.2008,
        "lon": 79.8358,
        "premium_factor": 1.03,
        "daily_volume_tons": 115.0,
        "saturation": "High (Saturated)",
        "is_landing_harbor": True
    },
    {
        "id": "galle",
        "name": "Galle Fishery Harbor",
        "name_si": "ගාල්ල ධීවර වරාය",
        "district": "Galle",
        "lat": 6.0367,
        "lon": 80.2223,
        "premium_factor": 1.01,
        "daily_volume_tons": 68.0,
        "saturation": "Low",
        "is_landing_harbor": True
    },
    {
        "id": "mirissa",
        "name": "Mirissa Fishery Harbor",
        "name_si": "මිරිස්ස ධීවර වරාය",
        "district": "Matara",
        "lat": 5.9467,
        "lon": 80.4578,
        "premium_factor": 0.98,
        "daily_volume_tons": 84.0,
        "saturation": "Moderate",
        "is_landing_harbor": True
    },
    {
        "id": "trincomalee",
        "name": "Cod Bay Harbor (Trinco)",
        "name_si": "කොඩ් බේ ධීවර වරාය (ත්‍රිකුණාමලය)",
        "district": "Trincomalee",
        "lat": 8.5711,
        "lon": 81.2335,
        "premium_factor": 0.96,
        "daily_volume_tons": 45.0,
        "saturation": "Low",
        "is_landing_harbor": True
    },
    {
        "id": "tangalle",
        "name": "Tangalle Fishery Harbor",
        "name_si": "තංගල්ල ධීවර වරාය",
        "district": "Hambantota",
        "lat": 6.0242,
        "lon": 80.7936,
        "premium_factor": 0.97,
        "daily_volume_tons": 52.0,
        "saturation": "Low",
        "is_landing_harbor": True
    }
]


from datetime import date, datetime, timedelta
import math


class HarborService:
    @staticmethod
    def get_all_prices(date_str: str = None) -> Dict[str, Any]:
        """
        Returns wholesale price matrix across all major harbors and species.
        Dynamically updates daily based on the current date, computing 24-hour price trends.
        """
        if not date_str:
            date_str = date.today().isoformat()
        try:
            current_dt = datetime.strptime(date_str, "%Y-%m-%d").date()
        except Exception:
            current_dt = date.today()
            date_str = current_dt.isoformat()

        # Seed random using day timestamp for deterministic, realistic day-to-day variations
        seed_val = int(current_dt.strftime("%Y%m%d"))
        rnd = random.Random(seed_val)
        yesterday_rnd = random.Random(int((current_dt - timedelta(days=1)).strftime("%Y%m%d")))

        harbor_data = []

        for h in HARBOR_PROFILES:
            species_prices = []
            # Day fluctuation based on seasonal and daily market supply
            day_cycle = 1.0 + 0.04 * math.sin(current_dt.timetuple().tm_yday * 0.1)
            yest_cycle = 1.0 + 0.04 * math.sin((current_dt - timedelta(days=1)).timetuple().tm_yday * 0.1)

            # Daily landing volume variation (weather & day-of-week demand)
            volume_variance = rnd.uniform(-8.0, 10.0)
            daily_vol = round(max(20.0, h["daily_volume_tons"] + volume_variance), 1)

            for s in FISH_SPECIES:
                # Add harbor premium factor and daily species supply variance
                price = round(s["base_price_lkr"] * h["premium_factor"] * day_cycle + rnd.uniform(-35, 40), 0)
                yesterday_price = round(s["base_price_lkr"] * h["premium_factor"] * yest_cycle + yesterday_rnd.uniform(-35, 40), 0)
                diff = round(price - yesterday_price, 0)
                trend = "up" if diff > 5 else ("down" if diff < -5 else "stable")

                species_prices.append({
                    "species_id": s["id"],
                    "name_en": s["name_en"],
                    "name_si": s["name_si"],
                    "price_per_kg_lkr": int(price),
                    "change_lkr": int(diff),
                    "trend": trend,
                    "quality_grade": "Export Grade A" if s["export_grade"] else "Local Grade 1"
                })

            harbor_data.append({
                "harbor_id": h["id"],
                "name": h["name"],
                "name_si": h["name_si"],
                "district": h["district"],
                "lat": h["lat"],
                "lon": h["lon"],
                "daily_volume_tons": daily_vol,
                "market_saturation": h["saturation"],
                "is_landing_harbor": h["is_landing_harbor"],
                "prices": species_prices
            })

        return {
            "date": date_str,
            "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "currency": "LKR",
            "unit": "per kg",
            "harbors": harbor_data,
            "top_recommendation": {
                "highest_paying_harbor": "Peliyagoda Central Market (Hub)",
                "best_coastal_landing_harbor": "Beruwala Fishery Harbor",
                "insight": "Peliyagoda offers highest wholesale value for Yellowfin Tuna (+12%), while Beruwala offers lowest dock congestion and optimal buyer competition."
            }
        }

    @staticmethod
    def calculate_optimal_landing_harbor(
        catch_kg: Dict[str, float],
        current_vessel_lat: float,
        current_vessel_lon: float
    ) -> List[Dict[str, Any]]:
        """
        Calculates Net Profit = Gross Catch Value - Diesel Transit Cost
        to determine the most financially profitable harbor to dock.
        """
        all_prices = HarborService.get_all_prices()
        results = []

        from models.ocean_data import OceanDataEngine
        from routing.maritime_router import DIESEL_PRICE_LKR_PER_LITER, VESSEL_SPECS

        for h in all_prices["harbors"]:
            if not h["is_landing_harbor"]:
                continue

            dist_nm = OceanDataEngine.calculate_nautical_miles(
                current_vessel_lat, current_vessel_lon, h["lat"], h["lon"]
            )
            transit_hours = dist_nm / VESSEL_SPECS["cruising_speed_knots"]
            fuel_liters = transit_hours * VESSEL_SPECS["base_fuel_burn_lph"]
            fuel_cost_lkr = fuel_liters * DIESEL_PRICE_LKR_PER_LITER

            gross_revenue = 0.0
            price_map = {p["species_id"]: p["price_per_kg_lkr"] for p in h["prices"]}

            for species_id, kg in catch_kg.items():
                if species_id in price_map:
                    gross_revenue += kg * price_map[species_id]

            net_profit_lkr = gross_revenue - fuel_cost_lkr

            results.append({
                "harbor_id": h["harbor_id"],
                "harbor_name": h["name"],
                "harbor_name_si": h["name_si"],
                "distance_nm": round(dist_nm, 1),
                "transit_hours": round(transit_hours, 1),
                "fuel_liters_burned": round(fuel_liters, 1),
                "fuel_cost_lkr": round(fuel_cost_lkr, 0),
                "gross_revenue_lkr": round(gross_revenue, 0),
                "net_profit_lkr": round(net_profit_lkr, 0),
                "saturation": h["market_saturation"]
            })

        # Rank by net profit
        results.sort(key=lambda x: x["net_profit_lkr"], reverse=True)
        return results
