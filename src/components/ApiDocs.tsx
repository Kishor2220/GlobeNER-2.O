import * as React from "react";
import { 
  Code2, 
  Terminal, 
  Copy, 
  Check, 
  Play,
  ExternalLink
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

  const curlExample = `curl -X POST http://localhost:3000/api/analyze \\
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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Developer API</h1>
        <p className="text-zinc-500">Integrate GlobeNER 2.0 intelligence directly into your applications.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-bold uppercase">POST</span>
              <code className="text-sm font-mono font-bold text-zinc-900">/api/analyze</code>
            </div>
            <CardTitle className="text-lg">Analyze Text</CardTitle>
            <CardDescription>The primary endpoint for extracting named entities from a string of text.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-zinc-900">Request Body</h4>
              <div className="bg-zinc-50 rounded-md border border-zinc-200 p-3">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-zinc-500 uppercase">
                      <th className="pb-2 font-medium">Field</th>
                      <th className="pb-2 font-medium">Type</th>
                      <th className="pb-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    <tr>
                      <td className="py-2 font-mono text-zinc-900">text</td>
                      <td className="py-2 text-zinc-500 italic">string</td>
                      <td className="py-2 text-zinc-600">The raw text to analyze. (Required)</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-zinc-900">confidenceThreshold</td>
                      <td className="py-2 text-zinc-500 italic">number</td>
                      <td className="py-2 text-zinc-600">Filter entities below this score (0-1). Default: 0.5</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-zinc-400" />
                  cURL Example
                </h4>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(curlExample, 'curl')} className="h-7 gap-1.5 text-xs">
                  {copied === 'curl' ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                  Copy
                </Button>
              </div>
              <pre className="bg-zinc-900 text-zinc-300 p-4 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
                {curlExample}
              </pre>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-zinc-400" />
                  Response Schema
                </h4>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(responseExample, 'resp')} className="h-7 gap-1.5 text-xs">
                  {copied === 'resp' ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                  Copy
                </Button>
              </div>
              <pre className="bg-zinc-50 text-zinc-600 p-4 rounded-lg text-xs font-mono border border-zinc-200 overflow-x-auto leading-relaxed">
                {responseExample}
              </pre>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between p-6 bg-zinc-900 rounded-xl text-white">
          <div>
            <h3 className="text-lg font-bold">Interactive Swagger UI</h3>
            <p className="text-zinc-400 text-sm">Explore and test all endpoints in our interactive documentation.</p>
          </div>
          <Button variant="outline" className="bg-transparent border-zinc-700 hover:bg-zinc-800 text-white gap-2">
            Open Swagger
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
