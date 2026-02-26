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
import { Loader2, TrendingUp, Users, MapPin, Building2, Globe, Database, AlertTriangle } from "lucide-react";

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
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center text-center p-6">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-zinc-900">Analytics Error</h3>
        <p className="text-zinc-500 max-w-md mt-2">{error}</p>
        <Button variant="outline" className="mt-6" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const entityData = data?.distribution || [];
  const frequencyData = data?.frequency?.slice(0, 10) || [];
  const totalProcessed = data?.total_processed || 0;

  const COLORS = ["#3b82f6", "#22c55e", "#a855f7", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Intelligence Dashboard</h1>
          <p className="text-zinc-500">Global insights from your analyzed text data.</p>
        </div>
        <div className="bg-zinc-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3">
          <Database className="h-4 w-4 text-zinc-400" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-zinc-400 leading-none">Total Processed</span>
            <span className="text-lg font-bold leading-none mt-1">{totalProcessed}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-zinc-500" />
              Top Entities
            </CardTitle>
            <CardDescription>Most frequently detected entities across all documents.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={frequencyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#71717a" }} width={150} />
                <Tooltip 
                  cursor={{ fill: "#f4f4f5" }}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e4e4e7", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                />
                <Bar dataKey="value" fill="#18181b" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-4 w-4 text-zinc-500" />
              Type Distribution
            </CardTitle>
            <CardDescription>Breakdown of entity categories.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={entityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {entityData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-6 w-full space-y-2">
              {entityData.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-zinc-600">{item.name}</span>
                  </div>
                  <span className="font-bold text-zinc-900">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
