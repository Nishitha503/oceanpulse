import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  Flame,
  Wind,
  Waves,
  Compass,
  Volume2,
  VolumeX,
  Navigation,
  Anchor,
  X,
  Maximize2,
  Minimize2,
  Sliders,
  ShieldAlert,
  ArrowRight,
  Bell
} from 'lucide-react';
import { isPointInSriLankaEEZ } from '../data/mockData';

export default function StormAlertBanner({
  storm,
  onUpdateStorm,
  activeRoute,
  onRerouteAroundStorm,
  onEvacuateToPort,
  lang = 'si',
  t
}) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [soundTone, setSoundTone] = useState(() => {
    return localStorage.getItem('oceanpulse_alarm_tone') || 'chime';
  });
  const audioIntervalRef = useRef(null);

  if (!storm || !storm.active) return null;

  // Calculate distance between active route and storm
  let routeDistToStorm = null;
  let isRouteInDanger = false;
  let isRouteInWarning = false;

  if (activeRoute && activeRoute.coordinates && activeRoute.coordinates.length > 0) {
    const minD = Math.min(
      ...activeRoute.coordinates.map(([lat, lon]) => {
        const dlat = (lat - storm.lat) * 60;
        const dlon = (lon - storm.lon) * 60 * Math.cos((storm.lat * Math.PI) / 180);
        return Math.sqrt(dlat * dlat + dlon * dlon);
      })
    );
    routeDistToStorm = Math.round(minD * 10) / 10;
    isRouteInDanger = routeDistToStorm <= (storm.danger_radius_nm || 45);
    isRouteInWarning = routeDistToStorm <= (storm.warning_radius_nm || 85);
  }

  // High-Fidelity Web Audio Synthesizer for Marine Alarm Tones
  const playMaritimeAlarm = (toneToPlay = soundTone) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;

      if (toneToPlay === 'foghorn') {
        // Deep Resonant Ship Horn (multi-harmonic low brass foghorn)
        const fundamental = 142; // Low D2 horn
        [1, 1.5, 2, 2.5].forEach((mult, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = idx === 0 ? 'sawtooth' : 'triangle';
          osc.frequency.setValueAtTime(fundamental * mult, now);

          const peak = idx === 0 ? 0.09 : 0.04;
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(peak, now + 0.15);
          gain.gain.setValueAtTime(peak, now + 0.65);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 1.25);
        });
      } else if (toneToPlay === 'sonar') {
        // Classic Underwater Sonar Ping with smooth decay
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1280, now);
        osc.frequency.exponentialRampToValueAtTime(1150, now + 0.7);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.9);
      } else if (toneToPlay === 'klaxon') {
        // Maritime Emergency Warble Siren (Two-tone pulsing)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(680, now);
        osc.frequency.linearRampToValueAtTime(920, now + 0.16);
        osc.frequency.linearRampToValueAtTime(680, now + 0.32);
        osc.frequency.linearRampToValueAtTime(920, now + 0.48);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.09, now + 0.02);
        gain.gain.setValueAtTime(0.09, now + 0.48);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.65);
      } else {
        // Default: Modern Marine Radar Bridge Chime (Smooth dual harmonic bell)
        const playChimeNote = (freq, startOffset, duration, volume) => {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(freq, now + startOffset);

          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(freq * 2.0, now + startOffset);

          gain.gain.setValueAtTime(0.001, now + startOffset);
          gain.gain.linearRampToValueAtTime(volume, now + startOffset + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(now + startOffset);
          osc2.start(now + startOffset);
          osc1.stop(now + startOffset + duration + 0.05);
          osc2.stop(now + startOffset + duration + 0.05);
        };

        // Note 1: 880 Hz (A5 bell)
        playChimeNote(880, 0, 0.45, 0.08);
        // Note 2: 659.25 Hz (E5 bell)
        playChimeNote(659.25, 0.22, 0.65, 0.09);
      }
    } catch (e) {
      console.warn('Audio alarm playback error:', e);
    }
  };

  const toggleSound = () => {
    if (isAudioMuted) {
      setIsAudioMuted(false);
      playMaritimeAlarm();
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = setInterval(() => {
        playMaritimeAlarm();
      }, 4500);
    } else {
      setIsAudioMuted(true);
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
    }
  };

  const handleToneChange = (newTone) => {
    setSoundTone(newTone);
    localStorage.setItem('oceanpulse_alarm_tone', newTone);
    playMaritimeAlarm(newTone);
    if (!isAudioMuted) {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = setInterval(() => {
        playMaritimeAlarm(newTone);
      }, 4500);
    }
  };

  useEffect(() => {
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, []);

  // If minimized, display a sleek pulsing emergency badge floating in bottom-right
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-950/95 border-2 border-rose-500 text-white shadow-2xl shadow-rose-950/80 animate-pulse hover:bg-rose-900 transition"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
          <span className="text-xs font-bold font-mono">
            {lang === 'si' ? '🚨 කුණාටු අනතුරු ඇඟවීමයි' : '🚨 CYCLONE ALERT ACTIVE'}
          </span>
          <Maximize2 className="w-3.5 h-3.5 text-rose-300 ml-1" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="relative mb-6 rounded-2xl overflow-hidden border-2 border-rose-500/80 bg-gradient-to-r from-rose-950/90 via-slate-950/95 to-amber-950/80 shadow-2xl shadow-rose-950/60 p-4 sm:p-5">
        {/* Animated Caution Border Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 via-transparent to-amber-500/10 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          {/* Left Column: Emergency Beacon & Title */}
          <div className="flex items-start gap-3.5 max-w-3xl">
            <div className="relative shrink-0 mt-0.5">
              <div className="absolute -inset-1 rounded-2xl bg-rose-500 opacity-60 blur-sm animate-pulse"></div>
              <div className="relative w-11 h-11 rounded-2xl bg-rose-600 border border-rose-300 flex items-center justify-center text-white shadow-lg">
                <ShieldAlert className="w-6 h-6 animate-bounce" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-slate-950 text-[10px] font-black tracking-wider uppercase">
                  {lang === 'si' ? 'රතු අනතුරු ඇඟවීම' : 'CRITICAL RED ALERT'}
                </span>
                <span className="text-xs font-mono text-rose-300 font-bold">
                  {lang === 'si' ? storm.name_si : storm.name_en}
                </span>
                <span className="text-[11px] text-slate-400">• {storm.category}</span>
              </div>

              <h2 className="text-base sm:text-lg font-extrabold text-white mt-1 leading-snug">
                {lang === 'si' ? t.stormAlertTitle : t.stormAlertTitle}
              </h2>

              <p className="text-xs text-rose-200/90 mt-1 leading-relaxed">
                {lang === 'si' ? storm.bulletin_si : storm.bulletin_en}
              </p>

              {/* Real-time telemetry badges */}
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs font-mono">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-rose-500/30 text-rose-300">
                  <Wind className="w-3.5 h-3.5 text-rose-400" />
                  <span>{storm.wind_speed_knots} kts (Gusts {storm.wind_gusts_knots} kts)</span>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-rose-500/30 text-rose-300">
                  <Waves className="w-3.5 h-3.5 text-rose-400" />
                  <span>Swell {storm.wave_height_m} m</span>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-rose-500/30 text-amber-300">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span>{storm.lat.toFixed(2)}°N, {storm.lon.toFixed(2)}°E</span>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-slate-700 text-slate-300">
                  <span>Pressure: <b>{storm.central_pressure_hpa} hPa</b></span>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-slate-700 text-slate-300">
                  <span>Track: <b>{lang === 'si' ? storm.movement_desc_si : storm.movement_desc_en}</b></span>
                </div>
              </div>

              {/* Route Collision / Proximity Alert Status */}
              {routeDistToStorm !== null && (
                <div className={`mt-3.5 p-2.5 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
                  isRouteInDanger
                    ? 'bg-rose-900/40 border-rose-500 text-rose-200 animate-pulse'
                    : isRouteInWarning
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                    : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                }`}>
                  <AlertTriangle className={`w-4 h-4 shrink-0 ${
                    isRouteInDanger ? 'text-rose-400' : isRouteInWarning ? 'text-amber-400' : 'text-emerald-400'
                  }`} />
                  <div>
                    {isRouteInDanger ? (
                      <span>
                        {lang === 'si'
                          ? `⚠️ අවධානයයි: ඔබගේ යාත්‍රා මාර්ගය කුණාටු මධ්‍යස්ථානයේ සිට නාවික සැතපුම් ${routeDistToStorm} ක් පමණක් දුරින් පිහිටා ඇත (අධි අවදානම් සීමාව තුළ)! වහාම ගමන් මග වෙනස් කරන්න.`
                          : `⚠️ CRITICAL: Trajectory comes within ${routeDistToStorm} NM of storm core (Inside 45 NM Danger Zone)! Immediate evasive diversion required.`}
                      </span>
                    ) : isRouteInWarning ? (
                      <span>
                        {lang === 'si'
                          ? `⚠️ පූර්ව අවවාදයයි: මාර්ගය කුණාටුවට නාවික සැතපුම් ${routeDistToStorm} ක් දුරින් පිහිටා ඇත (පිටත තද සුළං කලාපය). සුපරීක්ෂාකාරීව යාත්‍රා කරන්න.`
                          : `⚠️ CAUTION: Trajectory is ${routeDistToStorm} NM from storm core (Outer Gale Zone). Maintain evasive heading.`}
                      </span>
                    ) : (
                      <span>
                        {lang === 'si'
                          ? `🛡️ A* ආරක්ෂිත යාත්‍රා මාර්ගය සක්‍රියයි: යාත්‍රාව කුණාටු කලාපයෙන් නාවික සැතපුම් ${routeDistToStorm} ක් දුරින් ආරක්ෂිතව ගමන් කරයි.`
                          : `🛡️ A* Storm Bypass Active: Trajectory maintains a safe ${routeDistToStorm} NM buffer outside the cyclonic core.`}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Emergency Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 w-full lg:w-auto">
            {/* Evasive Auto-Reroute Button */}
            <button
              onClick={onRerouteAroundStorm}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition active:scale-95"
            >
              <Navigation className="w-4 h-4" />
              <span>{lang === 'si' ? t.stormRerouteBtn : t.stormRerouteBtn}</span>
            </button>

            {/* Emergency Return to Port Button */}
            <button
              onClick={onEvacuateToPort}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-950/60 transition active:scale-95"
            >
              <Anchor className="w-4 h-4" />
              <span>{lang === 'si' ? t.stormEvacuateBtn : t.stormEvacuateBtn}</span>
            </button>

            {/* Controls Bar: Sound Toggle + Tone Selector + Storm Position Simulator + Minimize */}
            <div className="flex flex-wrap items-center gap-1.5 justify-end mt-1">
              {/* Sound Toggle */}
              <button
                onClick={toggleSound}
                className={`px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border transition cursor-pointer ${
                  isAudioMuted
                    ? 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white'
                    : 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/30 animate-pulse'
                }`}
                title={isAudioMuted ? 'Turn On Maritime Alarm' : 'Mute Maritime Alarm'}
              >
                {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span className="text-[11px] font-mono font-semibold">
                  {isAudioMuted
                    ? lang === 'si' ? 'හඬ නාදය' : 'Sound Alarm'
                    : lang === 'si' ? 'නිහඬ කරන්න' : 'Mute Alarm'}
                </span>
              </button>

              {/* Tone Selector Dropdown with Preview */}
              <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700 rounded-xl px-2 py-0.5">
                <Bell className="w-3 h-3 text-cyan-400" />
                <select
                  value={soundTone}
                  onChange={(e) => handleToneChange(e.target.value)}
                  className="bg-transparent text-cyan-300 text-[11px] font-mono py-1 focus:outline-none cursor-pointer"
                  title="Change Warning Alarm Tone / නාද රටාව වෙනස් කරන්න"
                >
                  <option value="chime" className="bg-slate-900 text-slate-200">
                    🔔 {lang === 'si' ? 'මෘදු රේඩාර් නාදය' : 'Radar Chime (Soft)'}
                  </option>
                  <option value="foghorn" className="bg-slate-900 text-slate-200">
                    🚢 {lang === 'si' ? 'නැව් නළා හඬ (Foghorn)' : 'Ship Foghorn'}
                  </option>
                  <option value="sonar" className="bg-slate-900 text-slate-200">
                    📡 {lang === 'si' ? 'සෝනාර් නාදය' : 'Sonar Ping'}
                  </option>
                  <option value="klaxon" className="bg-slate-900 text-slate-200">
                    🚨 {lang === 'si' ? 'හදිසි සයිරනය' : 'IMO Siren'}
                  </option>
                </select>
                <button
                  type="button"
                  onClick={() => playMaritimeAlarm(soundTone)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 transition cursor-pointer"
                  title="Preview Tone / නාදය අසන්න"
                >
                  ▶
                </button>
              </div>

              {/* Storm Config / Simulator Button */}
              <button
                onClick={() => setShowConfigModal(true)}
                className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1"
                title="Configure Storm Location & Intensity"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="text-[11px] font-mono hidden sm:inline">
                  {lang === 'si' ? 'අත්හදා බලන්න' : 'Simulate'}
                </span>
              </button>

              {/* Minimize Banner */}
              <button
                onClick={() => setIsMinimized(true)}
                className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-400 hover:text-white transition"
                title="Minimize Warning"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Storm Simulator Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">
                  {lang === 'si' ? 'මුහුද මැද කුණාටු අනුකරණය (Storm Simulator)' : 'Mid-Sea Storm Simulator'}
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              {lang === 'si'
                ? 'ශ්‍රී ලංකා මුහුදු සීමාවේ ඕනෑම තැනකට කුණාටුව රැගෙන ගොස් යාත්‍රා මාර්ගයේ ආරක්ෂාව සහ A* ඇල්ගොරිතමය පරීක්ෂා කරන්න.'
                : 'Move the storm coordinates or adjust intensity to evaluate vessel evasion trajectories.'}
            </p>

            <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-[11px] flex items-center gap-2 mt-2">
              <span className="text-sm">🇱🇰</span>
              <span>
                {lang === 'si'
                  ? 'සියලුම කුණාටු පිහිටීම් ශ්‍රී ලංකා සුවිශේෂී ආර්ථික කලාපය (EEZ - නාවික සැතපුම් 200) තුළට පමණක් සීමා කර ඇත.'
                  : 'All storm coordinates strictly locked inside Sri Lanka Exclusive Economic Zone (EEZ).'}
              </span>
            </div>

            <div className="space-y-4 mt-4 text-xs">
              {/* Presets */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  {lang === 'si' ? 'පූර්ව නිශ්චිත කලාප (Quick Presets)' : 'Quick Presets'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onUpdateStorm({ lat: 5.35, lon: 81.15, wind_speed_knots: 52, wave_height_m: 4.8 });
                      setShowConfigModal(false);
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-slate-700"
                  >
                    <div className="font-bold text-rose-300">Deep South (Southern EEZ)</div>
                    <div className="text-[10px] text-slate-400">Lat 5.35°N, 81.15°E • 52 kts</div>
                  </button>

                  <button
                    onClick={() => {
                      onUpdateStorm({ lat: 6.10, lon: 79.50, wind_speed_knots: 46, wave_height_m: 4.2 });
                      setShowConfigModal(false);
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-slate-700"
                  >
                    <div className="font-bold text-amber-300">West Coast Offshore (Beruwala Track)</div>
                    <div className="text-[10px] text-slate-400">Lat 6.10°N, 79.50°E • 46 kts</div>
                  </button>

                  <button
                    onClick={() => {
                      onUpdateStorm({ lat: 5.75, lon: 80.40, wind_speed_knots: 58, wave_height_m: 5.2 });
                      setShowConfigModal(false);
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-slate-700"
                  >
                    <div className="font-bold text-rose-400">Dondra Head Canyon Vortex</div>
                    <div className="text-[10px] text-slate-400">Lat 5.75°N, 80.40°E • 58 kts</div>
                  </button>

                  <button
                    onClick={() => {
                      onUpdateStorm({ lat: 7.50, lon: 82.80, wind_speed_knots: 48, wave_height_m: 4.0 });
                      setShowConfigModal(false);
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-slate-700"
                  >
                    <div className="font-bold text-cyan-300">East Coast Bay of Bengal Surge</div>
                    <div className="text-[10px] text-slate-400">Lat 7.50°N, 82.80°E • 48 kts</div>
                  </button>
                </div>
              </div>

              {/* Slider for Latitude */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Storm Latitude (Sri Lanka Waters):</span>
                  <span className="font-mono font-bold text-cyan-300">{storm.lat.toFixed(2)}° N</span>
                </div>
                <input
                  type="range"
                  min="4.6"
                  max="8.5"
                  step="0.05"
                  value={storm.lat}
                  onChange={(e) => {
                    const newLat = parseFloat(e.target.value);
                    if (isPointInSriLankaEEZ(newLat, storm.lon)) {
                      onUpdateStorm({ lat: newLat });
                    }
                  }}
                  className="w-full accent-cyan-400"
                />
              </div>

              {/* Slider for Longitude */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Storm Longitude (Sri Lanka Waters):</span>
                  <span className="font-mono font-bold text-cyan-300">{storm.lon.toFixed(2)}° E</span>
                </div>
                <input
                  type="range"
                  min="78.8"
                  max="83.5"
                  step="0.05"
                  value={storm.lon}
                  onChange={(e) => {
                    const newLon = parseFloat(e.target.value);
                    if (isPointInSriLankaEEZ(storm.lat, newLon)) {
                      onUpdateStorm({ lon: newLon });
                    }
                  }}
                  className="w-full accent-cyan-400"
                />
              </div>

              {/* Slider for Wind Speed */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Wind Speed (Knots):</span>
                  <span className="font-mono font-bold text-rose-400">{storm.wind_speed_knots} kts</span>
                </div>
                <input
                  type="range"
                  min="35"
                  max="75"
                  step="1"
                  value={storm.wind_speed_knots}
                  onChange={(e) => onUpdateStorm({ wind_speed_knots: parseFloat(e.target.value) })}
                  className="w-full accent-rose-500"
                />
              </div>

              {/* Select Alarm Sound Tone */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{lang === 'si' ? 'අනතුරු ඇඟවීමේ නාද රටාව (Alarm Tone):' : 'Warning Alarm Tone:'}</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'chime', label: '🔔 Radar Chime (Soft)', desc: 'මෘදු රේඩාර් නාදය' },
                    { id: 'foghorn', label: '🚢 Vessel Foghorn', desc: 'ගැඹුරු නැව් නළා හඬ' },
                    { id: 'sonar', label: '📡 Sonar Ping', desc: 'සබ්මැරීන් සෝනාර් නාදය' },
                    { id: 'klaxon', label: '🚨 IMO Siren', desc: 'මුහුදු හදිසි සයිරනය' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleToneChange(item.id)}
                      className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                        soundTone === item.id
                          ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-500/20'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-xs">{item.label}</div>
                      <div className="text-[10px] text-slate-400">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle Storm Active State */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span>Storm Status:</span>
                <button
                  onClick={() => onUpdateStorm({ active: !storm.active })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    storm.active
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {storm.active ? 'ACTIVE (සක්‍රීයයි)' : 'DISABLED (අක්‍රියයි)'}
                </button>
              </div>

            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
