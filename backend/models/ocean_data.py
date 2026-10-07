"""
OceanPulse - Oceanographic Data Engine & PFZ Predictor
Simulates multi-spectral satellite oceanography (SST, Chlorophyll-a, Ocean Currents, Wave, Wind)
for the Sri Lankan Exclusive Economic Zone (EEZ) and predicts Potential Fishing Zones (PFZs).
"""

import math
from datetime import date, datetime
import numpy as np
from typing import Dict, List, Any, Tuple
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, f1_score

# Sri Lanka EEZ geographic boundaries
EEZ_BOUNDS = {
    "min_lat": 4.6,
    "max_lat": 10.4,
    "min_lon": 78.6,
    "max_lon": 83.8,
}

# Major Fishery Harbors in Sri Lanka with exact maritime coordinates
SRI_LANKA_HARBORS = [
    {"id": "beruwala", "name": "Beruwala Harbor", "lat": 6.4312, "lon": 79.9790, "district": "Kalutara", "capacity": "Multi-day / 350 boats"},
    {"id": "mirissa", "name": "Mirissa Fishery Harbor", "lat": 5.9467, "lon": 80.4578, "district": "Matara", "capacity": "Multi-day / 300 boats"},
    {"id": "negombo", "name": "Negombo Fishery Harbor", "lat": 7.2008, "lon": 79.8358, "district": "Gampaha", "capacity": "Day & Multi-day / 450 boats"},
    {"id": "galle", "name": "Galle Fishery Harbor", "lat": 6.0367, "lon": 80.2223, "district": "Galle", "capacity": "Multi-day / 280 boats"},
    {"id": "trincomalee", "name": "Cod Bay Harbor (Trincomalee)", "lat": 8.5711, "lon": 81.2335, "district": "Trincomalee", "capacity": "Deep sea / 200 boats"},
    {"id": "tangalle", "name": "Tangalle Fishery Harbor", "lat": 6.0242, "lon": 80.7936, "district": "Hambantota", "capacity": "Multi-day / 220 boats"},
    {"id": "kalpitiya", "name": "Kalpitiya Fishery Anchor", "lat": 8.2289, "lon": 79.7618, "district": "Puttalam", "capacity": "Coastal / 180 boats"},
    {"id": "dondra", "name": "Dondra Fishery Harbor", "lat": 5.9234, "lon": 80.5901, "district": "Matara", "capacity": "Multi-day / 150 boats"},
    {"id": "peliyagoda", "name": "Peliyagoda Central Market (Hub)", "lat": 6.9620, "lon": 79.8820, "district": "Colombo", "capacity": "National Wholesale Exchange"}
]

# Sri Lanka main island land polygon approximation for collision avoidance in routing
# (Simplified convex hull / perimeter points to ensure vessels navigate maritime waters)
SL_LAND_POLYGON = [
    (9.83, 80.05), (9.80, 80.25), (9.50, 80.45), (9.20, 80.85),
    (8.85, 81.25), (8.58, 81.25), (8.15, 81.45), (7.70, 81.70),
    (7.30, 81.85), (6.90, 81.88), (6.45, 81.75), (6.25, 81.50),
    (6.05, 81.15), (5.92, 80.59), (5.95, 80.45), (6.03, 80.21),
    (6.43, 79.98), (6.93, 79.84), (7.21, 79.83), (7.58, 79.80),
    (8.00, 79.78), (8.35, 79.80), (8.80, 79.85), (9.15, 79.90),
    (9.50, 79.95), (9.83, 80.05)
]

