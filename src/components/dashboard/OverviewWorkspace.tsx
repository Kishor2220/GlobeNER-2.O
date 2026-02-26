import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldAlert, TrendingUp, BarChart3, Zap } from 'lucide-react';
import { Card, Badge } from '../ui/Base';
import { StatsOverview } from './StatsOverview';
import { EntityAnalytics } from './EntityAnalytics';
import { useStore } from '../../lib/store';

export const OverviewWorkspace = () => {
  const { stats, anomalies, analytics } = useStore();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Intelligence Overview</h2>
          <p className="text-zinc-500 mt-1">Global situational awareness and risk assessment.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Intelligence Health</p>
            <p className={`text-2xl font-black ${stats?.healthScore > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
              {stats?.healthScore || 0}%
            </p>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-zinc-800 flex items-center justify-center">
            <Zap size={20} className="text-emerald-500" />
          </div>
        </div>
      </div>

      <StatsOverview stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <EntityAnalytics 
            frequency={analytics.frequency} 
            distribution={analytics.distribution} 
          />
        </div>
        
        <div className="space-y-8">
          <Card className="p-6 border-rose-500/20 bg-rose-500/5">
            <h3 className="text-sm font-bold text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShieldAlert size={16} />
              Risk Signals
            </h3>
            <div className="space-y-4">
              {anomalies.length > 0 ? anomalies.map((anomaly, i) => (
                <div key={i} className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-zinc-200">{anomaly.entity}</p>
                    <p className="text-[10px] text-zinc-500 mt-1">Low Confidence: {(anomaly.confidence * 100).toFixed(1)}%</p>
                  </div>
                  <Badge variant="error">High Risk</Badge>
                </div>
              )) : (
                <p className="text-xs text-zinc-500 text-center py-4">No risk signals detected.</p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp size={16} />
              Recent Anomalies
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Processing Spikes</span>
                <span className="text-emerald-500 font-bold">None</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Entity Drift</span>
                <span className="text-amber-500 font-bold">Minimal</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
