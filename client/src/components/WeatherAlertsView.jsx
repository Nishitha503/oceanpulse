import React from 'react';
import { ShieldAlert, AlertTriangle, Waves, Wind, Compass, ShieldCheck, Info } from 'lucide-react';

export default function WeatherAlertsView({ weatherData, storm, onUpdateStorm, lang = 'si', t }) {
  const advisories = weatherData?.advisories || [];
  const activeStorm = storm || weatherData?.active_storm;

  return (
    <div className="space-y-6">
      
      {/* Top Mid-Sea Cyclone Emergency Alert Card (if storm active) */}
      {activeStorm && activeStorm.active && (
        <div className="relative rounded-2xl overflow-hidden border-2 border-rose-500/80 bg-gradient-to-br from-rose-950/80 via-slate-950 to-slate-900 p-6 shadow-2xl shadow-rose-950/60">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-rose-500/10 blur-3xl pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-rose-500/30">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-2xl bg-rose-600/30 border border-rose-400/50 flex items-center justify-center text-rose-300">
                <span className="text-2xl animate-spin">🌪️</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-slate-950 text-[10px] font-black uppercase">
                    {lang === 'si' ? 'හදිසි අනතුරු ඇඟවීම' : 'RED STORM ALERT'}
                  </span>
                  <span className="text-xs font-mono text-rose-300 font-bold">
                    {activeStorm.id}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1">
                  {lang === 'si' ? activeStorm.name_si : activeStorm.name_en}
                </h2>
                <div className="text-xs text-rose-300/80">
                  {activeStorm.category} • {lang === 'si' ? activeStorm.movement_desc_si : activeStorm.movement_desc_en}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className="px-3 py-1 rounded-xl bg-black/40 border border-rose-500/40 text-rose-300">
                Eye: {activeStorm.lat.toFixed(2)}°N, {activeStorm.lon.toFixed(2)}°E
              </span>
              <span className="px-3 py-1 rounded-xl bg-black/40 border border-slate-700 text-slate-300">
                Pressure: {activeStorm.central_pressure_hpa} hPa
              </span>
              <button
                onClick={() => onUpdateStorm && onUpdateStorm({ active: false })}
                className="px-3 py-1 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 text-rose-200 text-xs font-sans font-bold cursor-pointer transition"
                title="Deactivate Storm"
              >
                {lang === 'si' ? 'අක්‍රිය කරන්න (Deactivate)' : 'Deactivate'}
              </button>
            </div>
          </div>

          {/* Telemetry Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div className="p-3 rounded-xl bg-black/40 border border-rose-500/20">
              <div className="text-[11px] text-slate-400">Max Sustained Winds</div>
              <div className="text-xl font-bold font-mono text-rose-300 mt-0.5">
                {activeStorm.wind_speed_knots} kts
              </div>
              <div className="text-[10px] text-rose-400">Gusts to {activeStorm.wind_gusts_knots} kts (Force 10)</div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-rose-500/20">
              <div className="text-[11px] text-slate-400">Hazardous Swell Height</div>
              <div className="text-xl font-bold font-mono text-rose-300 mt-0.5">
                {activeStorm.wave_height_m} m
              </div>
              <div className="text-[10px] text-rose-400">High to Phenomenal Sea</div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-rose-500/20">
              <div className="text-[11px] text-slate-400">High-Danger Core Zone</div>
              <div className="text-xl font-bold font-mono text-white mt-0.5">
                {activeStorm.danger_radius_nm} NM
              </div>
              <div className="text-[10px] text-amber-400">Outer Watch: {activeStorm.warning_radius_nm} NM</div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-rose-500/20">
              <div className="text-[11px] text-slate-400">A* Router Guidance</div>
              <div className="text-xl font-bold font-mono text-emerald-300 mt-0.5">
                Rerouting
              </div>
              <div className="text-[10px] text-emerald-400">Circumnavigating vortex</div>
            </div>
          </div>

          {/* Official Bulletin Text */}
          <div className="mt-4 p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-200 leading-relaxed">
            <div className="font-bold text-white mb-1">
              {lang === 'si' ? '📢 කාලගුණ විද්‍යා දෙපාර්තමේන්තුව සහ නාරා (NARA) විශේෂ නිවේදනය:' : '📢 Department of Meteorology & NARA Marine Bulletin:'}
            </div>
            <div>{lang === 'si' ? activeStorm.bulletin_si : activeStorm.bulletin_en}</div>
          </div>

          {/* Safe Harbors Evacuation Distances & Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800 text-xs">
            <div>
              <div className="font-bold text-white mb-2 flex items-center gap-1.5">
                <span>⚓ Safe Harbor Evacuation Clearance</span>
              </div>
              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-cyan-300">Beruwala Home Port (බේරුවල)</span>
                  <span className="font-bold text-white">~94 NM (NW Safe Track)</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-300">Galle Fishery Harbor (ගාල්ල)</span>
                  <span className="font-bold text-white">~72 NM (Safe Sheltered)</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-300">Hambantota Deep Port (හම්බන්තොට)</span>
                  <span className="font-bold text-amber-300">~46 NM (Alternate Haven)</span>
                </div>
              </div>
            </div>

            <div>
              <div className="font-bold text-white mb-2 flex items-center gap-1.5">
                <span>📋 Skipper Emergency Action Checklist</span>
              </div>
              <ul className="space-y-1.5 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">1.</span>
                  <span>Maintain 24/7 radio listening watch on VHF Channel 16.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">2.</span>
                  <span>Retrieve all longlines and driftnets immediately to avoid propeller fouling.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">3.</span>
                  <span>Follow OceanPulse A* routing northwest to the protected western coastal shelf.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">4.</span>
                  <span>Keep vessel speed at 8.5–9.5 knots to avoid structural hull slamming in heavy swell.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Cyclone Status Card when Disabled */}
      {activeStorm && !activeStorm.active && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-400">🌪️</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  {lang === 'si' ? activeStorm.name_si : activeStorm.name_en}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-mono font-bold">
                  {lang === 'si' ? 'අක්‍රියයි (Disabled)' : 'Disabled / Inactive'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'si'
                  ? 'අසානි-II කුණාටුව දැනට පද්ධතිය තුළ අක්‍රිය කර ඇත (Disabled). A* කුණාටු මඟහැරීමේ යාත්‍රා මාර්ග සහ රේඩාර් අනතුරු ඇඟවීම් පරීක්ෂා කිරීමට මෙය සක්‍රීය (Activate) කළ හැක.'
                  : 'Storm Asani-II is currently deactivated. Toggle ON to simulate the cyclone vortex & route evasion.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onUpdateStorm && onUpdateStorm({ active: true })}
            className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <span>🌪️ {lang === 'si' ? 'කුණාටුව සක්‍රීය කරන්න (Activate)' : 'Activate Storm'}</span>
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white">
                {t.navWeather === 'Marine Hazards' ? 'Marine Weather & Hazard Avoidance' : 'මුහුදු කාලගුණය සහ අනතුරු ඇඟවීම්'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Synchronized with Sri Lanka Department of Meteorology & NARA Marine Weather Broadcasts.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-slate-300">Open-Meteo & ECMWF Feeds Synced</span>
          </div>
        </div>

        {/* Live Marine Telemetry Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Southern Swell</span>
              <Waves className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1">3.1 m</div>
            <div className="text-[10px] text-rose-400 mt-0.5">Heavy Sea State (Monsoon surge)</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Coastal Wind</span>
              <Wind className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1">16.4 kts</div>
            <div className="text-[10px] text-sky-400 mt-0.5">Beaufort Force 4 (Moderate)</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Swell Period</span>
              <Waves className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1">9.8 sec</div>
            <div className="text-[10px] text-purple-400 mt-0.5">Long-period Indian Ocean swell</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Active Corridors</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-300 mt-1">West Shelf Safe</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Beruwala / Negombo calm</div>
          </div>
        </div>
      </div>

      {/* Advisory Bulletins */}
      <div className="space-y-4">
        {advisories.map((adv) => {
          const isWarning = adv.severity === 'WARNING';
          const isSafe = adv.severity === 'SAFE_CORRIDOR';

          return (
            <div
              key={adv.id}
              className={`glass-panel rounded-2xl p-5 border transition shadow-lg ${
                isWarning ? 'border-rose-500/30 bg-rose-950/15' :
                isSafe ? 'border-emerald-500/30 bg-emerald-950/15' :
                'border-cyan-500/30 bg-cyan-950/15'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  {isWarning && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
                  {isSafe && <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />}
                  {!isWarning && !isSafe && <Info className="w-5 h-5 text-cyan-400 shrink-0" />}
                  
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {adv.title_en}
                    </h3>
                    <div className="text-xs text-slate-400">{adv.title_si}</div>
                  </div>
                </div>

                <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full ${
                  isWarning ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                  isSafe ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                  'bg-cyan-950 text-cyan-300 border border-cyan-800'
                }`}>
                  {adv.severity}
                </span>
              </div>

              <div className="mt-3 text-xs text-slate-300 leading-relaxed">
                {adv.description_en}
              </div>

              <div className="mt-1 text-xs text-slate-400 font-sans">
                {adv.description_si}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <div className="text-slate-400">
                  Zone: <b className="text-slate-200">{adv.zone}</b>
                </div>
                <div className="text-cyan-300 font-mono text-[11px]">
                  Engine Action: <b>{adv.action}</b>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