# Official Sri Lanka Exclusive Economic Zone (EEZ) Polygon
# Comprises UNCLOS 200 Nautical Mile Outer Limits and the 1974/1976 Historic Waters Agreements (Indo-Sri Lanka Maritime Boundary)
SRI_LANKA_EEZ_POLYGON = [
    # 1. Northern maritime boundary / Palk Strait (1974 Treaty median line with India)
    (10.08, 80.05),
    (9.75, 79.88),
    (9.35, 79.55),
    # 2. Adam's Bridge / Gulf of Mannar median line (1976 Treaty)
    (9.10, 79.52),
    (8.65, 79.05),
    (8.00, 78.60),
    (7.00, 78.20),
    (6.00, 78.10),
    # 3. Southwest 200 NM Deep Ocean EEZ limit
    (5.00, 78.30),
    (4.60, 79.00),
    # 4. Southern 200 NM Deep Ocean EEZ limit (South of Dondra Head)
    (4.40, 80.00),
    (4.40, 81.20),
    (4.70, 82.20),
    # 5. Southeast 200 NM Outer Limit (Great Basses Offshore)
    (5.40, 83.30),
    (6.50, 84.10),
    # 6. Eastern Bay of Bengal 200 NM Outer Limit
    (7.80, 84.50),
    (8.80, 84.30),
    (9.60, 83.80),
    # 7. Northeast Outer Limit turning back to Point Pedro
    (10.30, 83.00),
    (10.60, 82.00),
    (10.45, 81.10),
    (10.08, 80.05)
]

def is_point_in_polygon(lat: float, lon: float, poly: List[Tuple[float, float]]) -> bool:
    """Ray-casting algorithm to test if (lat, lon) is inside the polygon."""
    n = len(poly)
    inside = False
    p1_lat, p1_lon = poly[0]
    for i in range(1, n + 1):
        p2_lat, p2_lon = poly[i % n]
        if min(p1_lon, p2_lon) < lon <= max(p1_lon, p2_lon):
            # Compute intersection latitude
            lat_intersect = p1_lat + (lon - p1_lon) * (p2_lat - p1_lat) / (p2_lon - p1_lon)
            if lat < lat_intersect:
                inside = not inside
        p1_lat, p1_lon = p2_lat, p2_lon
    return inside

def is_in_sri_lanka_eez(lat: float, lon: float, allow_harbors: bool = True) -> bool:
    """
    Returns True ONLY if coordinates are strictly within Sri Lanka's 
    Exclusive Economic Zone (EEZ) and outside the island landmass (or at a recognized harbor).
    Strictly prevents vessels, hotspots, and weather entities from crossing into
    foreign territorial waters (e.g. India) or unregulated high seas.
    """
    # 1. Must be inside the official Sri Lanka EEZ maritime boundary (UNCLOS 200 NM & 1974/1976 median lines)
    if not is_point_in_polygon(lat, lon, SRI_LANKA_EEZ_POLYGON):
        return False

    # 2. Check if coordinate is a recognized Sri Lankan fishery harbor on coast
    if allow_harbors:
        for h in SRI_LANKA_HARBORS:
            if math.sqrt((lat - h["lat"])**2 + (lon - h["lon"])**2) < 0.08:
                return True

    # 3. Must not be on Sri Lanka land
    if is_point_in_polygon(lat, lon, SL_LAND_POLYGON):
        return False

    # 4. Pamban / Mannar shallow causeway bridge restriction
    if 9.0 <= lat <= 9.3 and 79.0 <= lon <= 79.7:
        return False

    return True

def is_water(lat: float, lon: float) -> bool:
    """Checks if point is navigable ocean water strictly within Sri Lanka's EEZ."""
    return is_in_sri_lanka_eez(lat, lon, allow_harbors=False)


