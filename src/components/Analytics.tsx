import * as React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from "recharts";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import { Button } from "./ui/Button";
import { Loader2, TrendingUp, Users, MapPin, Building2, Globe, Database, AlertTriangle, BarChart3, Activity } from "lucide-react";

export function Analytics() {
  const [data, setData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get("/api/analytics");
        setData(response.data);
      } catch (error: any) {
        console.error("Failed to fetch analytics", error);
        setError("Unable to load analytics data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

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

  const entityData = data?.distribution || [];
  const frequencyData = data?.frequency?.slice(0, 10) || [];
  const totalProcessed = data?.total_processed || 0;

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
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-1 bg-indigo-500 rounded-full" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-100">Intelligence Dashboard</h1>
          </div>
          <p className="text-zinc-400 text-sm md:text-base max-w-2xl">Global insights and entity distribution across your analyzed text data.</p>
        </div>
        <div className="bg-[#121212]/80 backdrop-blur-xl border border-zinc-800/60 px-5 py-3 rounded-xl shadow-xl shadow-black/20 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Database className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-0.5">Total Processed</span>
            <span className="text-2xl font-bold text-zinc-100 leading-none">{totalProcessed.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-zinc-800/60 shadow-xl shadow-black/20 bg-[#121212]/80 backdrop-blur-xl">
          <CardHeader className="border-b border-zinc-800/60 bg-zinc-900/50 py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium text-zinc-100 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-400" />
                  Top Entities
                </CardTitle>
                <CardDescription className="text-xs mt-1 text-zinc-400">Most frequently detected entities across all documents</CardDescription>
              </div>
              <div className="flex items-center gap-2 px-2 py-1 rounded bg-zinc-800/50 border border-zinc-700/50">
                <Activity className="h-3 w-3 text-emerald-400" />
                <span className="text-[10px] font-medium text-zinc-300 uppercase tracking-wider">Live</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[400px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={frequencyData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#27272a" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#a1a1aa", fontWeight: 500 }} width={120} />
                <Tooltip 
                  cursor={{ fill: "#27272a", opacity: 0.4 }}
                  contentStyle={{ backgroundColor: "#18181b", borderRadius: "8px", border: "1px solid #3f3f46", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.5)", color: "#f4f4f5" }}
                  itemStyle={{ color: "#818cf8", fontWeight: 600 }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24}>
                  {frequencyData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "#818cf8" : "#4f46e5"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/60 shadow-xl shadow-black/20 bg-[#121212]/80 backdrop-blur-xl flex flex-col">
          <CardHeader className="border-b border-zinc-800/60 bg-zinc-900/50 py-4 shrink-0">
            <CardTitle className="text-base font-medium text-zinc-100 flex items-center gap-2">
              <Globe className="h-4 w-4 text-indigo-400" />
              Type Distribution
            </CardTitle>
            <CardDescription className="text-xs mt-1 text-zinc-400">Breakdown of entity categories</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-6">
            <div className="h-[220px] w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={entityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {entityData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#18181b", borderRadius: "8px", border: "1px solid #3f3f46", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.5)", color: "#f4f4f5" }}
                    itemStyle={{ fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-zinc-100">
                  {entityData.reduce((acc: number, curr: any) => acc + curr.value, 0).toLocaleString()}
                </span>
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mt-1">Total</span>
              </div>
            </div>
            
            <div className="mt-8 w-full space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {entityData.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-zinc-800/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length], boxShadow: `0 0 8px ${COLORS[i % COLORS.length]}40` }} />
                    <span className="text-zinc-300 font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 font-mono">{((item.value / entityData.reduce((acc: number, curr: any) => acc + curr.value, 0)) * 100).toFixed(1)}%</span>
                    <span className="font-bold text-zinc-100 bg-zinc-800 px-2 py-0.5 rounded-md min-w-[40px] text-right">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
