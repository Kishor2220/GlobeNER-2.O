import * as React from "react";
import { 
  Code2, 
  Terminal, 
  Copy, 
  Check, 
  Play,
  ExternalLink,
  BookOpen,
  Key
} from "lucide-react";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";

export function ApiDocs() {
  const [copied, setCopied] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const curlExample = `curl -X POST https://api.globener.ai/v2/analyze \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Narendra Modi visited New Delhi.",
    "confidenceThreshold": 0.5
  }'`;

  const responseExample = `{
  "entities": [
    {
      "text": "Narendra Modi",
      "label": "PER",
      "confidence": 0.98,
      "start": 0,
      "end": 13
    },
    {
      "text": "New Delhi",
      "label": "LOC",
      "confidence": 0.95,
      "start": 21,
      "end": 30
    }
  ],
  "language": "English",
  "highlighted_text": "Narendra Modi visited New Delhi."
}`;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-1 bg-indigo-500 rounded-full" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-100">Developer API</h1>
          </div>
          <p className="text-zinc-400 text-sm md:text-base max-w-2xl">Integrate GlobeNER 2.0 intelligence directly into your applications with our RESTful API.</p>
        </div>
        <div className="flex items-center gap-3 bg-[#121212] p-2 rounded-xl border border-zinc-800/60 shadow-sm">
          <Button variant="outline" size="sm" className="gap-2 shadow-sm">
            <Key className="h-4 w-4 text-indigo-400" />
            Generate API Key
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card className="border-zinc-800/60 shadow-xl shadow-black/20 bg-[#121212]/80 backdrop-blur-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />
          <CardHeader className="border-b border-zinc-800/60 bg-zinc-900/50 py-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.1)]">POST</span>
              <code className="text-sm font-mono font-medium text-zinc-300 bg-zinc-800/50 px-2 py-1 rounded border border-zinc-700/50">/v2/analyze</code>
            </div>
            <CardTitle className="text-xl font-semibold text-zinc-100">Analyze Text</CardTitle>
            <CardDescription className="text-sm text-zinc-400 mt-1">The primary endpoint for extracting named entities from a string of text with multi-language support.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 p-6">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-400" />
                Request Parameters
              </h4>
              <div className="bg-[#0a0a0a] rounded-lg border border-zinc-800/60 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-900/80 border-b border-zinc-800/60">
                    <tr className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Field</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    <tr className="hover:bg-zinc-900/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-indigo-300 font-medium">text <span className="text-red-400 ml-1">*</span></td>
                      <td className="px-4 py-3 text-zinc-500 font-mono text-xs">string</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">The raw text to analyze. Maximum 50,000 characters per request.</td>
                    </tr>
                    <tr className="hover:bg-zinc-900/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-zinc-300 font-medium">confidenceThreshold</td>
                      <td className="px-4 py-3 text-zinc-500 font-mono text-xs">number</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">Filter entities below this score (0.0 to 1.0). Default: <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-300">0.5</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-indigo-400" />
                    cURL Request
                  </h4>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(curlExample, 'curl')} className="h-7 gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
                    {copied === 'curl' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    Copy
                  </Button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <pre className="relative bg-[#0a0a0a] text-zinc-300 p-4 rounded-lg text-xs font-mono border border-zinc-800/60 overflow-x-auto leading-relaxed custom-scrollbar shadow-inner shadow-black/50">
                    <code className="language-bash">{curlExample}</code>
                  </pre>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-indigo-400" />
                    JSON Response
                  </h4>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(responseExample, 'resp')} className="h-7 gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
                    {copied === 'resp' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    Copy
                  </Button>
                </div>
                <div className="relative group h-full">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <pre className="relative bg-[#0a0a0a] text-emerald-400/90 p-4 rounded-lg text-xs font-mono border border-zinc-800/60 overflow-x-auto leading-relaxed custom-scrollbar shadow-inner shadow-black/50 h-full max-h-[300px]">
                    <code className="language-json">{responseExample}</code>
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 rounded-xl border border-indigo-500/20 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
          <div className="relative z-10 mb-4 sm:mb-0">
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Play className="h-5 w-5 text-indigo-400 fill-indigo-400/20" />
              Interactive API Explorer
            </h3>
            <p className="text-indigo-200/70 text-sm mt-1 max-w-md">Test endpoints directly from your browser with our OpenAPI specification.</p>
          </div>
          <Button className="relative z-10 bg-indigo-500 hover:bg-indigo-400 text-white gap-2 shadow-lg shadow-indigo-500/25 border-none w-full sm:w-auto">
            Open Swagger UI
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
