import * as React from "react";
import { useDropzone } from "react-dropzone";
import { 
  Upload, 
  FileText, 
  X, 
  Loader2, 
  Database,
  FileJson,
  FileSpreadsheet
} from "lucide-react";
import axios from "axios";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { cn } from "../lib/utils";
import { BatchResults } from "./BatchResults";

export function BatchUpload() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [results, setResults] = React.useState<any[]>([]);
  const [progress, setProgress] = React.useState(0);

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/json': ['.json'],
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf']
    }
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processBatch = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    
    try {
      const health = await axios.get("/health");
      if (health.data.status !== "ok") {
        throw new Error("System is not healthy");
      }
    } catch (err) {
      setIsProcessing(false);
      alert("System is currently unavailable. Please try again later.");
      return;
    }

    const newResults = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      
      try {
        const response = await axios.post("/api/upload", formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000
        });
        
        newResults.push(response.data);
      } catch (error: any) {
        newResults.push({
          fileName: file.name,
          status: "error",
          error: error.response?.data?.error || error.message || "Failed to process"
        });
      }
      
      setProgress(Math.round(((i + 1) / files.length) * 100));
    }
    
    setResults(prev => [...newResults, ...prev]);
    setFiles([]);
    setIsProcessing(false);
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.json')) return <FileJson className="h-4 w-4 text-amber-400" />;
    if (fileName.endsWith('.csv')) return <FileSpreadsheet className="h-4 w-4 text-emerald-400" />;
    return <FileText className="h-4 w-4 text-indigo-400" />;
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-1 bg-indigo-500 rounded-full" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-100">Batch Processing</h1>
          </div>
          <p className="text-zinc-400 text-sm md:text-base max-w-2xl">Upload multiple documents to extract entities at scale using parallel processing pipelines.</p>
        </div>
        <div className="flex items-center gap-3 bg-[#121212] p-2 rounded-xl border border-zinc-800/60 shadow-sm">
          <div className="flex items-center gap-2 px-3 py-1">
            <Database className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-medium text-zinc-300">Pipeline Active</span>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div 
            {...getRootProps()} 
            className={cn(
              "border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer relative overflow-hidden group",
              isDragActive 
                ? "border-indigo-500 bg-indigo-500/5" 
                : "border-zinc-800/60 bg-[#121212]/50 hover:border-indigo-500/50 hover:bg-[#121212]/80"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="p-12 flex flex-col items-center justify-center text-center relative z-10">
              <input {...getInputProps()} />
              <div className={cn(
                "h-16 w-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 shadow-lg",
                isDragActive 
                  ? "bg-indigo-500 text-white shadow-indigo-500/25 scale-110" 
                  : "bg-zinc-900 text-zinc-400 border border-zinc-800/60 group-hover:text-indigo-400 group-hover:border-indigo-500/30"
              )}>
                <Upload className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium text-zinc-100 mb-2">
                {isDragActive ? "Drop files to upload" : "Drag & drop files here"}
              </h3>
              <p className="text-sm text-zinc-500 max-w-[250px]">
                Support for .txt, .csv, and .json files up to 50MB each
              </p>
            </div>
          </div>

          {files.length > 0 && (
            <Card className="border-zinc-800/60 shadow-xl shadow-black/20 bg-[#121212]/80 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4">
              <CardHeader className="pb-3 border-b border-zinc-800/60 bg-zinc-900/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400">Processing Queue</CardTitle>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold">
                    {files.length} FILES
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar divide-y divide-zinc-800/60">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-4 hover:bg-zinc-800/30 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                          {getFileIcon(file.name)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-zinc-200 truncate max-w-[200px] group-hover:text-indigo-300 transition-colors">{file.name}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">{(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeFile(i)} className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-zinc-900/80 border-t border-zinc-800/60 rounded-b-xl">
                  {isProcessing ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-indigo-400 flex items-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Processing batch...
                        </span>
                        <span className="font-mono text-zinc-300">{progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 transition-all duration-300 relative" 
                          style={{ width: `${progress}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-[shimmer_1s_infinite] -translate-x-full" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={processBatch} className="w-full shadow-lg shadow-indigo-500/20 gap-2">
                      <Database className="h-4 w-4" />
                      Process {files.length} Files
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <BatchResults results={results} />
      </div>
    </div>
  );
}
