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
  Sparkles
} from "lucide-react";
import axios from "axios";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
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
        timeout: 35000 // 35 seconds (slightly more than server timeout)
      });
      setResult(response.data);
    } catch (err: any) {
      console.error("Analysis failed", err);
      if (err.code === 'ECONNABORTED') {
        setError("The request timed out. The model might be warming up or the text is too large. Please try again in a moment.");
      } else {
        setError(err.response?.data?.error || err.response?.data?.details || "Analysis failed. Please check your API key and network connection.");
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
        <span 
          key={i}
          className={cn(
            "inline-flex items-center px-1.5 py-0.5 rounded border text-sm font-medium mx-0.5 transition-colors hover:bg-opacity-30 cursor-default",
            labelColors[entity.label]
          )}
          title={`Confidence: ${(entity.confidence * 100).toFixed(1)}%`}
        >
          {entity.text}
          <span className="ml-1.5 text-[9px] opacity-80 font-bold uppercase tracking-wider">{entity.label}</span>
        </span>
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
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-1 bg-indigo-500 rounded-full" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-100">Text Intelligence</h1>
          </div>
          <p className="text-zinc-400 text-sm md:text-base max-w-2xl">Analyze multilingual text for named entities with high precision using advanced NLP models.</p>
        </div>
        <div className="flex items-center gap-3 bg-[#121212] p-2 rounded-xl border border-zinc-800/60 shadow-sm">
          <div className="flex flex-col px-2">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Confidence Threshold</span>
            <div className="flex items-center gap-3">
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                value={confidence} 
                onChange={(e) => setConfidence(parseFloat(e.target.value))}
                className="w-32 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="text-xs font-mono text-indigo-400 font-medium w-8 text-right bg-indigo-500/10 px-1.5 py-0.5 rounded">
                {confidence.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-zinc-800/60 shadow-xl shadow-black/20 bg-[#121212]/80 backdrop-blur-xl overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <CardContent className="p-1">
          <textarea
            className="w-full min-h-[240px] p-5 bg-transparent border-none focus:ring-0 outline-none resize-y text-zinc-100 placeholder:text-zinc-600 text-base leading-relaxed"
            placeholder="Paste your text here (Hindi, Tamil, English, etc.) for analysis..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="p-4 bg-zinc-900/50 border-t border-zinc-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-b-xl">
            <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
              <span className="flex items-center gap-1.5 bg-zinc-800/50 px-2 py-1 rounded-md"><Hash className="h-3.5 w-3.5 text-zinc-400" /> {text.length} chars</span>
              <span className="flex items-center gap-1.5 bg-zinc-800/50 px-2 py-1 rounded-md"><TypeIcon className="h-3.5 w-3.5 text-zinc-400" /> {text.split(/\s+/).filter(Boolean).length} words</span>
            </div>
            <Button 
              onClick={handleAnalyze} 
              disabled={isLoading || !text.trim()}
              className="w-full sm:w-auto gap-2 shadow-lg shadow-indigo-500/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Extract Entities</span>
                </>
              )}
            </Button>
          </div>
          {error && (
            <div className="m-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="lg:col-span-2 border-zinc-800/60 shadow-xl shadow-black/20 bg-[#121212]/80 backdrop-blur-xl overflow-hidden flex flex-col">
            <CardHeader className="border-b border-zinc-800/60 bg-zinc-900/50 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-medium text-zinc-100">Analysis Results</CardTitle>
                  <CardDescription className="text-xs mt-1 text-zinc-400">Detected entities with semantic labels</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                    {result.language}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 leading-loose text-zinc-300 whitespace-pre-wrap flex-1 overflow-y-auto">
              {renderHighlightedText()}
            </CardContent>
          </Card>

          <Card className="border-zinc-800/60 shadow-xl shadow-black/20 bg-[#121212]/80 backdrop-blur-xl flex flex-col h-[500px]">
            <CardHeader className="border-b border-zinc-800/60 bg-zinc-900/50 py-4 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium text-zinc-100">Extracted Entities</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={copyToClipboard} className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-900/80 sticky top-0 z-10 backdrop-blur-sm">
                  <tr>
                    <th className="px-4 py-3 border-b border-zinc-800/60">Entity</th>
                    <th className="px-4 py-3 border-b border-zinc-800/60">Type</th>
                    <th className="px-4 py-3 border-b border-zinc-800/60 text-right">Conf.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {result.entities.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-12 text-center text-zinc-500 text-sm">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Search className="h-6 w-6 text-zinc-600 mb-2" />
                          <p>No entities detected</p>
                          <p className="text-xs text-zinc-600">Try lowering the confidence threshold</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    result.entities.map((entity, i) => (
                      <tr key={i} className="hover:bg-zinc-800/30 transition-colors group">
                        <td className="px-4 py-3 font-medium text-zinc-200 group-hover:text-indigo-300 transition-colors">{entity.text}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider border",
                            entity.label === "PER" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                            entity.label === "LOC" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          )}>
                            {entity.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-zinc-400">
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
