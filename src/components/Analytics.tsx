import * as React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  LineChart,
  Line
} from "recharts";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import { Button } from "./ui/Button";
import { Tooltip } from "./ui/Tooltip";
import { 
  Loader2, 
  TrendingUp, 
  Users, 
  MapPin, 
  Building2, 
  Globe, 
  Database, 
  AlertTriangle, 
  BarChart3, 
  Activity, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  History,
  Share2,
  Bell,
  ShieldAlert,
  Info,
  Filter,
  Fingerprint,
  Zap,
  Target,
  AlertCircle
} from "lucide-react";

export function Analytics() {
  const [alertFilter, setAlertFilter] = React.useState("ALL");
  const [selectedAlert, setSelectedAlert] = React.useState<any>(null);

  const { data: analyticsData, isLoading: isLoadingAnalytics, error: analyticsError } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const response = await axios.get("/api/analytics", { timeout: 5000 });
      return response.data || {};
    },
    staleTime: 30000,
  });

  const { data: alertsData } = useQuery({
    queryKey: ['alerts', alertFilter],
    queryFn: async () => {
      const response = await axios.get(`/api/alerts?severity=${alertFilter}`, { timeout: 5000 });
      return Array.isArray(response.data) ? response.data : [];
    },
    staleTime: 30000,
  });

  const { data: behaviorDataArray } = useQuery({
    queryKey: ['behavior'],
    queryFn: async () => {
      const response = await axios.get("/api/behavior", { timeout: 5000 });
      return Array.isArray(response.data) ? response.data : [];
    },
    staleTime: 30000,
  });

  const data = analyticsData;
  const alerts = alertsData || [];
  const behaviorData = behaviorDataArray || [];
  const isLoading = isLoadingAnalytics;
  const error = analyticsError ? (analyticsError as Error).message : null;

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm text-zinc-400 font-medium animate-pulse">Aggregating intelligence data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center text-center p-6 bg-[#121212]/50 rounded-xl border border-zinc-800/60">
        <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-100">Analytics Unavailable</h3>
        <p className="text-zinc-400 max-w-md mt-2 text-sm">{error}</p>
        <Button variant="outline" className="mt-8 shadow-sm" onClick={() => window.location.reload()}>Retry Connection</Button>
      </div>
    );
  }

  const entityData = Array.isArray(data?.distribution) ? data.distribution : [];
  const frequencyData = Array.isArray(data?.frequency) ? data.frequency.slice(0, 10) : [];
  const trendingData = Array.isArray(data?.trending) ? data.trending : [];
  const activeData = Array.isArray(data?.active) ? data.active : [];
  const activityData = data?.activity || { trends: [], timeline: [], tracker: [] };
  const relationshipEvolution = data?.relationship_evolution || { new: [], strengthened: [], fading: [] };
  const totalProcessed = typeof data?.total_processed === 'number' ? data.total_processed : 0;
  
  const totalEntityValue = entityData.reduce((acc: number, curr: any) => acc + (curr?.value || 0), 0);

  if (totalProcessed === 0 && !isLoading) {
    return (
      <div className="flex h-[600px] flex-col items-center justify-center text-center p-12 bg-[#121212]/50 rounded-xl border border-zinc-800/60">
        <div className="h-20 w-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-inner shadow-black/50">
          <BarChart3 className="h-10 w-10 text-zinc-700" />
        </div>
        <h3 className="text-xl font-semibold text-zinc-100">No Data Available</h3>
        <p className="max-w-sm mt-2 text-zinc-400 text-sm">Process documents in the Text Analysis or Batch Upload tabs to generate intelligence insights.</p>
        <Button variant="outline" className="mt-8 shadow-sm" onClick={() => window.location.reload()}>Refresh Dashboard</Button>
      </div>
    );
  }

  const COLORS = ["#6366f1", "#10b981", "#a855f7", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1.5 bg-indigo-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-zinc-100 uppercase">Intelligence Bureau</h1>
          </div>
          <p className="text-zinc-500 text-sm md:text-base max-w-2xl font-mono uppercase tracking-widest">Strategic Entity Analysis & Behavioral Monitoring</p>
        </div>
        <Tooltip content="Total number of text signals processed by the system" position="left">
          <div className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/5 px-6 py-4 rounded-2xl shadow-2xl shadow-black/40 flex items-center gap-5 group hover:border-indigo-500/30 transition-all cursor-help">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
              <Database className="h-6 w-6 text-indigo-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-[0.2em] mb-1">Signals Processed</span>
              <span className="text-3xl font-bold text-zinc-100 leading-none font-mono">{totalProcessed.toLocaleString()}</span>
            </div>
          </div>
        </Tooltip>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-white/5 shadow-2xl shadow-black/40 bg-[#0a0a0a]/80 backdrop-blur-2xl">
          <CardHeader className="border-b border-white/5 bg-white/[0.02] py-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-zinc-100 flex items-center gap-3 uppercase tracking-tight">
                  <TrendingUp className="h-5 w-5 text-indigo-400" />
                  High-Influence Entities
                </CardTitle>
                <CardDescription className="text-xs mt-1 text-zinc-500 font-mono uppercase tracking-wider">Primary intelligence targets by detection frequency</CardDescription>
              </div>
              <Tooltip content="Real-time data feed active" position="left">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 cursor-help">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Live Feed</span>
                </div>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent className="h-[400px] p-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={frequencyData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#71717a", fontWeight: 600 }} width={120} />
                <RechartsTooltip 
                  cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="intel-card p-4 min-w-[200px] space-y-3">
                          <p className="text-zinc-100 font-bold uppercase tracking-tight border-b border-white/5 pb-2">{data.name}</p>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Occurrences</span>
                              <span className="text-xs text-indigo-400 font-mono font-bold">{data.value}</span>
                            </div>
                            {data.score && (
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Intel Score</span>
                                <span className="text-xs text-emerald-400 font-mono font-bold">{data.score.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20}>
                  {frequencyData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "#818cf8" : "rgba(99, 102, 241, 0.6)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-white/5 shadow-2xl shadow-black/40 bg-[#0a0a0a]/80 backdrop-blur-2xl flex flex-col">
          <CardHeader className="border-b border-white/5 bg-white/[0.02] py-5 shrink-0">
            <CardTitle className="text-lg font-bold text-zinc-100 flex items-center gap-3 uppercase tracking-tight">
              <Globe className="h-5 w-5 text-indigo-400" />
              Categorical Distribution
            </CardTitle>
            <CardDescription className="text-xs mt-1 text-zinc-500 font-mono uppercase tracking-wider">Intelligence classification breakdown</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-8">
            <div className="h-[220px] w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  {entityData.length > 0 && (
                    <Pie
                      data={entityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {entityData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                      ))}
                    </Pie>
                  )}
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: "#0a0a0a", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.5)", color: "#f4f4f5" }}
                    itemStyle={{ fontWeight: 600, fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-bold text-zinc-100 font-mono">
                  {totalEntityValue}
                </span>
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em] mt-2">Total Signals</span>
              </div>
            </div>
            
            <div className="mt-10 w-full space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {entityData.map((item: any, i: number) => {
                const percentage = totalEntityValue > 0 ? ((item.value || 0) / totalEntityValue) * 100 : 0;
                return (
                  <div key={i} className="flex items-center justify-between text-sm p-3 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:border-white/10 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] group-hover:text-zinc-200 transition-colors">{item.name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] text-zinc-600 font-mono font-bold">{percentage.toFixed(1)}%</span>
                      <span className="font-mono font-bold text-zinc-200 bg-white/[0.05] px-3 py-1 rounded-lg min-w-[50px] text-center border border-white/[0.05]">{item.value || 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-white/5 shadow-2xl shadow-black/40 bg-[#0a0a0a]/80 backdrop-blur-2xl">
          <CardHeader className="border-b border-white/5 bg-white/[0.02] py-5">
            <CardTitle className="text-lg font-bold text-zinc-100 flex items-center gap-3 uppercase tracking-tight">
              <History className="h-5 w-5 text-sky-400" />
              Intelligence Timeline
            </CardTitle>
            <CardDescription className="text-xs mt-1 text-zinc-500 font-mono uppercase tracking-wider">Entity extraction activity over time</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[250px] w-full">
              {Array.isArray(activityData?.timeline) && activityData.timeline.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activityData.timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis 
                      dataKey="timestamp" 
                      stroke="#3f3f46" 
                      fontSize={10} 
                      tickFormatter={(val) => {
                        const date = new Date(val);
                        return `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:00`;
                      }}
                    />
                    <YAxis stroke="#3f3f46" fontSize={10} />
                    <RechartsTooltip 
                      content={({ active, payload, label }: any) => {
                        if (active && payload && payload.length) {
                          const date = new Date(label);
                          return (
                            <div className="intel-card p-3 min-w-[150px]">
                              <p className="text-[10px] text-zinc-500 mb-2 font-mono uppercase tracking-widest border-b border-white/5 pb-1">{date.toLocaleString()}</p>
                              <p className="text-sm font-bold text-sky-400 font-mono">{payload[0].value} SIGNALS</p>
                              {payload[0].payload.entities && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {payload[0].payload.entities.map((e: string, i: number) => (
                                    <span key={i} className="text-[8px] bg-white/[0.05] text-zinc-400 px-1.5 py-0.5 rounded border border-white/[0.05]">{e}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#38bdf8" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: "#38bdf8", strokeWidth: 0 }}
                      activeDot={{ r: 6, strokeWidth: 0, fill: "#fff" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                  No timeline data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 shadow-2xl shadow-black/40 bg-[#0a0a0a]/80 backdrop-blur-2xl">
          <CardHeader className="border-b border-white/5 bg-white/[0.02] py-5">
            <CardTitle className="text-lg font-bold text-zinc-100 flex items-center gap-3 uppercase tracking-tight">
              <Clock className="h-5 w-5 text-amber-400" />
              Signal Tracker
            </CardTitle>
            <CardDescription className="text-xs mt-1 text-zinc-500 font-mono uppercase tracking-wider">Real-time appearance log</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {activityData.tracker.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between group p-2 rounded-lg hover:bg-white/[0.02] transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${item.is_recent ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)] animate-pulse' : 'bg-zinc-800'}`} />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors uppercase tracking-tight">{item.entity_name}</span>
                      <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-[0.2em]">{item.entity_type}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-600 font-bold">{item.time_ago}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-white/5 shadow-2xl shadow-black/40 bg-[#0a0a0a]/80 backdrop-blur-2xl">
          <CardHeader className="border-b border-white/5 bg-white/[0.02] py-5">
            <CardTitle className="text-lg font-bold text-zinc-100 flex items-center gap-3 uppercase tracking-tight">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              Momentum Analysis
            </CardTitle>
            <CardDescription className="text-xs mt-1 text-zinc-500 font-mono uppercase tracking-wider">Activity velocity detection</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {activityData.trends.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:border-emerald-500/20 transition-all group">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors uppercase tracking-tight">{item.entity_name}</span>
                    <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">{item.entity_type}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2">
                        {item.direction === 'up' ? (
                          <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                        ) : item.direction === 'down' ? (
                          <ArrowDownRight className="h-4 w-4 text-rose-400" />
                        ) : null}
                        <span className={`text-sm font-mono font-bold ${item.direction === 'up' ? 'text-emerald-400' : item.direction === 'down' ? 'text-rose-400' : 'text-zinc-500'}`}>
                          {item.change_percent > 0 ? '+' : ''}{item.change_percent}%
                        </span>
                      </div>
                      <span className="text-[9px] text-zinc-700 uppercase font-bold tracking-tighter">24H VELOCITY</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 shadow-2xl shadow-black/40 bg-[#0a0a0a]/80 backdrop-blur-2xl">
          <CardHeader className="border-b border-white/5 bg-white/[0.02] py-5">
            <CardTitle className="text-lg font-bold text-zinc-100 flex items-center gap-3 uppercase tracking-tight">
              <Activity className="h-5 w-5 text-indigo-400" />
              Network Hubs
            </CardTitle>
            <CardDescription className="text-xs mt-1 text-zinc-500 font-mono uppercase tracking-wider">Entities with highest relationship density</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {activeData.length === 0 ? (
                <p className="text-center py-12 text-zinc-600 text-xs italic font-mono uppercase">Insufficient data for hub analysis</p>
              ) : (
                activeData.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:border-indigo-500/20 transition-all group">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors uppercase tracking-tight">{item.entity_name}</span>
                      <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">{item.entity_type}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-mono font-bold text-zinc-300">{item.relationship_count}</span>
                        <span className="text-[9px] text-zinc-700 uppercase font-bold tracking-tighter">LINKS</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-mono font-bold text-indigo-400">{item.total_occurrence_count}</span>
                        <span className="text-[9px] text-zinc-700 uppercase font-bold tracking-tighter">HITS</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-3 border-white/5 shadow-2xl shadow-black/40 bg-[#0a0a0a]/80 backdrop-blur-2xl">
          <CardHeader className="border-b border-white/5 bg-white/[0.02] py-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Fingerprint className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-zinc-100 uppercase tracking-tight">Behavioral Intelligence Matrix</CardTitle>
                <CardDescription className="text-xs mt-1 text-zinc-500 font-mono uppercase tracking-wider">Classification of entities based on interaction patterns and anomaly detection</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {behaviorData.slice(0, 10).map((item: any, i: number) => (
                <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.03] flex flex-col gap-4 group hover:border-indigo-500/40 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-zinc-100 truncate max-w-[120px] uppercase tracking-tight">{item.entity_name}</span>
                      <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest">{item.entity_type}</span>
                    </div>
                    <div className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                      item.behavior_classification === 'Highly Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      item.behavior_classification === 'Emerging' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                      item.behavior_classification === 'Suspicious' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.2)]' :
                      item.behavior_classification === 'Declining' ? 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20' :
                      'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    }`}>
                      {item.behavior_classification}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-500 uppercase font-bold tracking-widest">Behavior Score</span>
                      <span className="text-zinc-300 font-mono font-bold">{(item.behavior_score * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          item.behavior_score > 0.8 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' :
                          item.behavior_score > 0.5 ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]' :
                          'bg-zinc-600'
                        }`}
                        style={{ width: `${item.behavior_score * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.03]">
                    <div className="flex items-center gap-2">
                      <Target className="h-3 w-3 text-zinc-700" />
                      <span className="text-[10px] text-zinc-600 font-bold">{item.document_count} DOCS</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-3 w-3 text-zinc-700" />
                      <span className="text-[10px] text-zinc-600 font-bold">{item.total_occurrence_count} HITS</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-white/5 shadow-2xl shadow-black/40 bg-[#0a0a0a]/80 backdrop-blur-2xl">
          <CardHeader className="border-b border-white/5 bg-white/[0.02] py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-rose-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-zinc-100 uppercase tracking-tight">Intelligence Alerts</CardTitle>
                  <CardDescription className="text-xs mt-1 text-zinc-500 font-mono uppercase tracking-wider">Real-time monitoring of intelligence signals</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-3 w-3 text-zinc-600" />
                <select 
                  className="bg-transparent text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-none focus:ring-0 cursor-pointer"
                  value={alertFilter}
                  onChange={(e) => setAlertFilter(e.target.value)}
                >
                  <option value="ALL">All Severities</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-700">
                  <ShieldAlert className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-xs font-mono uppercase tracking-[0.3em]">No active alerts detected</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {alerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`p-5 hover:bg-white/[0.02] transition-all cursor-pointer group relative overflow-hidden ${selectedAlert?.id === alert.id ? 'bg-white/[0.04]' : ''}`}
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <div className="flex items-start justify-between gap-4 relative z-10">
                        <div className="flex items-start gap-4">
                          <div className={`mt-1 h-2 w-2 rounded-full shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.5)] ${
                            alert.severity === 'HIGH' ? 'bg-rose-500 shadow-rose-500/50' :
                            alert.severity === 'MEDIUM' ? 'bg-amber-500 shadow-amber-500/50' :
                            'bg-sky-500 shadow-sky-500/50'
                          }`} />
                          <div>
                            <p className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors uppercase tracking-tight">
                              {alert.alert_type.replace(/_/g, ' ')}
                            </p>
                            <p className="text-[10px] text-zinc-600 mt-1 font-mono font-bold uppercase tracking-widest">
                              {new Date(alert.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${
                          alert.severity === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          alert.severity === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-sky-500/10 text-sky-400 border-sky-500/20'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <div className={`absolute inset-y-0 left-0 w-1 ${
                        alert.severity === 'HIGH' ? 'bg-rose-500/50' : 
                        alert.severity === 'MEDIUM' ? 'bg-amber-500/50' : 
                        'bg-sky-500/50'
                      } opacity-0 group-hover:opacity-100 transition-opacity`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 shadow-2xl shadow-black/40 bg-[#0a0a0a]/80 backdrop-blur-2xl flex flex-col">
          <CardHeader className="border-b border-white/5 bg-white/[0.02] py-5 shrink-0">
            <CardTitle className="text-lg font-bold text-zinc-100 flex items-center gap-3 uppercase tracking-tight">
              <Info className="h-5 w-5 text-indigo-400" />
              Intelligence Briefing
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 flex-1 flex flex-col items-center justify-center text-center">
            {selectedAlert ? (
              <div className="w-full text-left space-y-6">
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.03] shadow-inner">
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-3">Signal Analysis</p>
                  <p className="text-sm text-zinc-300 leading-relaxed italic font-medium">
                    "{selectedAlert.explanation}"
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-3">Related Entities</p>
                  <div className="flex flex-wrap gap-2">
                    {JSON.parse(selectedAlert.related_entities).map((entity: string, i: number) => (
                      <span key={i} className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-tight">
                        {entity}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="pt-6 border-t border-white/[0.03]">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-[10px] h-10 font-bold uppercase tracking-widest border-white/10 hover:bg-white/5"
                    onClick={() => setSelectedAlert(null)}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-zinc-700">
                <Info className="h-16 w-16 mx-auto mb-6 opacity-10" />
                <p className="text-xs font-mono uppercase tracking-[0.2em]">Select an alert to view detailed intelligence analysis</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-white/5 shadow-2xl shadow-black/40 bg-[#0a0a0a]/80 backdrop-blur-2xl">
          <CardHeader className="border-b border-white/5 bg-white/[0.02] py-5">
            <CardTitle className="text-sm font-bold text-zinc-100 flex items-center gap-3 uppercase tracking-tight">
              <Share2 className="h-4 w-4 text-emerald-400" />
              New Formations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {relationshipEvolution.new.length === 0 ? (
                <p className="text-center py-10 text-zinc-700 text-[10px] font-mono uppercase tracking-widest">No new links detected</p>
              ) : (
                relationshipEvolution.new.map((rel: any, i: number) => (
                  <div key={i} className="text-[11px] p-4 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:border-emerald-500/30 transition-all group">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-300 font-bold uppercase tracking-tight group-hover:text-emerald-400 transition-colors">{rel.source_name} ↔ {rel.target_name}</span>
                      <span className="text-emerald-400 font-bold text-[9px] uppercase tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded">NEW</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 shadow-2xl shadow-black/40 bg-[#0a0a0a]/80 backdrop-blur-2xl">
          <CardHeader className="border-b border-white/5 bg-white/[0.02] py-5">
            <CardTitle className="text-sm font-bold text-zinc-100 flex items-center gap-3 uppercase tracking-tight">
              <TrendingUp className="h-4 w-4 text-indigo-400" />
              Strengthening
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {relationshipEvolution.strengthened.length === 0 ? (
                <p className="text-center py-10 text-zinc-700 text-[10px] font-mono uppercase tracking-widest">No strengthening links</p>
              ) : (
                relationshipEvolution.strengthened.map((rel: any, i: number) => (
                  <div key={i} className="text-[11px] p-4 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:border-indigo-500/30 transition-all group">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-300 font-bold uppercase tracking-tight group-hover:text-indigo-400 transition-colors">{rel.source_name} ↔ {rel.target_name}</span>
                      <span className="text-indigo-400 font-bold font-mono">+{rel.relationship_strength_score.toFixed(1)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 shadow-2xl shadow-black/40 bg-[#0a0a0a]/80 backdrop-blur-2xl">
          <CardHeader className="border-b border-white/5 bg-white/[0.02] py-5">
            <CardTitle className="text-sm font-bold text-zinc-100 flex items-center gap-3 uppercase tracking-tight">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              Fading Links
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {relationshipEvolution.fading.length === 0 ? (
                <p className="text-center py-10 text-zinc-700 text-[10px] font-mono uppercase tracking-widest">No fading links detected</p>
              ) : (
                relationshipEvolution.fading.map((rel: any, i: number) => (
                  <div key={i} className="text-[11px] p-4 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:border-rose-500/30 transition-all group">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 font-bold uppercase tracking-tight group-hover:text-rose-400 transition-colors">{rel.source_name} ↔ {rel.target_name}</span>
                      <span className={`font-bold text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded ${rel.co_occurrence_trend === 'FADING' ? 'text-rose-400 bg-rose-500/10' : 'text-amber-400/60 bg-amber-500/10'}`}>
                        {rel.co_occurrence_trend}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
