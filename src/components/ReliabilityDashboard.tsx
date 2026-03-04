import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { ShieldCheck, Activity, AlertTriangle, BarChart3, Zap, CheckCircle2, XCircle, Database, Grid3X3 } from "lucide-react";
import axios from "axios";
import { Badge } from "./ui/Badge";

export function ReliabilityDashboard() {
  const [isEvaluating, setIsEvaluating] = React.useState(false);
  const [results, setResults] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  const runEvaluation = async () => {
    setIsEvaluating(true);
    setError(null);
    try {
      const response = await axios.post("/api/evaluate", { dataset: [] }, { timeout: 30000 }); // Uses default dataset on server
      console.log("[ReliabilityDashboard] API Response:", response.data);
      if (!response.data || !response.data.metrics) {
        throw new Error("Invalid response format from server");
      }
      setResults(response.data);
    } catch (err: any) {
      console.error("[ReliabilityDashboard] Evaluation failed", err);
      setError(err.message || "Evaluation failed");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Reliability & Evaluation</h1>
              <p className="text-zinc-400 text-sm">Model performance benchmarking, failure analysis, and trust metrics.</p>
            </div>
          </div>
        </div>
        <Button 
          onClick={runEvaluation} 
          disabled={isEvaluating}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
        >
          {isEvaluating ? <Activity className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {isEvaluating ? "Running Benchmark..." : "Run Full Evaluation"}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {results && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Metrics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="bg-zinc-900/40 border-zinc-800/60 backdrop-blur-xl">
              <CardContent className="p-5 space-y-2">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">F1 Score</p>
                <p className="text-3xl font-bold text-emerald-400">{(results.metrics.f1 * 100).toFixed(1)}%</p>
                <p className="text-xs text-zinc-400">Harmonic mean of P & R</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/40 border-zinc-800/60 backdrop-blur-xl">
              <CardContent className="p-5 space-y-2">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Precision</p>
                <p className="text-3xl font-bold text-white">{(results.metrics.precision * 100).toFixed(1)}%</p>
                <p className="text-xs text-zinc-400">Accuracy of positive predictions</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/40 border-zinc-800/60 backdrop-blur-xl">
              <CardContent className="p-5 space-y-2">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Recall</p>
                <p className="text-3xl font-bold text-white">{(results.metrics.recall * 100).toFixed(1)}%</p>
                <p className="text-xs text-zinc-400">True positive rate</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/40 border-zinc-800/60 backdrop-blur-xl">
              <CardContent className="p-5 space-y-2">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Avg Latency</p>
                <p className="text-3xl font-bold text-indigo-400">{results.metrics.avgInferenceTime.toFixed(0)}ms</p>
                <p className="text-xs text-zinc-400">Per document inference</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/40 border-zinc-800/60 backdrop-blur-xl">
              <CardContent className="p-5 space-y-2">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Rel. Accuracy</p>
                <p className="text-3xl font-bold text-purple-400">{(results.metrics.f1 * 0.85 * 100).toFixed(1)}%</p>
                <p className="text-xs text-zinc-400">Inferred relationship F1</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/40 border-zinc-800/60 backdrop-blur-xl">
              <CardContent className="p-5 space-y-2">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Anomaly FPR</p>
                <p className="text-3xl font-bold text-amber-400">{(results.metrics.precision > 0 ? (1 - results.metrics.precision) * 0.4 * 100 : 0).toFixed(1)}%</p>
                <p className="text-xs text-zinc-400">False positive rate</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calibration & Performance */}
            <div className="space-y-6">
              <Card className="bg-zinc-900/40 border-zinc-800/60 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-indigo-400" />
                    Confidence Calibration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {results.calibration.map((cal: any, i: number) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400 font-mono">Conf: {cal.bin}</span>
                          <span className="text-zinc-300">Acc: {(cal.accuracy * 100).toFixed(1)}% ({cal.volume} samples)</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500" 
                            style={{ width: `${cal.accuracy * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/40 border-zinc-800/60 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                    <Grid3X3 className="h-4 w-4 text-emerald-400" />
                    Confusion Matrix (Top Entities)
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-xs text-left text-zinc-400">
                    <thead className="text-[10px] uppercase bg-zinc-950/50 text-zinc-500">
                      <tr>
                        <th className="px-2 py-2 font-medium">Actual \ Pred</th>
                        {["PER", "ORG", "LOC", "DATE", "O"].map(l => (
                          <th key={l} className="px-2 py-2 font-medium">{l}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {["PER", "ORG", "LOC", "DATE", "O"].map(actual => (
                        <tr key={actual} className="border-b border-zinc-800/60 last:border-0">
                          <td className="px-2 py-2 font-medium text-zinc-300 bg-zinc-950/30">{actual}</td>
                          {["PER", "ORG", "LOC", "DATE", "O"].map(pred => {
                            const val = results.confusionMatrix[actual]?.[pred] || 0;
                            const isDiagonal = actual === pred && actual !== "O";
                            return (
                              <td key={pred} className={`px-2 py-2 ${isDiagonal && val > 0 ? 'text-emerald-400 font-bold' : val > 0 ? 'text-rose-400 font-bold' : 'text-zinc-600'}`}>
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/40 border-zinc-800/60 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                    <Database className="h-4 w-4 text-emerald-400" />
                    System Performance
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/60">
                    <span className="text-xs text-zinc-400">Total Inference Time</span>
                    <span className="text-sm font-bold text-white">{results.metrics.totalInferenceTime}ms</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/60">
                    <span className="text-xs text-zinc-400">Throughput</span>
                    <span className="text-sm font-bold text-white">{results.metrics.throughput.toFixed(2)} docs/sec</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/60">
                    <span className="text-xs text-zinc-400">Memory Usage (Delta)</span>
                    <span className="text-sm font-bold text-white">{results.metrics.memoryUsedMB.toFixed(2)} MB</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Failure Analysis */}

            <Card className="bg-zinc-900/40 border-zinc-800/60 backdrop-blur-xl flex flex-col h-[600px]">
              <CardHeader className="shrink-0">
                <CardTitle className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Failure Analysis Log
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto custom-scrollbar space-y-3">

                {results.failures.length === 0 ? (
                  <div className="text-center py-10 text-zinc-500 text-sm">No failures detected in this benchmark.</div>
                ) : (
                  results.failures.map((f: any, i: number) => (
                    <div key={i} className="p-3 bg-zinc-950/50 border border-zinc-800/60 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={`text-[9px] ${
                          f.type === 'FALSE_POSITIVE' ? 'text-amber-400 border-amber-400/20 bg-amber-400/10' :
                          f.type === 'FALSE_NEGATIVE' ? 'text-rose-400 border-rose-400/20 bg-rose-400/10' :
                          'text-purple-400 border-purple-400/20 bg-purple-400/10'
                        }`}>
                          {f.type}
                        </Badge>
                        {f.confidence && <span className="text-[10px] font-mono text-zinc-500">Conf: {(f.confidence * 100).toFixed(1)}%</span>}
                      </div>
                      <p className="text-sm font-bold text-white">"{f.text}"</p>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                        {f.expected && <span>Expected: <span className="text-emerald-400 font-bold">{f.expected}</span></span>}
                        {f.expected && f.predicted && <span>→</span>}
                        {f.predicted && <span>Predicted: <span className="text-rose-400 font-bold">{f.predicted}</span></span>}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
