import React, { useState } from 'react';
import { Fuel, Navigation, Clock, ShieldCheck, Download, ChevronRight, ChevronDown, Sparkles, AlertCircle } from 'lucide-react';

export default function RoutePlannerPanel({
  harbors,
  hotspots,
  selectedHarbor,
  setSelectedHarbor,
  selectedHotspot,
  setSelectedHotspot,
  avoidHazards,
  setAvoidHazards,
  onCalculateRoute,
  activeRoute,
  isCalculating,
  storm,
  lang = 'si',
  t
}) {
  const [showWaypoints, setShowWaypoints] = useState(false);

  const handleDownloadGPX = () => {
    if (!activeRoute || !activeRoute.waypoints) return;

    // Generate standard maritime GPX XML
    let gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="OceanPulse Sri Lanka Fisheries" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>OceanPulse Route: ${selectedHarbor?.name || 'Harbor'} to ${selectedHotspot?.id || 'PFZ'}</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <rte>
    <name>Fuel-Optimal Route</name>
`;

    activeRoute.waypoints.forEach((wp) => {
      gpxContent += `    <rtept lat="${wp.lat}" lon="${wp.lon}">
      <name>WP-${wp.step}</name>
      <desc>Heading ${wp.bearing_deg} deg | Swell ${wp.swell_m}m | Wind ${wp.wind_knots}kts</desc>
    </rtept>\n`;
    });

    gpxContent += `  </rte>\n</gpx>`;

    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `oceanpulse_route_${selectedHarbor?.id || 'origin'}_to_${selectedHotspot?.id || 'target'}.gpx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20 shadow-xl flex flex-col gap-5">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
            <Navigation className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              {t.navMap === 'Marine Map & PFZ' ? 'Maritime A* Route Planner' : 'ඉන්ධන ඉතිරි කිරීමේ යාත්‍රා සැලසුම්කරු'}
            </h2>
            <p className="text-[11px] text-slate-400">Current-Aware Multi-Objective Optimization</p>
          </div>
        </div>

        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
          A* Maritime Active
        </span>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Departure Harbor - Dedicated Beruwala Home Port */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
            <span>{t.departureHarbor}</span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
              ⚓ Home Port
            </span>
          </label>
          <div className="w-full bg-slate-900/90 border border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 shadow-inner">
            <div className="font-bold text-white flex items-center justify-between">
              <span>Beruwala Fishery Harbor (බේරුවල)</span>
              <span className="text-[10px] font-mono text-cyan-300">06°25'N, 79°58'E</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
              <span>Kalutara District</span>
              <span>•</span>
              <span className="text-emerald-400 font-mono">350+ Multi-day Vessels Fleet</span>
            </div>
          </div>
        </div>

        {/* Target PFZ Hotspot */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            {t.targetHotspot}
          </label>
          <select
            value={selectedHotspot?.id || 'pfz-1'}
            onChange={(e) => {
              const s = hotspots.find((item) => item.id === e.target.value);
              if (s) setSelectedHotspot(s);
            }}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 transition"
          >
            {hotspots.map((s, idx) => (
              <option key={s.id} value={s.id}>
                #{idx + 1} ({s.pfz_percentage}% Prob) - {s.category} ({s.dist_from_beruwala_nm || s.distance_from_beruwala_nm || '45'} NM from Beruwala)
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Hazard Avoidance Switch */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="text-xs font-semibold text-slate-200">{t.avoidHazards}</div>
            <div className="text-[11px] text-slate-400">Routes vessels around rough seas &gt; 3.0m swell</div>
          </div>
        </div>
        <input
          type="checkbox"
          checked={avoidHazards}
          onChange={(e) => setAvoidHazards(e.target.checked)}
          className="w-4 h-4 accent-cyan-400 cursor-pointer rounded"
        />
      </div>

      {/* Calculate CTA */}
      <button
        onClick={() => onCalculateRoute(selectedHarbor?.id || 'beruwala', selectedHotspot?.id || 'pfz-1')}
        disabled={isCalculating}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
      >
        <Sparkles className="w-4 h-4" />
        <span>{isCalculating ? 'Computing A* Path...' : t.planRoute}</span>
      </button>

      {/* Route Results Metric Cards */}
      {activeRoute && (
        <div className="space-y-4 pt-2">
          
          {/* Main Savings Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/60 border border-emerald-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                <Fuel className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold">
                  {t.dieselSaved}
                </div>
                <div className="text-xl font-bold font-mono text-white">
                  {activeRoute.fuel_savings_liters} Liters
                  <span className="text-xs text-emerald-400 ml-1.5 font-normal">
                    ({activeRoute.fuel_savings_percentage}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                {t.rupeesSaved}
              </div>
              <div className="text-lg font-bold font-mono text-cyan-300">
                Rs. {Number(activeRoute.fuel_savings_lkr).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Storm Hazard Impact Notice */}
          {activeRoute.storm_hazard && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              activeRoute.storm_hazard.is_danger_intersect
                ? 'bg-rose-950/70 border-rose-500 text-rose-200 animate-pulse'
                : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
            }`}>
              <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${
                activeRoute.storm_hazard.is_danger_intersect ? 'text-rose-400' : 'text-emerald-400'
              }`} />
              <div className="space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <span>{activeRoute.storm_hazard.is_danger_intersect ? '⚠️ STORM COLLISION WARNING' : '🛡️ DYNAMIC STORM AVOIDANCE ACTIVE'}</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40">
                    {activeRoute.storm_hazard.min_distance_to_storm_nm} NM to Eye
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 leading-snug">
                  {lang === 'si' ? activeRoute.storm_hazard.alert_message_si : activeRoute.storm_hazard.alert_message_en}
                </div>
              </div>
            </div>
          )}

          {/* Secondary Telemetry Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-mono">{t.distance}</div>
              <div className="text-sm font-bold font-mono text-white mt-0.5">
                {activeRoute.total_distance_nm} NM
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-mono">{t.estTime}</div>
              <div className="text-sm font-bold font-mono text-white mt-0.5">
                {activeRoute.estimated_time_hours} hrs
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Straight Fuel</div>
              <div className="text-sm font-bold font-mono text-rose-300 mt-0.5">
                {activeRoute.baseline_fuel_liters} L
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Optimized Fuel</div>
              <div className="text-sm font-bold font-mono text-emerald-300 mt-0.5">
                {activeRoute.optimal_fuel_liters} L
              </div>
            </div>

          </div>

          {/* Safety & Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{activeRoute.safety_index}</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleDownloadGPX}
                className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.exportGPX}</span>
              </button>

              <button
                onClick={() => setShowWaypoints(!showWaypoints)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
              >
                <span>Waypoints ({activeRoute.waypoints?.length || 0})</span>
                {showWaypoints ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Collapsible Waypoints Table */}
          {showWaypoints && activeRoute.waypoints && (
            <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/90 p-2 text-xs font-mono">
              <table className="w-full text-left">
                <thead className="text-[10px] uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-1.5">WP</th>
                    <th className="p-1.5">Lat / Lon</th>
                    <th className="p-1.5">Heading</th>
                    <th className="p-1.5">Swell</th>
                    <th className="p-1.5">Wind</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {activeRoute.waypoints.map((wp) => (
                    <tr key={wp.step} className="hover:bg-slate-900/60">
                      <td className="p-1.5 text-cyan-400 font-bold">#{wp.step}</td>
                      <td className="p-1.5">{wp.lat}°N, {wp.lon}°E</td>
                      <td className="p-1.5">{wp.bearing_deg}°</td>
                      <td className="p-1.5">{wp.swell_m}m</td>
                      <td className="p-1.5">{wp.wind_knots} kts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
