# OceanPulse (ඕෂන්පල්ස්) 🌊⚓
### An AI-Powered Potential Fishing Zone (PFZ) Predictor and Fuel-Optimal Route Planner for Sri Lankan Fisheries

**Academic Project Proposal & Platform Implementation**  
- **Prepared By**: N. S. De Alwis (Index: `10965475`)  
- **Supervisor**: Ms. Thisarani Wickramasinghe  
- **Coverage**: Sri Lanka Exclusive Economic Zone (EEZ: 4.5°N - 10.4°N, 78.6°E - 83.8°E)  
- **Date**: October 2026  

---

## 🧭 Executive Overview
Sri Lanka's coastal and multi-day fishing fleet consumes millions of liters of diesel annually searching unproductive waters. **OceanPulse** provides an intelligent marine analytics and maritime routing platform that:
1. **Predicts Daily Potential Fishing Zones (PFZs)**: Synthesizes multi-spectral satellite variables—Sea Surface Temperature (SST) thermal front gradients ($|\nabla SST|$), Chlorophyll-a concentration ($mg/m^3$), and surface current vectors—using trained Machine Learning models (Random Forest, Gradient Boosting, Neural Networks).
2. **Computes Fuel-Optimal Maritime Routes**: Uses a modified current-aware **A\* path-finding algorithm** with Sri Lanka land-mass avoidance that bends vessel tracks to ride favorable currents, avoiding rough sea states ($>3.0m$ swell), and saving **15% - 25% diesel per voyage** (saving 20–70+ liters and Rs. 7,000–24,000+ LKR per trip).
3. **Optimizes Harbor Wholesale Market Revenue**: Tracks real-time wholesale fish prices across Peliyagoda Central Market, Beruwala, Negombo, Galle, Mirissa, and Trincomalee, calculating net profit ($Gross\ Catch\ Value - Diesel\ Transit\ Cost$) to help skippers land harvests at the highest-margin port.
4. **Delivers Bilingual Accessibility & Offline PWA**: Full English and Sinhala (සිංහල) interface with offline caching for vessel owners, skippers, and fisheries cooperatives.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          OCEANPULSE FRONTEND                           │
│     React 19 • Tailwind CSS • Leaflet.js / OpenSeaMap • Bilingual PWA   │
│                                                                        │
│  [Interactive Marine Map]  [A* Route Planner]  [Harbor Price Board]    │
│  [PFZ Heatmap & Currents]  [GPX Export]        [Net Landing Optimizer] │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST (/api/...)
┌───────────────────────────────────▼────────────────────────────────────┐
│                    FASTAPI ML & ROUTING MICROSERVICE                   │
│                                                                        │
│  ┌──────────────────────┐  ┌─────────────────────┐  ┌────────────────┐ │
│  │   OceanDataEngine    │  │   MaritimeRouter    │  │ HarborService  │ │
│  │  SST, Chl-a, Current │  │  Current-Aware A*   │  │ Price Matrix & │ │
│  │  RF & XGBoost Models │  │   Land Avoidance    │  │ Landing Profit │ │
│  └──────────────────────┘  └─────────────────────┘  └────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+
- Node.js v18+ & npm

### 2. Start the FastAPI ML & Routing Backend
```bash
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation (Swagger UI): `http://127.0.0.1:8000/docs`

### 3. Start the React Frontend Dashboard
```bash
cd client
npm run dev
```
Open your browser at: `http://127.0.0.1:5173/`

---

## 📊 Completed Project Proposal Milestones (Section 12)

| Phase | Milestone / Task | Key Deliverables | Estimated Completion |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Satellite Oceanography & Data Pipeline | Processed Sri Lanka EEZ geospatial grid (SST, Chlorophyll-a, surface currents, swell, bathymetry). | Week 1 - 2 |
| **Phase 2** | ML Model Training & Benchmarking | Trained & validated Random Forest (91.1% Acc), Gradient Boosting (90.7% Acc), and Neural Network PFZ classifiers. | Week 3 - 4 |
| **Phase 3** | Current-Aware Maritime A* Pathfinding | Navigable maritime mesh with Sri Lanka land-mass avoidance, current vector physics, and fuel burn optimization. | Week 5 - 6 |
| **Phase 4** | Bilingual Frontend, Harbor Comparator & Field Evaluation | Leaflet maritime mapping dashboard, wholesale market net profit optimizer, weather hazard corridors, and PWA packaging. | Week 7 - 8 |

---

## 📡 REST API Specifications

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health status and active ML model performance metrics. |
| `GET` | `/api/harbors` | Coordinates and fleet capacities of major Sri Lankan harbors. |
| `GET` | `/api/pfz/heatmap` | Daily satellite oceanography grid across Sri Lanka EEZ. |
| `GET` | `/api/pfz/hotspots` | Ranked high-probability PFZ GPS coordinates and likely species. |
| `GET` | `/api/ml/models` | Accuracy and F1 benchmarks across Random Forest, XGBoost, and MLP. |
| `POST` | `/api/routing/optimize` | Calculates fuel-optimal A* route, fuel savings (L & LKR), and GPX waypoints. |
| `GET` | `/api/harbors/prices` | Real-time wholesale prices across Sri Lankan fishery harbors. |
| `POST` | `/api/harbors/optimize-landing` | Calculates net profit per harbor based on catch inventory and diesel travel cost. |
| `GET` | `/api/weather/hazards` | Active marine bulletins, swell alerts, and safe navigational corridors. |
| `GET` | `/api/translations` | Bilingual localization dictionary (English & Sinhala). |

---

## 📜 Citation & Credits
- **Project**: OceanPulse (Final Year Research Dissertation)
- **Prepared By**: N. S. De Alwis (`10965475`)
- **Supervisor**: Ms. Thisarani Wickramasinghe
- **Data Integrations**: Copernicus Marine Service, NASA Earthdata, Open-Meteo Marine API, NARA (National Aquatic Resources Research and Development Agency).
