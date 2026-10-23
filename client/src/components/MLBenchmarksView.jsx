import React from 'react';
import { Cpu, CheckCircle2, BarChart2, Layers, Zap, Award } from 'lucide-react';

export default function MLBenchmarksView({ modelsData, activeModel, setActiveModel, t }) {
  const models = modelsData?.models || {
    RandomForest: { accuracy: 0.9114, f1_score: 0.8561, is_active: true },
    GradientBoosting: { accuracy: 0.9068, f1_score: 0.8487, is_active: false },
    NeuralNetwork: { accuracy: 0.6795, f1_score: 0.0662, is_active: false }
  };

  const modelSpecs = [
    {
      id: 'RandomForest',
      name: 'Random Forest Ensemble',
      tag: 'Best Stability & Generalization',
      estimators: '100 Decision Trees',
      maxDepth: '8 Levels',
      description: 'Ensemble of decorrelated decision trees. Excels at identifying non-linear interactions between SST thermal gradients and bathymetric drop-offs.'
    },
    {
      id: 'GradientBoosting',
      name: 'Gradient Boosted Trees (XGBoost)',
      tag: 'High Precision on Rare Hotspots',
      estimators: '100 Boosting Iterations',
      maxDepth: '6 Levels',
      description: 'Sequential gradient descent boosting over residual catch probability errors. Highly sensitive to localized upwelling chlorophyll boundaries.'
    },
    {
      id: 'NeuralNetwork',
      name: 'Deep Multi-Layer Perceptron (MLP)',
      tag: 'Dense Neural Representation',
      estimators: '32 x 16 Hidden Neurons',
      maxDepth: 'ReLU + Adam Optimizer',
      description: 'Multi-layer feed-forward neural network. Maps multi-spectral satellite reflectance directly to fish school presence.'
    }
  ];

  const features = [
    { name: 'SST Thermal Front Gradient (|∇SST|)', weight: 38.5, desc: 'Sharp temperature boundaries (>0.4°C/10km) where tuna baitfish concentrate' },
    { name: 'Chlorophyll-a Concentration (mg/m³)', weight: 26.8, desc: 'Phytoplankton density indicating coastal upwelling and trophic productivity' },
    { name: 'Sea Surface Temperature (°C)', weight: 15.7, desc: 'Optimal physiological temperature range for Yellowfin (28.0 - 29.2°C)' },
    { name: 'Ocean Surface Current Velocity (m/s)', weight: 11.2, desc: 'Cyclonic eddy convergence zones and current shears' },
    { name: 'Dissolved Oxygen & Continental Shelf Depth', weight: 7.8, desc: 'Oxygen minimum zone boundaries and 100-200m depth contours' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-purple-500/20 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-400/30">
                <Cpu className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white">
                {t.navModels === 'AI Model Benchmarks' ? 'AI Machine Learning Architecture Comparison' : 'AI ආකෘති කාර්යක්ෂමතාව සංසන්දනය'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Comparative benchmark of Random Forest, XGBoost / Gradient Boosting, and Neural Networks for daily Potential Fishing Zone (PFZ) classification.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span className="text-slate-300">Ground Truth: Historical Catch Logs & NARA Ocean Survey</span>
          </div>
        </div>
      </div>

      {/* Model Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {modelSpecs.map((m) => {
          const metrics = models[m.id] || { accuracy: 0.9, f1_score: 0.85 };
          const isSelected = activeModel === m.id;

          return (
            <div
              key={m.id}
              className={`glass-panel rounded-2xl p-5 border transition-all shadow-xl flex flex-col justify-between ${
                isSelected
                  ? 'border-purple-400/60 bg-purple-950/20 shadow-purple-500/10 ring-1 ring-purple-400/30'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-purple-300 border border-slate-700">
                    {m.tag}
                  </span>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      Active Model
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white mt-3">
                  {m.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {m.description}
                </p>

                {/* Score Grid */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Validation Accuracy</div>
                    <div className="text-xl font-bold font-mono text-cyan-300 mt-0.5">
                      {(metrics.accuracy * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">F1 Classification Score</div>
                    <div className="text-xl font-bold font-mono text-purple-300 mt-0.5">
                      {(metrics.f1_score * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Parameters */}
                <div className="mt-3 space-y-1 text-[11px] text-slate-400 font-mono">
                  <div>• Architecture: <span className="text-slate-300">{m.estimators}</span></div>
                  <div>• Depth / Tuning: <span className="text-slate-300">{m.maxDepth}</span></div>
                </div>
              </div>

              <button
                onClick={() => setActiveModel(m.id)}
                className={`mt-5 w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isSelected ? 'Currently Selected' : `Deploy ${m.name.split(' ')[0]}`}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Feature Importance Analysis */}
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 shadow-xl">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Oceanographic Feature Importance Breakdown
            </h3>
            <p className="text-xs text-slate-400">
              Gini impurity importance across 2,200 training samples in the Sri Lankan Exclusive Economic Zone.
            </p>
          </div>
        </div>

        <div className="space-y-4 mt-6">
          {features.map((f) => (
            <div key={f.name}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-200">{f.name}</span>
                <span className="font-mono font-bold text-cyan-300">{f.weight}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${f.weight * 2}%` }}
                ></div>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
