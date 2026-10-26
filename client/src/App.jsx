import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MaritimeMap from './components/MaritimeMap';
import RoutePlannerPanel from './components/RoutePlannerPanel';
import HarborPricesView from './components/HarborPricesView';
import WeatherAlertsView from './components/WeatherAlertsView';
import MLBenchmarksView from './components/MLBenchmarksView';
import StormAlertBanner from './components/StormAlertBanner';
import {
  SRI_LANKA_HARBORS,
  INITIAL_HOTSPOTS,
  INITIAL_HARBOR_PRICES,
  INITIAL_WEATHER_ADVISORIES,
  INITIAL_STORM_ALERT,
  TRANSLATIONS
} from './data/mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [lang, setLang] = useState('en');
  const t = TRANSLATIONS[lang];

  // Data states
  const [harbors, setHarbors] = useState(SRI_LANKA_HARBORS);
  const [hotspots, setHotspots] = useState(INITIAL_HOTSPOTS);
  const [pricesData, setPricesData] = useState(INITIAL_HARBOR_PRICES);
  const [weatherData, setWeatherData] = useState({ advisories: INITIAL_WEATHER_ADVISORIES });
  const [storm, setStorm] = useState(INITIAL_STORM_ALERT);
  const [modelsData, setModelsData] = useState(null);
  const [isLiveBackend, setIsLiveBackend] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);

  // Router selection states
  const [selectedHarbor, setSelectedHarbor] = useState(SRI_LANKA_HARBORS[0]); // Beruwala
  const [selectedHotspot, setSelectedHotspot] = useState(INITIAL_HOTSPOTS[0]); // Hotspot #1
  const [avoidHazards, setAvoidHazards] = useState(true);
  const [activeLayer, setActiveLayer] = useState('pfz');
  const [showBaselineRoute, setShowBaselineRoute] = useState(false);
  const [activeModel, setActiveModel] = useState('RandomForest');

  // Route calculation result
  const [activeRoute, setActiveRoute] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Manual & automated daily sync handler
  const handleDailySync = async () => {
    setIsSyncing(true);
    try {
      const syncRes = await fetch('/api/daily/sync', { method: 'POST' });
      if (syncRes.ok) {
        const syncData = await syncRes.json();
        if (syncData.date) setDailyDate(syncData.date);
      }
      // Re-fetch all dynamic daily layers
      const [spotsRes, pricesRes, weatherRes] = await Promise.all([
        fetch(`/api/pfz/hotspots?model=${activeModel}`),
        fetch('/api/harbors/prices'),
        fetch('/api/weather/hazards')
      ]);
      if (spotsRes.ok) {
        const sData = await spotsRes.json();
        if (sData.hotspots && sData.hotspots.length > 0) {
          setHotspots(sData.hotspots);
          setSelectedHotspot(sData.hotspots[0]);
        }
      }
      if (pricesRes.ok) {
        const pData = await pricesRes.json();
        setPricesData(pData);
      }
      if (weatherRes.ok) {
        const wData = await weatherRes.json();
        setWeatherData(wData);
      }
    } catch (err) {
      console.warn('Daily sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync with FastAPI Backend
  useEffect(() => {
    async function initData() {
      try {
        const healthRes = await fetch('/api/health');
        if (healthRes.ok) {
          setIsLiveBackend(true);
          const healthData = await healthRes.json();
          setModelsData({ models: healthData.ml_models });
        }

        // Fetch harbors
        const harborsRes = await fetch('/api/harbors');
        if (harborsRes.ok) {
          const hData = await harborsRes.json();
          if (hData.harbors && hData.harbors.length > 0) {
            setHarbors(hData.harbors);
            setSelectedHarbor(hData.harbors[0]);
          }
        }

        // Fetch hotspots
        const spotsRes = await fetch(`/api/pfz/hotspots?model=${activeModel}`);
        if (spotsRes.ok) {
          const sData = await spotsRes.json();
          if (sData.hotspots && sData.hotspots.length > 0) {
            setHotspots(sData.hotspots);
            setSelectedHotspot(sData.hotspots[0]);
          }
        }

        // Fetch prices
        const pricesRes = await fetch('/api/harbors/prices');
        if (pricesRes.ok) {
          const pData = await pricesRes.json();
          setPricesData(pData);
        }

        // Fetch weather & active storm
        const weatherRes = await fetch('/api/weather/hazards');
        if (weatherRes.ok) {
          const wData = await weatherRes.json();
          setWeatherData(wData);
          if (wData.active_storm) {
            setStorm(wData.active_storm);
          }
        }

        const stormRes = await fetch('/api/weather/storm');
        if (stormRes.ok) {
          const stData = await stormRes.json();
          if (stData) setStorm(stData);
        }
      } catch (err) {
        console.warn('Running with local PWA cache/mock data:', err);
        setIsLiveBackend(false);
      }
    }

    initData();
  }, [activeModel]);

  // Initial Route Generation
  useEffect(() => {
    if (selectedHarbor && selectedHotspot && !activeRoute) {
      handleCalculateRoute(selectedHarbor.id, selectedHotspot.id);
    }
  }, [selectedHarbor, selectedHotspot]);

  // Route Calculation Handler
  const handleCalculateRoute = async (
    harborId,
    pfzId,
    currentStorm = storm,
    overrideAvoid = avoidHazards
  ) => {
    setIsCalculating(true);
    try {
      const res = await fetch('/api/routing/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin_harbor_id: harborId,
          dest_pfz_id: pfzId,
          avoid_hazards: overrideAvoid,
          avoid_storm: overrideAvoid
        })
      });

      if (res.ok) {
        const data = await res.json();
        setActiveRoute(data.route);
      } else {
        throw new Error('Backend route response not ok');
      }
    } catch (e) {
      // Fallback client-side route synthesis
      console.warn('Fallback offline routing triggered:', e);
      const h = harbors.find((x) => x.id === harborId) || selectedHarbor;
      const spot = hotspots.find((x) => x.id === pfzId) || selectedHotspot;

      const dlat = spot.lat - h.lat;
      const dlon = spot.lon - h.lon;
      const distNm = Math.round(Math.sqrt(dlat * dlat + dlon * dlon) * 60);
      const hours = Math.round((distNm / 9.5) * 10) / 10;
      const baselineFuel = Math.round(hours * 24.0 * 10) / 10;
      const savingsLit = Math.round(baselineFuel * 0.16 * 10) / 10;
      const optFuel = Math.round((baselineFuel - savingsLit) * 10) / 10;

      // Waypoints with current-curve and storm avoidance
      const steps = 6;
      const coords = [];
      const waypoints = [];
      const activeSt = currentStorm || storm;

      for (let i = 0; i <= steps; i++) {
        const frac = i / steps;
        // Introduce current-riding curve
        let curve = Math.sin(frac * Math.PI) * 0.18;
        
        // If storm is active and avoiding hazards, shift path to the safe corridor (north/west)
        if (overrideAvoid && activeSt && activeSt.active) {
          curve -= 0.12 * Math.sin(frac * Math.PI);
        }

        const lat = Math.round((h.lat + frac * dlat - curve * 0.4) * 10000) / 10000;
        const lon = Math.round((h.lon + frac * dlon + curve) * 10000) / 10000;
        coords.push([lat, lon]);
        waypoints.push({
          step: i + 1,
          lat,
          lon,
          bearing_deg: Math.round(145 + frac * 20),
          swell_m: Math.round((1.4 + frac * 0.5) * 10) / 10,
          wind_knots: Math.round(14.0 + frac * 3.0)
        });
      }

      // Calculate offline storm hazard
      let stormHazard = null;
      if (activeSt && activeSt.active) {
        const minStormDist = Math.min(
          ...coords.map(([lt, ln]) => {
            const dlt = (lt - activeSt.lat) * 60;
            const dln = (ln - activeSt.lon) * 60 * Math.cos((activeSt.lat * Math.PI) / 180);
            return Math.sqrt(dlt * dlt + dln * dln);
          })
        );
        const dangerRad = activeSt.danger_radius_nm || 45;
        const isDanger = minStormDist <= dangerRad;
        stormHazard = {
          active_storm_id: activeSt.id,
          storm_name_en: activeSt.name_en,
          storm_name_si: activeSt.name_si,
          storm_center: { lat: activeSt.lat, lon: activeSt.lon },
          min_distance_to_storm_nm: Math.round(minStormDist * 10) / 10,
          danger_radius_nm: dangerRad,
          warning_radius_nm: activeSt.warning_radius_nm || 85,
          is_danger_intersect: isDanger,
          storm_avoidance_applied: overrideAvoid,
          alert_message_si: isDanger
            ? "හදිසි අනතුරු ඇඟවීමයි! මාර්ගය කුණාටුවේ අධි අවදානම් කලාපය (45 NM) හරහා වැටී ඇත. වහාම ගමන් මග වෙනස් කරන්න!"
            : "A* ආරක්ෂිත යාත්‍රා මාර්ගය සක්‍රියයි: කුණාටු කලාපය මඟහැර ආරක්ෂිතව ගමන් කරයි.",
          alert_message_en: isDanger
            ? "CRITICAL WARNING: Vessel trajectory approaches storm core danger zone! Immediate evasion advised."
            : "A* Storm Bypass Active: Vessel maintaining safe clearance outside cyclone perimeter."
        };
      }

      setActiveRoute({
        origin: { lat: h.lat, lon: h.lon },
        destination: { lat: spot.lat, lon: spot.lon },
        coordinates: coords,
        waypoints,
        total_distance_nm: distNm,
        estimated_time_hours: hours,
        baseline_fuel_liters: baselineFuel,
        optimal_fuel_liters: optFuel,
        fuel_savings_liters: savingsLit,
        fuel_savings_lkr: Math.round(savingsLit * 330),
        fuel_savings_percentage: 16.0,
        safety_index: stormHazard && stormHazard.is_danger_intersect ? 'STORM HAZARD ALERT' : 'Weather Safe (Safe Sea Corridors Active)',
        storm_hazard: stormHazard
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Storm state update handler
  const handleUpdateStorm = async (updates) => {
    const updated = { ...storm, ...updates };
    setStorm(updated);
    try {
      await fetch('/api/weather/storm/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (e) {
      console.warn('Backend storm update failed:', e);
    }
    if (selectedHarbor && selectedHotspot) {
      handleCalculateRoute(selectedHarbor.id, selectedHotspot.id, updated, avoidHazards);
    }
  };

  // Reroute button handler
  const handleRerouteAroundStorm = () => {
    setAvoidHazards(true);
    handleCalculateRoute(selectedHarbor.id, selectedHotspot.id, storm, true);
  };

  // Emergency evacuate to port handler
  const handleEvacuateToPort = () => {
    setSelectedHarbor(harbors[0]);
    // Set route returning to Beruwala home port
    handleCalculateRoute(harbors[0].id, selectedHotspot?.id || 'pfz-1', storm, true);
  };

  return (
    <div className="min-h-screen bg-[#060b14] text-slate-200 flex flex-col font-sans">
      
      {/* Global Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        t={t}
        isLiveBackend={isLiveBackend}
        onDailySync={handleDailySync}
        isSyncing={isSyncing}
        dailyDate={dailyDate}
      />

      {/* Main App Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        
        {/* Global Storm Warning Alert Banner */}
        <StormAlertBanner
          storm={storm}
          onUpdateStorm={handleUpdateStorm}
          activeRoute={activeRoute}
          onRerouteAroundStorm={handleRerouteAroundStorm}
          onEvacuateToPort={handleEvacuateToPort}
          lang={lang}
          t={t}
        />

        {/* TAB 1: Marine Navigation & PFZ Mapper */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Maritime Map */}
              <div className="lg:col-span-8">
                <MaritimeMap
                  harbors={harbors}
                  hotspots={hotspots}
                  selectedHarbor={selectedHarbor}
                  setSelectedHarbor={setSelectedHarbor}
                  selectedHotspot={selectedHotspot}
                  setSelectedHotspot={setSelectedHotspot}
                  activeRoute={activeRoute}
                  showBaselineRoute={showBaselineRoute}
                  setShowBaselineRoute={setShowBaselineRoute}
                  activeLayer={activeLayer}
                  setActiveLayer={setActiveLayer}
                  onCalculateRoute={handleCalculateRoute}
                  storm={storm}
                  onUpdateStorm={handleUpdateStorm}
                  lang={lang}
                  t={t}
                />
              </div>

              {/* Right Column: Maritime Route Planner Control & Metrics */}
              <div className="lg:col-span-4">
                <RoutePlannerPanel
                  harbors={harbors}
                  hotspots={hotspots}
                  selectedHarbor={selectedHarbor}
                  setSelectedHarbor={setSelectedHarbor}
                  selectedHotspot={selectedHotspot}
                  setSelectedHotspot={setSelectedHotspot}
                  avoidHazards={avoidHazards}
                  setAvoidHazards={setAvoidHazards}
                  onCalculateRoute={handleCalculateRoute}
                  activeRoute={activeRoute}
                  isCalculating={isCalculating}
                  storm={storm}
                  lang={lang}
                  t={t}
                />
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: Harbor Wholesale Fish Prices */}
        {activeTab === 'prices' && (
          <HarborPricesView
            pricesData={pricesData}
            t={t}
          />
        )}

        {/* TAB 3: Marine Weather & Hazard Avoidance */}
        {activeTab === 'weather' && (
          <WeatherAlertsView
            weatherData={weatherData}
            storm={storm}
            onUpdateStorm={handleUpdateStorm}
            lang={lang}
            t={t}
          />
        )}

        {/* TAB 4: AI Model Benchmarks */}
        {activeTab === 'models' && (
          <MLBenchmarksView
            modelsData={modelsData}
            activeModel={activeModel}
            setActiveModel={setActiveModel}
            t={t}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 px-4 py-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>OceanPulse • Final Year Research Project</span>
            <span>|</span>
            <span>Candidate: <b>N. S. De Alwis (Index: 10965475)</b></span>
          </div>

          <div>
            Academic Supervisor: <b>Ms. Thisarani Wickramasinghe</b>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            Sri Lanka Exclusive Economic Zone (EEZ) Decision-Support System
          </div>
        </div>
      </footer>

    </div>
  );
}
