import * as React from "react";
import { 
  Loader2, 
  Copy, 
  Download, 
  Check, 
  AlertCircle,
  Hash,
  Type as TypeIcon,
  Search,
  Percent,
  Sparkles,
  Info
} from "lucide-react";
import axios from "axios";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import { Tooltip } from "./ui/Tooltip";
import { cn } from "../lib/utils";

interface Entity {
  text: string;
  label: "PER" | "LOC" | "ORG";
  confidence: number;
  start: number;
  end: number;
}

interface AnalysisResult {
  entities: Entity[];
  language: string;
  highlighted_text: string;
}

export function TextAnalysis() {
  const [text, setText] = React.useState("");
  const [confidence, setConfidence] = React.useState(0.5);
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<AnalysisResult | null>(null);
  const [copied, setCopied] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post("/api/analyze", { 
        text, 
        confidenceThreshold: confidence 
      }, {
        timeout: 120000 // Increased timeout for local inference (2 mins)
      });
      setResult(response.data);
    } catch (err: any) {
      console.error("Analysis failed", err);
      if (err.code === 'ECONNABORTED') {
        setError("The request timed out. The local model might be warming up or the text is too large. Please try again in a moment.");
      } else {
        setError(err.response?.data?.error || err.response?.data?.details || "Analysis failed. Please check the server logs.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderHighlightedText = () => {
    if (!result) return text;

    const entities = [...result.entities].sort((a, b) => a.start - b.start);
    const parts = [];
    let lastIndex = 0;

    entities.forEach((entity, i) => {
      // Add text before entity
      if (entity.start > lastIndex) {
        parts.push(text.slice(lastIndex, entity.start));
      }

      // Add highlighted entity
      const labelColors = {
        PER: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        LOC: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        ORG: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      };

      parts.push(
        <Tooltip key={i} content={`Confidence: ${(entity.confidence * 100).toFixed(1)}%`} position="top">
          <span 
            className={cn(
              "inline-flex items-center px-1.5 py-0.5 rounded border text-sm font-medium mx-0.5 transition-colors hover:bg-opacity-30 cursor-default",
              labelColors[entity.label] || "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
            )}
          >
            {entity.text}
            <span className="ml-1.5 text-[9px] opacity-80 font-bold uppercase tracking-wider">{entity.label}</span>
          </span>
        </Tooltip>
      );

      lastIndex = entity.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1.5 bg-indigo-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-zinc-100 uppercase">Text Intelligence</h1>
          </div>
          <p className="text-zinc-500 text-sm md:text-base max-w-2xl font-mono uppercase tracking-widest">Multilingual Signal Extraction & Semantic Analysis</p>
        </div>
        <div className="flex items-center gap-4 bg-[#0a0a0a]/80 backdrop-blur-2xl p-4 rounded-2xl border border-white/5 shadow-2xl shadow-black/40">
          <div className="flex flex-col px-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Confidence Threshold</span>
              <Tooltip content="Higher threshold means fewer, but more accurate results." position="top">
                <Info className="h-3 w-3 text-zinc-500 cursor-help" />
              </Tooltip>
            </div>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                value={confidence} 
                onChange={(e) => setConfidence(parseFloat(e.target.value))}
                className="w-32 h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="text-xs font-mono text-indigo-400 font-bold bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20 min-w-[45px] text-center">
                {confidence.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-white/5 shadow-2xl shadow-black/40 bg-[#0a0a0a]/80 backdrop-blur-2xl overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        <CardContent className="p-1">
          <textarea
            className="w-full min-h-[280px] p-8 bg-transparent border-none focus:ring-0 outline-none resize-y text-zinc-100 placeholder:text-zinc-700 text-lg leading-relaxed font-medium"
            placeholder="Input raw signal data for intelligence extraction... (e.g., 'Apple CEO Tim Cook visited Cupertino on Friday.')"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="p-6 bg-white/[0.02] border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 rounded-b-2xl">
            <div className="flex items-center gap-6 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
              <span className="flex items-center gap-2 bg-white/[0.03] px-3 py-1.5 rounded-xl border border-white/[0.03]"><Hash className="h-3.5 w-3.5" /> {text.length} CHARS</span>
              <span className="flex items-center gap-2 bg-white/[0.03] px-3 py-1.5 rounded-xl border border-white/[0.03]"><TypeIcon className="h-3.5 w-3.5" /> {text.split(/\s+/).filter(Boolean).length} WORDS</span>
            </div>
            <Tooltip content={!text.trim() ? "Enter text to analyze" : "Run extraction pipeline"} position="top">
              <Button 
                onClick={handleAnalyze} 
                disabled={isLoading || !text.trim()}
                className="w-full sm:w-auto gap-3 h-12 px-8 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    <span>Extract Signals</span>
                  </>
                )}
              </Button>
            </Tooltip>
          </div>
          {error && (
            <div className="m-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-4 text-rose-400 text-sm font-medium animate-in fade-in slide-in-from-top-4">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <Card className="lg:col-span-2 border-white/5 shadow-2xl shadow-black/40 bg-[#0a0a0a]/80 backdrop-blur-2xl overflow-hidden flex flex-col">
            <CardHeader className="border-b border-white/5 bg-white/[0.02] py-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-zinc-100 uppercase tracking-tight">Signal Analysis</CardTitle>
                  <CardDescription className="text-xs mt-1 text-zinc-500 font-mono uppercase tracking-wider">Detected entities with semantic classification</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip content="Detected language" position="top">
                    <span className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400 cursor-help">
                      {result.language}
                    </span>
                  </Tooltip>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 leading-loose text-zinc-300 whitespace-pre-wrap flex-1 overflow-y-auto text-lg">
              {renderHighlightedText()}
            </CardContent>
          </Card>

          <Card className="border-white/5 shadow-2xl shadow-black/40 bg-[#0a0a0a]/80 backdrop-blur-2xl flex flex-col h-[600px]">
            <CardHeader className="border-b border-white/5 bg-white/[0.02] py-6 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-zinc-100 uppercase tracking-tight">Extracted Data</CardTitle>
                <div className="flex gap-2">
                  <Tooltip content="Copy JSON" position="top">
                    <Button variant="ghost" size="icon" onClick={copyToClipboard} className="h-10 w-10 rounded-xl text-zinc-500 hover:text-zinc-100 hover:bg-white/5">
                      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </Tooltip>
                  <Tooltip content="Download CSV" position="top">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-zinc-500 hover:text-zinc-100 hover:bg-white/5">
                      <Download className="h-4 w-4" />
                    </Button>
                  </Tooltip>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] bg-zinc-900/80 sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="px-6 py-4 border-b border-white/5">Entity</th>
                    <th className="px-6 py-4 border-b border-white/5">Type</th>
                    <th className="px-6 py-4 border-b border-white/5 text-right">Conf.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {result.entities.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-20 text-center text-zinc-700">
                        <div className="flex flex-col items-center justify-center gap-4">
                          <Search className="h-10 w-10 opacity-10 mb-2" />
                          <p className="text-xs font-mono uppercase tracking-[0.3em]">No signals detected</p>
                          <p className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest">Adjust threshold for sensitivity</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    result.entities.map((entity, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-all group cursor-default">
                        <td className="px-6 py-4 font-bold text-zinc-200 group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{entity.text}</td>
                        <td className="px-6 py-4">
                          <Tooltip content={`Entity Type: ${entity.label}`} position="top">
                            <span className={cn(
                              "px-2.5 py-1 rounded-lg text-[9px] font-bold tracking-[0.2em] border uppercase cursor-help",
                              entity.label === "PER" ? "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]" :
                              entity.label === "LOC" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]" :
                              entity.label === "ORG" ? "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]" :
                              "bg-zinc-500/10 text-zinc-400 border-zinc-500/20 shadow-[0_0_10px_rgba(113,113,122,0.1)]"
                            )}>
                              {entity.label}
                            </span>
                          </Tooltip>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-[10px] text-zinc-500 font-bold">
                          {(entity.confidence * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
