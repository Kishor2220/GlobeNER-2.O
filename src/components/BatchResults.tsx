import * as React from "react";
import { 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileText,
  Search,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import { Button } from "./ui/Button";
import { cn } from "../lib/utils";
import { Tooltip } from "./ui/Tooltip";

interface Entity {
  text: string;
  label: "PER" | "LOC" | "ORG";
  confidence: number;
  start: number;
  end: number;
}

interface BatchResult {
  fileName: string;
  extractedText: string;
  entities: Entity[];
  entityCount: number;
  processingTime: string;
  status: string;
  error?: string;
}

interface BatchResultsProps {
  results: BatchResult[];
}

export function BatchResults({ results }: BatchResultsProps) {
  const [expandedFile, setExpandedFile] = React.useState<string | null>(null);

  const exportCSV = () => {
    if (results.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "File Name,Entity Text,Entity Type,Confidence,Start,End\n";
    
    results.forEach(res => {
      if (res.status === "success" && res.entities) {
        res.entities.forEach(ent => {
          const text = ent.text.replace(/"/g, '""');
          csvContent += `"${res.fileName}","${text}","${ent.label}",${ent.confidence},${ent.start},${ent.end}\n`;
        });
      }
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `batch_results_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    if (results.length === 0) return;
    
    const jsonContent = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", jsonContent);
    link.setAttribute("download", `batch_results_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (results.length === 0) {
    return (
      <Card className="border-zinc-800/60 shadow-xl shadow-black/20 bg-[#121212]/80 backdrop-blur-xl flex flex-col h-[600px]">
        <CardHeader className="border-b border-zinc-800/60 bg-zinc-900/50 shrink-0">
          <CardTitle className="text-base font-medium text-zinc-100">Batch Results</CardTitle>
          <CardDescription className="text-xs mt-1 text-zinc-400">Results from your recent batch jobs</CardDescription>
        </CardHeader>
        <CardContent className="p-0 flex-1 flex flex-col items-center justify-center text-center text-zinc-500 p-12">
          <div className="h-16 w-16 rounded-2xl bg-zinc-900/50 border border-zinc-800/60 flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-zinc-700" />
          </div>
          <p className="text-sm font-medium text-zinc-400">No batch jobs processed yet</p>
          <p className="text-xs mt-1">Upload files to see results here</p>
        </CardContent>
      </Card>
    );
  }

  const renderHighlightedText = (text: string, entities: Entity[]) => {
    if (!text) return null;
    if (!Array.isArray(entities) || entities.length === 0) return text;

    const sortedEntities = [...entities].sort((a, b) => a.start - b.start);
    const parts = [];
    let lastIndex = 0;

    sortedEntities.forEach((entity, i) => {
      if (entity.start > lastIndex) {
        parts.push(text.slice(lastIndex, entity.start));
      }

      const labelColors = {
        PER: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        LOC: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        ORG: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      };

      parts.push(
        <Tooltip key={i} content={`Confidence: ${(entity.confidence * 100).toFixed(1)}%`} position="top">
          <span 
            className={cn(
              "inline-flex items-center px-1.5 py-0.5 rounded border text-sm font-medium mx-0.5 transition-colors hover:bg-opacity-30 cursor-help",
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

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-100">Batch Results</h2>
        <div className="flex items-center gap-2">
          <Tooltip content="Export results as CSV" position="top">
            <Button variant="outline" size="sm" onClick={exportCSV} className="h-8 gap-2 text-xs">
              <Download className="h-3.5 w-3.5" />
              CSV
            </Button>
          </Tooltip>
          <Tooltip content="Export results as JSON" position="top">
            <Button variant="outline" size="sm" onClick={exportJSON} className="h-8 gap-2 text-xs">
              <Download className="h-3.5 w-3.5" />
              JSON
            </Button>
          </Tooltip>
        </div>
      </div>
      <div className="space-y-4">
        {results.map((res, i) => {
          const isExpanded = expandedFile === res.fileName + i;
          return (
            <Card key={i} className="border-zinc-800/60 shadow-lg shadow-black/20 bg-[#121212]/80 backdrop-blur-xl overflow-hidden transition-all duration-300">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/30 transition-colors"
                onClick={() => setExpandedFile(isExpanded ? null : res.fileName + i)}
              >
                <div className="flex items-center gap-4">
                  {res.status === "success" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-200">{res.fileName}</span>
                    {res.status === "success" && (
                      <span className="text-xs text-zinc-500 flex items-center gap-2 mt-1">
                        <span className="bg-zinc-800 px-2 py-0.5 rounded-md text-zinc-300">
                          {res.entityCount} entities
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {res.processingTime}
                        </span>
                      </span>
                    )}
                    {res.status === "error" && (
                      <span className="text-xs text-red-400 mt-1">{res.error}</span>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400">
                  <Tooltip content={isExpanded ? "Collapse details" : "Expand details"} position="left">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Tooltip>
                </Button>
              </div>

              {isExpanded && res.status === "success" && (
                <div className="border-t border-zinc-800/60 bg-zinc-900/30 p-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800/60">
                    <div className="p-6 max-h-[400px] overflow-y-auto custom-scrollbar">
                      <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Extracted Text</h4>
                      <div className="text-sm leading-loose text-zinc-300 whitespace-pre-wrap">
                        {renderHighlightedText(res.extractedText, res.entities)}
                      </div>
                    </div>
                    <div className="p-0 max-h-[400px] overflow-y-auto custom-scrollbar flex flex-col">
                      <div className="p-4 border-b border-zinc-800/60 bg-zinc-900/50 sticky top-0 z-10 backdrop-blur-sm">
                        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Entities List</h4>
                      </div>
                      <table className="w-full text-sm text-left">
                        <thead className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-900/80 sticky top-[53px] z-10 backdrop-blur-sm">
                          <tr>
                            <th className="px-4 py-3 border-b border-zinc-800/60">Entity</th>
                            <th className="px-4 py-3 border-b border-zinc-800/60">Type</th>
                            <th className="px-4 py-3 border-b border-zinc-800/60 text-right">Conf.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                          {res.entities.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="px-4 py-8 text-center text-zinc-500 text-sm">
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <Search className="h-5 w-5 text-zinc-600 mb-1" />
                                  <p>No entities detected</p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            res.entities.map((entity, idx) => (
                              <tr key={idx} className="hover:bg-zinc-800/30 transition-colors group">
                                <td className="px-4 py-3 font-medium text-zinc-200 group-hover:text-indigo-300 transition-colors">{entity.text}</td>
                                <td className="px-4 py-3">
                                  <Tooltip content={`Entity Type: ${entity.label}`} position="top">
                                    <span className={cn(
                                      "px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider border cursor-help",
                                      entity.label === "PER" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                      entity.label === "LOC" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                      "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                    )}>
                                      {entity.label}
                                    </span>
                                  </Tooltip>
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-xs text-zinc-400">
                                  {(entity.confidence * 100).toFixed(1)}%
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
