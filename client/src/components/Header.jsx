import React from 'react';
import { Compass, Waves, DollarSign, ShieldAlert, Cpu, Globe2, Radio, RefreshCw, Calendar } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, lang, setLang, t, isLiveBackend, onDailySync, isSyncing, dailyDate }) {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-cyan-500/20 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 shadow-lg shadow-cyan-500/10">
            <Compass className="w-6 h-6 text-cyan-400 animate-spin-slow" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl lg:text-2xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
                {t.appTitle}
              </h1>
              <span className="text-[10px] uppercase font-mono tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-950/90 text-cyan-300 border border-cyan-400/50 flex items-center gap-1 shadow-sm shadow-cyan-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Beruwala Home Port</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans hidden sm:block">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              activeTab === 'map'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-400/30 shadow-sm shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Waves className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.navMap}</span>
          </button>

          <button
            onClick={() => setActiveTab('prices')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              activeTab === 'prices'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-400/30 shadow-sm shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.navPrices}</span>
          </button>

          <button
            onClick={() => setActiveTab('weather')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              activeTab === 'weather'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-400/30 shadow-sm shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>{t.navWeather}</span>
          </button>

          <button
            onClick={() => setActiveTab('models')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              activeTab === 'models'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-400/30 shadow-sm shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>{t.navModels}</span>
          </button>
        </div>

        {/* Status, Daily Sync & Language Toggle */}
        <div className="flex items-center gap-2.5">
          {/* Daily Date & Sync Button */}
          <div className="flex items-center gap-2 bg-slate-900/70 border border-slate-800 rounded-xl p-1">
            <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-[11px] font-mono text-cyan-300">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>{dailyDate || new Date().toISOString().split('T')[0]}</span>
            </span>

            <button
              onClick={onDailySync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-600/20 hover:from-emerald-500/30 hover:to-teal-600/30 border border-emerald-400/40 text-emerald-300 text-xs font-semibold shadow-sm shadow-emerald-500/10 transition active:scale-95 disabled:opacity-50"
              title="Sync latest daily satellite telemetry & market prices / දෛනික දත්ත යාවත්කාලීන කරන්න"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? (lang === 'en' ? 'Syncing...' : 'යාවත්කාලීන වේ...') : (lang === 'en' ? 'Daily Update' : 'දෛනික යාවත්කාලීන')}</span>
            </button>
          </div>

          <div className="hidden 2xl:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-300">
            <Radio className={`w-3.5 h-3.5 ${isLiveBackend ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span>{isLiveBackend ? 'FastAPI ML Live' : 'PWA Offline Cache'}</span>
          </div>

          {/* Bilingual Switcher */}
          <button
            onClick={() => setLang(lang === 'en' ? 'si' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition"
            title="Switch Language / භාෂාව මාරු කරන්න"
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'සිංහල (SI)' : 'English (EN)'}</span>
          </button>
        </div>

      </div>
    </header>
  );
}
