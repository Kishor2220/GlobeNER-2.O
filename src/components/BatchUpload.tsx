import * as React from "react";
import { useDropzone } from "react-dropzone";
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle2, 
  Loader2, 
  Download,
  AlertTriangle
} from "lucide-react";
import axios from "axios";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import { cn } from "../lib/utils";

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
    
    // Check health before processing
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
          timeout: 60000 // 60s timeout for file upload
        });
        
        if (response.data.type === "batch") {
          response.data.results.forEach((res: any) => {
            newResults.push({
              fileName: `${file.name} (Row)`,
              status: res.error ? "error" : "success",
              entities: res.entities?.length || 0,
              language: "Multilingual (Auto)",
              error: res.error
            });
          });
        } else {
          newResults.push({
            fileName: file.name,
            status: "success",
            entities: response.data.entities.length,
            language: "Multilingual (Auto)"
          });
        }
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Batch Processing</h1>
        <p className="text-zinc-500">Upload multiple documents to extract entities at scale.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card 
            {...getRootProps()} 
            className={cn(
              "border-2 border-dashed transition-colors cursor-pointer",
              isDragActive ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 hover:border-zinc-400"
            )}
          >
            <CardContent className="p-12 flex flex-col items-center justify-center text-center">
              <input {...getInputProps()} />
              <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 mb-4">
                <Upload className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">Drop files here</h3>
              <p className="text-sm text-zinc-500 mt-1">Support for .txt, .csv, and .json files</p>
              <Button variant="outline" className="mt-6">Select Files</Button>
            </CardContent>
          </Card>

          {files.length > 0 && (
            <Card className="border-zinc-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">Queue ({files.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[300px] overflow-y-auto divide-y divide-zinc-100">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-zinc-400" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-zinc-900 truncate max-w-[200px]">{file.name}</span>
                          <span className="text-[10px] text-zinc-500">{(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeFile(i)} className="h-8 w-8 text-zinc-400 hover:text-red-500">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-zinc-50 border-t border-zinc-100">
                  {isProcessing ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span>Processing batch...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-zinc-900 transition-all duration-300" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <Button onClick={processBatch} className="w-full">Process {files.length} Files</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="border-zinc-200 shadow-sm flex flex-col">
          <CardHeader className="border-b border-zinc-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Process Logs</CardTitle>
                <CardDescription>Results from your recent batch jobs.</CardDescription>
              </div>
              {results.length > 0 && (
                <Button variant="outline" size="sm" className="h-8 gap-2">
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto max-h-[600px]">
            {results.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center text-zinc-400">
                <div className="h-12 w-12 rounded-full bg-zinc-50 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 opacity-20" />
                </div>
                <p className="text-sm">No batch jobs processed yet.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-100">
                  <tr>
                    <th className="px-4 py-3 font-medium">File</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Entities</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {results.map((res, i) => (
                    <tr key={i} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-zinc-900 truncate max-w-[150px]">{res.fileName}</td>
                      <td className="px-4 py-3">
                        {res.status === "success" ? (
                          <div className="flex items-center gap-1.5 text-green-600 font-medium text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{res.language}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-red-500 font-medium text-xs">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>Error</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-zinc-600">
                        {res.entities || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
