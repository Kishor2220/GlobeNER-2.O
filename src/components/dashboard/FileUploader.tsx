import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Card, Button, Badge } from '../ui/Base';
import { useStore } from '../../lib/store';

export const FileUploader = () => {
  const { uploadFile, isProcessing, error, setError } = useStore();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadFile(acceptedFiles[0]);
    }
  }, [uploadFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'application/pdf': ['.pdf']
    }
  });

  return (
    <Card className="p-8 border-dashed border-2 border-zinc-800 hover:border-emerald-500/50 transition-all group">
      <div {...getRootProps()} className="cursor-pointer flex flex-col items-center justify-center gap-6 text-center">
        <input {...getInputProps()} />
        
        <div className={`p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 text-zinc-500 group-hover:text-emerald-500 group-hover:scale-110 transition-all shadow-xl shadow-black/20 ${isDragActive ? 'scale-110 text-emerald-500 border-emerald-500/50' : ''}`}>
          {isProcessing ? (
            <Loader2 className="animate-spin" size={48} />
          ) : (
            <Upload size={48} />
          )}
        </div>

        <div>
          <h3 className="text-xl font-bold text-zinc-100 mb-2">
            {isProcessing ? 'Processing Intelligence...' : 'Ingest Intelligence'}
          </h3>
          <p className="text-sm text-zinc-500 max-w-[300px] mx-auto leading-relaxed">
            Drag and drop your intelligence reports, datasets, or documents to extract entities and map relationships.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {['PDF', 'CSV', 'JSON', 'TXT'].map(type => (
            <Badge key={type} variant="default">{type}</Badge>
          ))}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle size={14} />
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline hover:text-rose-400">Dismiss</button>
          </div>
        )}
      </div>
    </Card>
  );
};
