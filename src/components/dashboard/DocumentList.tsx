import React from 'react';
import { FileText, Clock, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, Badge } from '../ui/Base';
import { formatDistanceToNow } from 'date-fns';
import { useStore } from '../../lib/store';

export const DocumentList = ({ documents }: { documents: any[] }) => {
  const { setSelectedDocument } = useStore();

  return (
    <Card className="flex flex-col h-full">
      <div className="p-4 border-bottom border-zinc-800 flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Recent Documents</h3>
        <Badge variant="info">{documents.length} Total</Badge>
      </div>
      <div className="flex-1 overflow-y-auto max-h-[500px]">
        {documents.length === 0 ? (
          <div className="p-8 text-center text-zinc-600">
            <FileText size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm">No documents processed yet</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {documents.map((doc) => (
              <div 
                key={doc.id} 
                onClick={() => setSelectedDocument(doc)}
                className="p-4 hover:bg-zinc-800/30 transition-colors group cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400 group-hover:text-emerald-500 transition-colors">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-zinc-200 truncate max-w-[200px]">{doc.filename}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                          <Clock size={10} />
                          {formatDistanceToNow(new Date(doc.processed_at))} ago
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {(doc.processing_time / 1000).toFixed(2)}s
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.status === 'completed' ? (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : (
                      <AlertCircle size={14} className="text-rose-500" />
                    )}
                    <ChevronRight size={14} className="text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
