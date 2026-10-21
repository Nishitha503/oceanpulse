import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Minus, Anchor, Calculator, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function HarborPricesView({ pricesData, t }) {
  const [selectedHarborId, setSelectedHarborId] = useState('beruwala');
  
  // Catch calculator state
  const [catchTunaKg, setCatchTunaKg] = useState(650);
  const [catchSkipjackKg, setCatchSkipjackKg] = useState(450);
  const [catchSailfishKg, setCatchSailfishKg] = useState(200);
  const [currentPosition] = useState({ lat: 5.65, lon: 80.45 }); // Deep south fishing ground

  const harbors = pricesData?.harbors || [];
  const activeHarbor = harbors.find((h) => h.harbor_id === selectedHarborId) || harbors[0] || {};

  // Compute Net Landing Profit across landing harbors
  // Net Profit = Gross Catch - (Distance * Fuel Burn/NM * Rs. 330)
  const landingRankings = harbors
    .filter((h) => h.is_landing_harbor)
    .map((h) => {
      // Approximate distance from vessel location
      const dlat = h.lat - currentPosition.lat;
      const dlon = h.lon - currentPosition.lon;
      const distNm = Math.round(Math.sqrt(dlat * dlat + dlon * dlon) * 60);

      // Multi-day boat fuel calculation: ~2.5 Liters per Nautical Mile at 9.5 kts
      const fuelLiters = Math.round(distNm * 2.5);
      const fuelCostLkr = Math.round(fuelLiters * 330);

      const tunaPrice = h.prices?.find((p) => p.species_id === 'yellowfin_tuna')?.price_per_kg_lkr || 1900;
      const skipjackPrice = h.prices?.find((p) => p.species_id === 'skipjack_tuna')?.price_per_kg_lkr || 900;
      const sailfishPrice = h.prices?.find((p) => p.species_id === 'sailfish')?.price_per_kg_lkr || 1500;

      const grossRevenue = (catchTunaKg * tunaPrice) + (catchSkipjackKg * skipjackPrice) + (catchSailfishKg * sailfishPrice);
      const netProfit = grossRevenue - fuelCostLkr;

      return {
        ...h,
        distNm,
        fuelLiters,
        fuelCostLkr,
        grossRevenue,
        netProfit
      };
    })
    .sort((a, b) => b.netProfit - a.netProfit);

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Market Overview */}
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30">
                <DollarSign className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white">
                {t.harborWholesale}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Daily wholesale exchange benchmarks across major Sri Lankan coastal harbors and Peliyagoda Central Market.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Date: <b className="text-white">{pricesData?.date || new Date().toISOString().split('T')[0]}</b>
            </span>
            <span className="text-xs text-slate-400 font-mono px-2 py-1 rounded-lg bg-slate-900 border border-slate-800">
              Currency: <b className="text-amber-300">LKR (රු.)</b>
            </span>
          </div>
        </div>

        {/* Harbor Selector Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-800">
          {harbors.map((h) => (
            <button
              key={h.harbor_id}
              onClick={() => setSelectedHarborId(h.harbor_id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                selectedHarborId === h.harbor_id
                  ? 'bg-gradient-to-r from-amber-500/25 to-yellow-600/25 text-amber-300 border border-amber-400/40 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Anchor className="w-3.5 h-3.5" />
              <span>{h.name}</span>
              {!h.is_landing_harbor && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">Hub</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Harbor Price Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeHarbor.prices?.map((item) => {
          const isUp = item.trend === 'up';
          const isDown = item.trend === 'down';

          return (
            <div
              key={item.species_id}
              className="glass-panel rounded-2xl p-4 border border-slate-800 hover:border-cyan-500/30 transition shadow-lg relative overflow-hidden group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                    {item.name_en}
                  </h3>
                  <div className="text-xs text-slate-400 font-sans">{item.name_si}</div>
                </div>

                <div className={`flex items-center gap-1 text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${
                  isUp ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' :
                  isDown ? 'bg-rose-950/80 text-rose-400 border border-rose-800' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  {isUp && <TrendingUp className="w-3 h-3" />}
                  {isDown && <TrendingDown className="w-3 h-3" />}
                  {!isUp && !isDown && <Minus className="w-3 h-3" />}
                  <span>{item.change_lkr > 0 ? `+${item.change_lkr}` : item.change_lkr}</span>
                </div>
              </div>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-cyan-300">
                  Rs. {item.price_per_kg_lkr.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400">/ kg</span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-850 flex items-center justify-between text-[11px] text-slate-400">
                <span>Grade: <b className="text-slate-300">{item.quality_grade}</b></span>
                <span>Harbor Vol: <b className="text-slate-300">{activeHarbor.daily_volume_tons}T</b></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Net Profit Landing Optimizer Section */}
      <div className="glass-panel rounded-2xl p-6 border border-emerald-500/20 shadow-xl">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{t.landingCalculator}</h3>
            <p className="text-xs text-slate-400">
              Evaluates gross market earnings minus diesel fuel burn to pinpoint your most profitable landing harbor.
            </p>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Yellowfin Tuna (කෙලවල්ලා) kg
            </label>
            <input
              type="number"
              value={catchTunaKg}
              onChange={(e) => setCatchTunaKg(Math.max(0, Number(e.target.value)))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Skipjack Tuna (බලයා) kg
            </label>
            <input
              type="number"
              value={catchSkipjackKg}
              onChange={(e) => setCatchSkipjackKg(Math.max(0, Number(e.target.value)))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Sailfish / Marlin (තලපතා) kg
            </label>
            <input
              type="number"
              value={catchSailfishKg}
              onChange={(e) => setCatchSailfishKg(Math.max(0, Number(e.target.value)))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Ranked Recommendations Table */}
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Rank / Harbor</th>
                <th className="p-3">Distance</th>
                <th className="p-3">Diesel Burn</th>
                <th className="p-3">Gross Revenue</th>
                <th className="p-3">Fuel Cost</th>
                <th className="p-3 text-right">Net Profit</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {landingRankings.map((h, idx) => {
                const isBest = idx === 0;

                return (
                  <tr key={h.harbor_id} className={`hover:bg-slate-900/50 ${isBest ? 'bg-emerald-950/20' : ''}`}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                          isBest ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-white">{h.name}</div>
                          <div className="text-[10px] text-slate-400">{h.name_si}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 font-mono text-slate-300">
                      {h.distNm} NM
                    </td>

                    <td className="p-3 font-mono text-slate-300">
                      {h.fuelLiters} L
                    </td>

                    <td className="p-3 font-mono text-slate-300">
                      Rs. {h.grossRevenue.toLocaleString()}
                    </td>

                    <td className="p-3 font-mono text-rose-400">
                      - Rs. {h.fuelCostLkr.toLocaleString()}
                    </td>

                    <td className="p-3 font-mono font-bold text-right text-emerald-400 text-sm">
                      Rs. {h.netProfit.toLocaleString()}
                    </td>

                    <td className="p-3 text-center">
                      {isBest ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Recommended
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {h.market_saturation}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
