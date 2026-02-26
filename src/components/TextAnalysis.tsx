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
  Percent
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
        PER: "bg-blue-100 text-blue-800 border-blue-200",
        LOC: "bg-green-100 text-green-800 border-green-200",
        ORG: "bg-purple-100 text-purple-800 border-purple-200",
      };

      parts.push(
        <span 
          key={i}
          className={cn(
            "inline-flex items-center px-1.5 py-0.5 rounded border text-sm font-medium mx-0.5",
            labelColors[entity.label]
          )}
          title={`Confidence: ${(entity.confidence * 100).toFixed(1)}%`}
        >
          {entity.text}
          <span className="ml-1 text-[10px] opacity-70 font-bold uppercase">{entity.label}</span>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Text Intelligence</h1>
          <p className="text-zinc-500">Analyze multilingual text for named entities with high precision.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-zinc-100 px-3 py-1.5 rounded-md border border-zinc-200">
            <span className="text-xs font-medium text-zinc-600">Threshold:</span>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05" 
              value={confidence} 
              onChange={(e) => setConfidence(parseFloat(e.target.value))}
              className="w-24 h-1.5 bg-zinc-300 rounded-lg appearance-none cursor-pointer accent-zinc-900"
            />
            <span className="text-xs font-mono text-zinc-900 w-8 text-right">
              {confidence.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <Card className="border-zinc-200 shadow-sm">
        <CardContent className="p-6">
          <textarea
            className="w-full min-h-[200px] p-4 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none resize-none text-zinc-900 placeholder:text-zinc-400"
            placeholder="Paste your text here (Hindi, Tamil, English, etc.)..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> {text.length} characters</span>
              <span className="flex items-center gap-1"><TypeIcon className="h-3 w-3" /> {text.split(/\s+/).filter(Boolean).length} words</span>
            </div>
            <Button 
              onClick={handleAnalyze} 
              disabled={isLoading || !text.trim()}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Analyze Text</span>
                </>
              )}
            </Button>
          </div>
          {error && (
            <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-200 flex items-center gap-2 text-red-700 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="lg:col-span-2 border-zinc-200 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-zinc-100 bg-zinc-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Highlighted Results</CardTitle>
                  <CardDescription>Detected entities with semantic labels.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded bg-zinc-200 text-[10px] font-bold uppercase text-zinc-700">
                    {result.language}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 leading-relaxed text-zinc-800 whitespace-pre-wrap">
              {renderHighlightedText()}
            </CardContent>
          </Card>

          <Card className="border-zinc-200 shadow-sm">
            <CardHeader className="border-b border-zinc-100 bg-zinc-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Entity Table</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={copyToClipboard} className="h-8 w-8">
                    {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-100">
                  <tr>
                    <th className="px-4 py-3 font-medium">Entity</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium text-right">Conf.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {result.entities.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-zinc-400 italic">
                        No entities detected above threshold.
                      </td>
                    </tr>
                  ) : (
                    result.entities.map((entity, i) => (
                      <tr key={i} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-zinc-900">{entity.text}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-bold",
                            entity.label === "PER" ? "bg-blue-100 text-blue-700" :
                            entity.label === "LOC" ? "bg-green-100 text-green-700" :
                            "bg-purple-100 text-purple-700"
                          )}>
                            {entity.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-zinc-600">
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