class OceanDataEngine:
    def __init__(self, grid_res: float = 0.2):
        """
        grid_res: Grid resolution in degrees (~22 km at 0.2 deg).
        """
        self.grid_res = grid_res
        self.lats = np.arange(EEZ_BOUNDS["min_lat"], EEZ_BOUNDS["max_lat"], grid_res)
        self.lons = np.arange(EEZ_BOUNDS["min_lon"], EEZ_BOUNDS["max_lon"], grid_res)
        self.rf_model = None
        self.gb_model = None
        self.nn_model = None
        self.model_metrics = {}
        self._initialize_and_train_models()

    def _generate_synthetic_oceanography(self, seed: int = None, date_str: str = None) -> np.ndarray:
        """
        Generates realistic oceanographic fields for the Sri Lankan EEZ.
        Dynamically updates every day based on the calendar date (or date_str).
        Simulates:
        - SST (°C) with dynamic daily upwelling front shifts
        - Chlorophyll-a (mg/m³) with shifting plankton convergence blooms
        - Ocean Currents: U, V components (m/s) with seasonal and tidal variations
        - Wave height (m) and wind speed (knots)
        """
        if not date_str:
            date_str = date.today().isoformat()
        try:
            current_dt = datetime.strptime(date_str, "%Y-%m-%d").date()
        except Exception:
            current_dt = date.today()
            date_str = current_dt.isoformat()

        if seed is None:
            # Deterministic daily seed so the data is stable during the day but changes daily
            seed = int(current_dt.strftime("%Y%m%d")) % (2**31 - 1)
        np.random.seed(seed)

        # Day of year influences current drift and upwelling eddy position
        day_of_year = current_dt.timetuple().tm_yday
        # Cyclonic eddy center shifts slightly day by day (~2-5 km per day)
        south_lat_offset = 0.12 * math.sin(day_of_year * 0.15)
        south_lon_offset = 0.15 * math.cos(day_of_year * 0.12)
        east_lat_offset = 0.10 * math.cos(day_of_year * 0.18)
        east_lon_offset = 0.12 * math.sin(day_of_year * 0.14)

        grid_points = []

        for lat in self.lats:
            for lon in self.lons:
                water = is_water(lat, lon)
                if not water:
                    continue

                # Distance to south coast upwelling epicenter (~5.8N, 80.5E off Dondra/Mirissa) with daily drift
                d_south_upwell = math.sqrt((lat - (5.8 + south_lat_offset))**2 + (lon - (80.5 + south_lon_offset))**2)
                # Distance to east coast cold eddy (~8.2N, 81.8E off Trincomalee/Batticaloa) with daily drift
                d_east_eddy = math.sqrt((lat - (8.2 + east_lat_offset))**2 + (lon - (81.8 + east_lon_offset))**2)
                # Distance to Gulf of Mannar (~8.6N, 79.3E)
                d_mannar = math.sqrt((lat - 8.6)**2 + (lon - 79.3)**2)

                # Base SST ~28.5C to 29.8C with upwelling cooling
                sst_base = 29.2 + 0.3 * math.sin(lat * 0.8) - 0.2 * math.cos(lon * 0.5)
                # Upwelling cools waters by up to 1.8°C creating strong thermal fronts
                sst_cooling = 1.4 * math.exp(- (d_south_upwell / 0.8)**2) + 1.1 * math.exp(- (d_east_eddy / 0.7)**2)
                sst = round(sst_base - sst_cooling + np.random.normal(0, 0.12), 2)

                # Chlorophyll-a (mg/m3): High in upwelling and near continental shelf
                chl_upwell = 2.2 * math.exp(- (d_south_upwell / 0.9)**2) + 1.8 * math.exp(- (d_east_eddy / 0.8)**2) + 1.5 * math.exp(- (d_mannar / 0.7)**2)
                chl_base = 0.22 + 0.15 * math.sin(lon * 0.3)
                chl = round(max(0.08, chl_base + chl_upwell + np.random.normal(0, 0.08)), 3)

                # Ocean Surface Currents (U: zonal eastward, V: meridional northward)
                # Southwest Monsoon Current flows eastward south of Sri Lanka with cyclonic curl
                u_current = 0.45 * math.sin((lat - 5.5) * 1.2) + 0.35 + np.random.normal(0, 0.05)
                v_current = -0.30 * math.cos((lon - 80.0) * 1.1) + np.random.normal(0, 0.05)
                current_speed = round(math.sqrt(u_current**2 + v_current**2), 2)

                # Wave Swell Height (meters)
                # Open Indian Ocean to the south has higher swell (2.0 - 3.2m), Gulf of Mannar sheltered (0.8 - 1.4m)
                swell = round(1.2 + 1.2 * max(0, (7.0 - lat) / 2.5) + 0.3 * math.sin(lon) + np.random.normal(0, 0.1), 2)
                swell = max(0.6, swell)

                # Wind Speed (knots)
                wind = round(12.0 + 8.0 * max(0, (6.8 - lat) / 2.0) + np.random.normal(0, 1.2), 1)
                wind = max(5.0, wind)

                # Dissolved Oxygen (mg/L)
                do = round(5.2 + 0.8 * (chl / 2.0) - 0.2 * (sst - 28.0) + np.random.normal(0, 0.1), 2)

                # Depth / Bathymetry category (meters approximation)
                dist_to_coast = min(math.sqrt((lat - clat)**2 + (lon - clon)**2) for clat, clon in SL_LAND_POLYGON)
                depth = round(150 + dist_to_coast * 2200 + np.random.normal(0, 50), 0)

                grid_points.append({
                    "lat": round(lat, 3),
                    "lon": round(lon, 3),
                    "sst": sst,
                    "chlorophyll": chl,
                    "u_current": round(u_current, 3),
                    "v_current": round(v_current, 3),
                    "current_speed": current_speed,
                    "swell_m": swell,
                    "wind_knots": wind,
                    "dissolved_oxygen": do,
                    "depth_m": depth
                })

        return grid_points

    def _calculate_gradients(self, grid_points: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Calculates local spatial gradients: |∇SST| (Thermal Front Index) and |∇Chl-a|.
        Oceanographic literature shows tuna and pelagic schools aggregate precisely along
        thermal boundaries where |∇SST| > 0.4 °C / 10km.
        """
        # Create lookup map
        lookup = {(p["lat"], p["lon"]): p for p in grid_points}

        for p in grid_points:
            lat = p["lat"]
            lon = p["lon"]
            res = self.grid_res

            # Neighbors
            p_north = lookup.get((round(lat + res, 3), lon))
            p_south = lookup.get((round(lat - res, 3), lon))
            p_east = lookup.get((lat, round(lon + res, 3)))
            p_west = lookup.get((lat, round(lon - res, 3)))

            # SST gradient
            d_sst_lat = (p_north["sst"] - p_south["sst"]) / (2 * res) if (p_north and p_south) else 0.0
            d_sst_lon = (p_east["sst"] - p_west["sst"]) / (2 * res) if (p_east and p_west) else 0.0
            grad_sst = round(math.sqrt(d_sst_lat**2 + d_sst_lon**2), 3)

            # Chl gradient
            d_chl_lat = (p_north["chlorophyll"] - p_south["chlorophyll"]) / (2 * res) if (p_north and p_south) else 0.0
            d_chl_lon = (p_east["chlorophyll"] - p_west["chlorophyll"]) / (2 * res) if (p_east and p_west) else 0.0
            grad_chl = round(math.sqrt(d_chl_lat**2 + d_chl_lon**2), 3)

            p["grad_sst"] = grad_sst
            p["grad_chl"] = grad_chl

        return grid_points

    def _initialize_and_train_models(self):
        """
        Trains and compares 3 ML models (Random Forest, Gradient Boosting, MLP Neural Network)
        using oceanographic features to predict Potential Fishing Zone presence.
        """
        # Synthetic historical training dataset representing Sri Lankan catch logs
        np.random.seed(101)
        n_samples = 2200

        # Features: [sst, chlorophyll, grad_sst, grad_chl, current_speed, depth_m, dissolved_oxygen]
        sst_train = np.random.uniform(26.8, 30.8, n_samples)
        chl_train = np.random.uniform(0.1, 4.2, n_samples)
        grad_sst_train = np.random.exponential(0.35, n_samples)
        grad_chl_train = np.random.exponential(0.40, n_samples)
        curr_speed_train = np.random.uniform(0.1, 1.4, n_samples)
        depth_train = np.random.uniform(50, 4000, n_samples)
        do_train = np.random.uniform(3.8, 6.5, n_samples)

        X = np.column_stack([
            sst_train, chl_train, grad_sst_train, grad_chl_train,
            curr_speed_train, depth_train, do_train
        ])

        # Ground truth label: 1 if conditions match pelagic aggregation zones
        # Biological rules:
        # - SST between 27.5 and 29.5
        # - High thermal front grad_sst > 0.45
        # - Chlorophyll optimal between 0.35 and 2.5
        # - Dissolved oxygen > 4.5
        # - Favorable current eddies (0.3 - 1.1 m/s)
        tuna_score = (
            1.8 * (grad_sst_train > 0.42) +
            1.5 * ((chl_train >= 0.35) & (chl_train <= 2.8)) +
            1.3 * ((sst_train >= 27.6) & (sst_train <= 29.4)) +
            0.8 * (do_train > 4.6) +
            0.6 * ((curr_speed_train >= 0.3) & (curr_speed_train <= 1.0)) +
            np.random.normal(0, 0.45, n_samples)
        )
        y = (tuna_score >= 3.6).astype(int)

        split = int(n_samples * 0.8)
        X_train, X_test = X[:split], X[split:]
        y_train, y_test = y[:split], y[split:]

        # 1. Random Forest Classifier
        self.rf_model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
        self.rf_model.fit(X_train, y_train)
        rf_pred = self.rf_model.predict(X_test)

        # 2. Gradient Boosting (XGBoost / HistGB equivalent)
        self.gb_model = HistGradientBoostingClassifier(max_iter=100, max_depth=6, random_state=42)
        self.gb_model.fit(X_train, y_train)
        gb_pred = self.gb_model.predict(X_test)

        # 3. Neural Network (MLP)
        self.nn_model = MLPClassifier(hidden_layer_sizes=(32, 16), max_iter=250, random_state=42)
        self.nn_model.fit(X_train, y_train)
        nn_pred = self.nn_model.predict(X_test)

        self.model_metrics = {
            "RandomForest": {
                "accuracy": round(float(accuracy_score(y_test, rf_pred)), 4),
                "f1_score": round(float(f1_score(y_test, rf_pred)), 4),
                "is_active": True
            },
            "GradientBoosting": {
                "accuracy": round(float(accuracy_score(y_test, gb_pred)), 4),
                "f1_score": round(float(f1_score(y_test, gb_pred)), 4),
                "is_active": False
            },
            "NeuralNetwork": {
                "accuracy": round(float(accuracy_score(y_test, nn_pred)), 4),
                "f1_score": round(float(f1_score(y_test, nn_pred)), 4),
                "is_active": False
            }
        }

    def get_daily_grid(self, model_name: str = "RandomForest", date_str: str = None) -> List[Dict[str, Any]]:
        """
        Generates daily satellite oceanographic grid and predicts PFZ probabilities for the given date.
        """
        raw_grid = self._generate_synthetic_oceanography(date_str=date_str)
        grid = self._calculate_gradients(raw_grid)

        # Select model
        active_model = self.rf_model
        if model_name == "GradientBoosting":
            active_model = self.gb_model
        elif model_name == "NeuralNetwork":
            active_model = self.nn_model

        features = np.array([
            [
                p["sst"], p["chlorophyll"], p.get("grad_sst", 0.0),
                p.get("grad_chl", 0.0), p["current_speed"], p["depth_m"], p["dissolved_oxygen"]
            ]
            for p in grid
        ])

        # Predict probability of being a PFZ hotspot
        probs = active_model.predict_proba(features)[:, 1]

        for i, p in enumerate(grid):
            prob = float(probs[i])
            p["pfz_probability"] = round(prob, 3)
            p["pfz_percentage"] = int(round(prob * 100))

            # Qualitative class & recommended target species
            if prob >= 0.75:
                p["category"] = "Prime PFZ"
                p["species"] = ["Yellowfin Tuna (කෙලවල්ලා)", "Skipjack Tuna (බලයා)", "Sailfish (තලපතා)"]
                p["cpue_index"] = round(2.8 + prob * 1.5, 1)  # Catch per unit effort multiplier
            elif prob >= 0.50:
                p["category"] = "Moderate PFZ"
                p["species"] = ["Skipjack Tuna (බලයා)", "Trevally / Paraw (පරව්)", "Mahi-Mahi"]
                p["cpue_index"] = round(1.5 + prob * 1.0, 1)
            elif prob >= 0.30:
                p["category"] = "Low Potential"
                p["species"] = ["Coastal Pelagics", "Sardinella (හුරුල්ලා)"]
                p["cpue_index"] = 1.0
            else:
                p["category"] = "Unproductive Water"
                p["species"] = []
                p["cpue_index"] = 0.4

        return grid

    def get_top_hotspots(self, count: int = 8, model_name: str = "RandomForest", date_str: str = None) -> List[Dict[str, Any]]:
        """
        Returns top PFZ hotspots sorted by probability for the requested date, filtered for spatial diversity.
        """
        if not date_str:
            date_str = date.today().isoformat()

        grid = self.get_daily_grid(model_name=model_name, date_str=date_str)
        sorted_grid = sorted(grid, key=lambda x: x["pfz_probability"], reverse=True)

        hotspots = []
        for p in sorted_grid:
            # Check minimum distance to already selected hotspots for geographical spread
            too_close = False
            for h in hotspots:
                dist = math.sqrt((p["lat"] - h["lat"])**2 + (p["lon"] - h["lon"])**2)
                if dist < 0.45:  # ~50km separation
                    too_close = True
                    break
            if not too_close:
                hotspots.append({
                    "id": f"pfz-{len(hotspots)+1}",
                    "lat": p["lat"],
                    "lon": p["lon"],
                    "date": date_str,
                    "pfz_probability": p["pfz_probability"],
                    "pfz_percentage": p["pfz_percentage"],
                    "sst": p["sst"],
                    "chlorophyll": p["chlorophyll"],
                    "grad_sst": p["grad_sst"],
                    "current_speed": p["current_speed"],
                    "swell_m": p["swell_m"],
                    "wind_knots": p["wind_knots"],
                    "depth_m": p["depth_m"],
                    "category": p["category"],
                    "species": p["species"],
                    "cpue_index": p["cpue_index"],
                    "distance_from_beruwala_nm": round(self.calculate_nautical_miles(p["lat"], p["lon"], 6.4312, 79.9790), 1),
                    "home_port": "Beruwala Fishery Harbor (බේරුවල ධීවර වරාය)",
                    "nearest_harbors": self._find_nearest_harbors(p["lat"], p["lon"])
                })
            if len(hotspots) >= count:
                break

        return hotspots

    def _find_nearest_harbors(self, lat: float, lon: float) -> List[Dict[str, Any]]:
        """Finds distances (nautical miles) to major fishery harbors."""
        results = []
        for h in SRI_LANKA_HARBORS:
            if h["id"] == "peliyagoda":
                continue
            # Haversine distance in nautical miles
            d_nm = self.calculate_nautical_miles(lat, lon, h["lat"], h["lon"])
            results.append({
                "harbor_id": h["id"],
                "harbor_name": h["name"],
                "distance_nm": round(d_nm, 1)
            })
        return sorted(results, key=lambda x: x["distance_nm"])[:3]

    @staticmethod
    def calculate_nautical_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Great-circle distance in nautical miles (1 NM = 1.852 km)."""
        r_km = 6371.0
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlam = math.radians(lon2 - lon1)

        a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        km = r_km * c
        return km / 1.852
