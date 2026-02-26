import React, { useEffect } from 'react';
import { Activity, Cpu, Database, Zap, AlertCircle, CheckCircle2, Clock, Server } from 'lucide-react';
import { Card, Badge, Button } from '../ui/Base';
import { useStore } from '../../lib/store';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const SystemMonitorWorkspace = () => {
  const { systemHealth, fetchSystemMetrics } = useStore();

  useEffect(() => {
    fetchSystemMetrics();
    const interval = setInterval(fetchSystemMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const memoryData = systemHealth.memory ? [
    { name: 'Used', value: Math.round(systemHealth.memory.rss / 1024 / 1024) },
    { name: 'Heap', value: Math.round(systemHealth.memory.heapUsed / 1024 / 1024) }
  ] : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">System Monitor</h2>
          <p className="text-zinc-500 mt-1">Real-time performance and engine health metrics.</p>
        </div>
        <Badge variant={systemHealth.status === 'ok' ? 'success' : 'error'}>
          {systemHealth.status === 'ok' ? 'System Operational' : 'System Degraded'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MonitorCard 
          label="Avg Latency" 
          value={`${(systemHealth.metrics?.avgLatency / 1000 || 0).toFixed(2)}s`} 
          icon={Clock} 
          status="normal" 
        />
        <MonitorCard 
          label="Failure Rate" 
          value={`${(systemHealth.metrics?.failureRate || 0).toFixed(1)}%`} 
          icon={AlertCircle} 
          status={systemHealth.metrics?.failureRate > 5 ? 'warning' : 'normal'} 
        />
        <MonitorCard 
          label="Uptime" 
          value={`${Math.floor(systemHealth.uptime / 3600 || 0)}h ${Math.floor((systemHealth.uptime % 3600) / 60 || 0)}m`} 
          icon={Server} 
          status="normal" 
        />
        <MonitorCard 
          label="Memory RSS" 
          value={`${Math.round(systemHealth.memory?.rss / 1024 / 1024 || 0)}MB`} 
          icon={Cpu} 
          status="normal" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Activity size={16} />
            Engine Readiness
          </h3>
          <div className="space-y-6">
            <EngineStatus 
              name="NER Inference Engine" 
              status={systemHealth.ner} 
              desc="Multilingual XLM-RoBERTa model on Hugging Face" 
            />
            <EngineStatus 
              name="PDF Extraction Engine" 
              status={systemHealth.pdf} 
              desc="Mozilla PDF.js Legacy Worker" 
            />
            <EngineStatus 
              name="SQLite Persistence" 
              status="ready" 
              desc="Better-SQLite3 Local Database" 
            />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Database size={16} />
            Memory Usage (MB)
          </h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[{v: 10}, {v: 25}, {v: 15}, {v: 30}, {v: 20}]}>
                <Area type="monotone" dataKey="v" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Heap Total</span>
              <span className="text-zinc-300 font-mono">{Math.round(systemHealth.memory?.heapTotal / 1024 / 1024 || 0)} MB</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Heap Used</span>
              <span className="text-zinc-300 font-mono">{Math.round(systemHealth.memory?.heapUsed / 1024 / 1024 || 0)} MB</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const MonitorCard = ({ label, value, icon: Icon, status }: any) => (
  <Card className="p-6 flex items-center gap-4">
    <div className={`p-3 rounded-xl bg-zinc-900 ${status === 'warning' ? 'text-amber-500' : 'text-emerald-500'}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</p>
      <h3 className="text-xl font-bold text-white mt-0.5">{value}</h3>
    </div>
  </Card>
);

const EngineStatus = ({ name, status, desc }: any) => (
  <div className="flex items-start justify-between p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
    <div>
      <h4 className="text-sm font-bold text-zinc-200">{name}</h4>
      <p className="text-xs text-zinc-500 mt-1">{desc}</p>
    </div>
    <div className="flex items-center gap-2">
      <span className={`text-[10px] font-bold uppercase tracking-widest ${status === 'ready' ? 'text-emerald-500' : 'text-rose-500'}`}>
        {status === 'ready' ? 'Operational' : 'Offline'}
      </span>
      {status === 'ready' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <AlertCircle size={16} className="text-rose-500" />}
    </div>
  </div>
);
