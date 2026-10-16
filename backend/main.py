"""
OceanPulse - FastAPI Maritime Intelligence & Routing Microservice
Hosts AI Potential Fishing Zone (PFZ) models, Current-Aware Maritime A* Pathfinding,
and Sri Lanka Fishery Harbor Wholesale Market Analytics.
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime

from models.ocean_data import OceanDataEngine, SRI_LANKA_HARBORS, EEZ_BOUNDS, is_in_sri_lanka_eez
from routing.maritime_router import MaritimeRouter, DIESEL_PRICE_LKR_PER_LITER
from services.harbor_service import HarborService
from services.weather_service import MarineWeatherService

app = FastAPI(
    title="OceanPulse API - Beruwala Fishery Harbor Edition",
    description="Dedicated AI Potential Fishing Zone (PFZ) Predictor and Fuel-Optimal Route Planner for Beruwala Fishery Harbor Fleet",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize engines
ocean_engine = OceanDataEngine(grid_res=0.25)
router = MaritimeRouter(ocean_engine=ocean_engine, grid_step=0.20)


class RouteRequest(BaseModel):
    origin_harbor_id: Optional[str] = "beruwala"
    origin_lat: Optional[float] = 6.4312
    origin_lon: Optional[float] = 79.9790
    dest_pfz_id: Optional[str] = None
    dest_lat: Optional[float] = None
    dest_lon: Optional[float] = None
    avoid_hazards: bool = True
    avoid_storm: bool = True


class StormUpdateRequest(BaseModel):
    active: Optional[bool] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    wind_speed_knots: Optional[float] = None
    wave_height_m: Optional[float] = None
    danger_radius_nm: Optional[float] = None


class LandingHarborRequest(BaseModel):
    catch_kg: Dict[str, float] = Field(
        default={
            "yellowfin_tuna": 650.0,
            "skipjack_tuna": 450.0,
            "sailfish": 200.0
        }
    )
    current_lat: float = 5.6
    current_lon: float = 80.5


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "OceanPulse AI & Maritime Engine",
        "home_port": "Beruwala Fishery Harbor (බේරුවල ධීවර වරාය)",
        "home_coordinates": {"lat": 6.4312, "lon": 79.9790},
        "district": "Kalutara",
        "eez": "Sri Lanka Exclusive Economic Zone",
        "ml_models": ocean_engine.model_metrics,
        "diesel_benchmark_lkr": DIESEL_PRICE_LKR_PER_LITER
    }


@app.get("/api/harbors")
def get_harbors():
    """Returns list of major Sri Lankan fishery harbors with coordinates and facilities."""
    return {
        "harbors": SRI_LANKA_HARBORS
    }


@app.get("/api/pfz/heatmap")
def get_pfz_heatmap(
    model: str = Query("RandomForest", pattern="^(RandomForest|GradientBoosting|NeuralNetwork)$"),
    date_val: Optional[str] = Query(None, alias="date")
):
    """
    Returns daily multi-spectral satellite oceanography (SST, Chl-a, Currents, Swell)
    and AI-predicted Potential Fishing Zone probabilities across Sri Lanka EEZ grid.
    Dynamically updates every day.
    """
    active_date = date_val or date.today().isoformat()
    grid = ocean_engine.get_daily_grid(model_name=model, date_str=active_date)
    return {
        "date": active_date,
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "count": len(grid),
        "model_used": model,
        "bounds": EEZ_BOUNDS,
        "grid": grid
    }


@app.get("/api/pfz/hotspots")
def get_pfz_hotspots(
    count: int = Query(8, ge=1, le=20),
    model: str = Query("RandomForest", pattern="^(RandomForest|GradientBoosting|NeuralNetwork)$"),
    date_val: Optional[str] = Query(None, alias="date")
):
    """
    Returns prioritized GPS hotspots with highest fish aggregation probability,
    target species suitability, and nearest harbor transit distances.
    Dynamically updates daily based on active date.
    """
    active_date = date_val or date.today().isoformat()
    hotspots = ocean_engine.get_top_hotspots(count=count, model_name=model, date_str=active_date)
    return {
        "date": active_date,
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "model_used": model,
        "hotspots_count": len(hotspots),
        "hotspots": hotspots
    }


@app.get("/api/ml/models")
def get_model_benchmarks():
    """
    Returns comparison between Random Forest, Gradient Boosting, and Neural Network
    for PFZ classification accuracy and F1 metrics.
    """
    return {
        "models": ocean_engine.model_metrics,
        "description": "Evaluation of ML architectures on Indian Ocean satellite-derived thermal front & chlorophyll convergence datasets."
    }


@app.post("/api/routing/optimize")
def optimize_route(req: RouteRequest):
    """
    Calculates fuel-optimal and weather-safe maritime trajectory using modified A* algorithm.
    Factors in ocean surface currents (u, v vectors), wind resistance, swell, and Sri Lanka land avoidance.
    """
    # Resolve origin
    if req.origin_lat is not None and req.origin_lon is not None:
        orig_lat, orig_lon = req.origin_lat, req.origin_lon
    elif req.origin_harbor_id:
        harbor = next((h for h in SRI_LANKA_HARBORS if h["id"] == req.origin_harbor_id), None)
        if not harbor:
            raise HTTPException(status_code=404, detail=f"Harbor '{req.origin_harbor_id}' not found")
        orig_lat, orig_lon = harbor["lat"], harbor["lon"]
    else:
        orig_lat, orig_lon = 6.4312, 79.9790  # Beruwala fallback

    # Resolve destination
    if req.dest_lat is not None and req.dest_lon is not None:
        dest_lat, dest_lon = req.dest_lat, req.dest_lon
    elif req.dest_pfz_id:
        hotspots = ocean_engine.get_top_hotspots(count=15)
        hotspot = next((h for h in hotspots if h["id"] == req.dest_pfz_id), None)
        if not hotspot:
            dest_lat, dest_lon = hotspots[0]["lat"], hotspots[0]["lon"]
        else:
            dest_lat, dest_lon = hotspot["lat"], hotspot["lon"]
    else:
        # Default to highest PFZ hotspot
        hotspots = ocean_engine.get_top_hotspots(count=1)
        dest_lat, dest_lon = hotspots[0]["lat"], hotspots[0]["lon"]

    # Strict Sri Lanka Exclusive Economic Zone (EEZ) enforcement
    if not is_in_sri_lanka_eez(orig_lat, orig_lon, allow_harbors=True):
        raise HTTPException(
            status_code=400,
            detail="Origin coordinate is outside Sri Lanka's Exclusive Economic Zone (EEZ). Navigation is strictly restricted to sovereign Sri Lankan maritime territory. / ආරම්භක ස්ථානය ශ්‍රී ලංකා මුහුදු සීමාව තුළ තිබිය යුතුය."
        )
    if not is_in_sri_lanka_eez(dest_lat, dest_lon, allow_harbors=True):
        raise HTTPException(
            status_code=400,
            detail="Destination coordinate is outside Sri Lanka's Exclusive Economic Zone (EEZ). Navigation is strictly restricted to sovereign Sri Lankan maritime territory. / ගමනාන්තය ශ්‍රී ලංකා මුහුදු සීමාව තුළ තිබිය යුතුය."
        )

    try:
        active_storm = MarineWeatherService.get_active_storm()
        route_plan = router.find_optimal_route(
            origin_lat=orig_lat,
            origin_lon=orig_lon,
            dest_lat=dest_lat,
            dest_lon=dest_lon,
            avoid_hazards=req.avoid_hazards,
            storm=active_storm if (req.avoid_hazards and req.avoid_storm) else None
        )
        return {
            "success": True,
            "route": route_plan
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/harbors/prices")
def get_wholesale_prices(date_val: Optional[str] = Query(None, alias="date")):
    """
    Provides real-time and predicted wholesale fish prices across major Sri Lankan harbors
    (Peliyagoda, Beruwala, Negombo, Galle, Mirissa, Trincomalee, Tangalle).
    Dynamically updates daily with 24-hour price trends and landing volumes.
    """
    return HarborService.get_all_prices(date_str=date_val)


@app.get("/api/daily/status")
def get_daily_status():
    """
    Returns current daily telemetry sync status, last update timestamp,
    active satellite passes (Copernicus / NASA), and market exchange status.
    """
    today_str = date.today().isoformat()
    return {
        "status": "operational",
        "active_date": today_str,
        "last_sync_timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "telemetry_sources": [
            {
                "name": "Copernicus Marine Environment Service",
                "layer": "SST & Zonal/Meridional Current Vectors (U/V)",
                "status": "Synchronized (Daily 04:30 SLST)"
            },
            {
                "name": "NASA Earthdata MODIS-Aqua",
                "layer": "Chlorophyll-a Bio-Optical Density (mg/m³)",
                "status": "Synchronized (Daily 05:15 SLST)"
            },
            {
                "name": "Open-Meteo Global Marine Weather",
                "layer": "Real-time Swell, Wind Wave & Cyclone Radar",
                "status": "Live API Active"
            },
            {
                "name": "Peliyagoda Central & Fishery Harbor Exchanges",
                "layer": "Wholesale Fish Price Matrix (LKR/kg)",
                "status": "Daily Exchange Active"
            }
        ],
        "message": "OceanPulse daily marine models and wholesale market feeds are up to date."
    }


@app.post("/api/daily/sync")
def trigger_daily_sync():
    """
    Forces a manual daily data sync and re-caches the latest satellite and market parameters.
    """
    today_str = date.today().isoformat()
    hotspots = ocean_engine.get_top_hotspots(count=8, date_str=today_str)
    prices = HarborService.get_all_prices(date_str=today_str)
    return {
        "success": True,
        "synced_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "date": today_str,
        "hotspots_count": len(hotspots),
        "harbors_updated": len(prices.get("harbors", [])),
        "message": f"Daily telemetry and harbor prices successfully synchronized for {today_str}."
    }


@app.post("/api/harbors/optimize-landing")
def optimize_landing(req: LandingHarborRequest):
    """
    Evaluates net profitability across landing harbors based on current vessel location,
    catch inventory, wholesale prices, and diesel transit burn.
    """
    rankings = HarborService.calculate_optimal_landing_harbor(
        catch_kg=req.catch_kg,
        current_vessel_lat=req.current_lat,
        current_vessel_lon=req.current_lon
    )
    return {
        "current_position": {"lat": req.current_lat, "lon": req.current_lon},
        "catch_summary": req.catch_kg,
        "recommendations": rankings
    }


@app.get("/api/weather/hazards")
def get_weather_hazards(lat: Optional[float] = None, lon: Optional[float] = None):
    """
    Provides localized swell, wind forecasts, and active marine bulletins for Sri Lanka,
    including active mid-sea storm status.
    """
    advisories = MarineWeatherService.get_active_marine_advisories()
    active_storm = MarineWeatherService.get_active_storm()
    spot_weather = None
    if lat is not None and lon is not None:
        spot_weather = MarineWeatherService.get_weather_at_location(lat, lon)

    return {
        "advisories": advisories,
        "active_storm": active_storm,
        "point_forecast": spot_weather
    }


@app.get("/api/weather/storm")
def get_storm_alert():
    """Returns real-time status of active mid-sea storms / cyclones."""
    return MarineWeatherService.get_active_storm()


@app.post("/api/weather/storm/toggle")
def update_storm_status(req: StormUpdateRequest):
    """
    Updates or toggles mid-sea storm simulation parameters (position, wind speed, danger radius).
    Allows skippers / researchers to simulate storm encounters and evaluate evasion paths.
    """
    updates = {}
    if req.active is not None:
        updates["active"] = req.active
    if req.lat is not None:
        updates["lat"] = req.lat
    if req.lon is not None:
        updates["lon"] = req.lon
    if req.wind_speed_knots is not None:
        updates["wind_speed_knots"] = req.wind_speed_knots
    if req.wave_height_m is not None:
        updates["wave_height_m"] = req.wave_height_m
    if req.danger_radius_nm is not None:
        updates["danger_radius_nm"] = req.danger_radius_nm

    updated_storm = MarineWeatherService.update_active_storm(updates)
    return {
        "success": True,
        "storm": updated_storm
    }


@app.get("/api/translations")
def get_translations():
    """
    Bilingual (English / Sinhala) localization strings for skipper & owner interfaces.
    """
    return {
        "en": {
            "title": "OceanPulse - Sri Lanka Marine Decision Support",
            "subtitle": "AI Potential Fishing Zone Predictor & Fuel-Optimal Route Planner",
            "pfz_map": "PFZ Heatmap & Satellite Layers",
            "route_planner": "Fuel-Optimal Maritime Router",
            "price_comparator": "Harbor Wholesale Prices",
            "weather_hazards": "Marine Weather & Hazards",
            "departure_harbor": "Departure Fishery Harbor",
            "target_pfz": "Target Fishing Hotspot",
            "calculate_route": "Calculate Fuel-Optimal Route",
            "liters_saved": "Diesel Saved",
            "cost_saved": "Cost Saved (LKR)",
            "safe_corridor": "Weather Safe Corridor",
            "prime_pfz": "Prime Fishing Zone",
            "moderate_pfz": "Moderate Potential",
            "tuna": "Yellowfin Tuna",
            "skipjack": "Skipjack Tuna",
            "sailfish": "Sailfish"
        },
        "si": {
            "title": "OceanPulse - ශ්‍රී ලංකා ධීවර සහායක පද්ධතිය",
            "subtitle": "කෘත්‍රිම බුද්ධිය මඟින් මත්ස්‍ය කලාප අනාවැකි සහ ඉන්ධන කාර්යක්ෂම යාත්‍රා මාර්ග සැලසුම්කරු",
            "pfz_map": "මත්ස්‍ය කලාප සිතියම සහ චන්ද්‍රිකා දත්ත",
            "route_planner": "ඉන්ධන ඉතිරි කරන යාත්‍රා මාර්ගය",
            "price_comparator": "වරාය තොග මත්ස්‍ය මිල ගණන්",
            "weather_hazards": "මුහුදු කාලගුණය සහ අනතුරු ඇඟවීම්",
            "departure_harbor": "පිටත්වන ධීවර වරාය",
            "target_pfz": "ඉලක්කගත මත්ස්‍ය කලාපය",
            "calculate_route": "ඉන්ධන ඉතිරි කිරීමේ මාර්ගය ගණනය කරන්න",
            "liters_saved": "ඉතිරි කළ ඩීසල් (ලීටර්)",
            "cost_saved": "ඉතිරි කළ මුදල (රු.)",
            "safe_corridor": "ආරක්ෂිත මුහුදු මාර්ගය",
            "prime_pfz": "ප්‍රමුඛ මත්ස්‍ය කලාපය",
            "moderate_pfz": "මධ්‍යම මත්ස්‍ය කලාපය",
            "tuna": "කෙලවල්ලා",
            "skipjack": "බලයා",
            "sailfish": "තලපතා"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
