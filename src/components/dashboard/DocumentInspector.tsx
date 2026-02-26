import React from 'react';
import { X, FileText, Calendar, Clock, Database, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button } from '../ui/Base';

export const DocumentInspector = ({ doc, onClose }: { doc: any; onClose: () => void }) => {
  if (!doc) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <Card className="flex flex-col h-full border-zinc-700 shadow-2xl shadow-black">
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                <FileText size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{doc.filename}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant="info">{doc.type}</Badge>
                  <span className="text-xs text-zinc-500 flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(doc.processed_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <Button variant="ghost" onClick={onClose} className="p-2">
              <X size={24} />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Database size={14} />
                  Extracted Intelligence
                </h3>
                <div className="p-6 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                  {doc.content}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Tag size={14} />
                  Metrics
                </h3>
                <div className="space-y-3">
                  <MetricRow label="Processing Time" value={`${(doc.processing_time / 1000).toFixed(3)}s`} />
                  <MetricRow label="Character Count" value={doc.content.length} />
                  <MetricRow label="Status" value={doc.status.toUpperCase()} />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-600/5 border border-emerald-500/10">
                <p className="text-[10px] text-emerald-500/60 leading-relaxed">
                  This document has been indexed and mapped to the global knowledge graph. Entities extracted are available for cross-referencing.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>Close Inspector</Button>
            <Button variant="primary">Export Intelligence</Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

const MetricRow = ({ label, value }: any) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
    <span className="text-[10px] text-zinc-500 font-bold uppercase">{label}</span>
    <span className="text-sm font-medium text-zinc-200">{value}</span>
  </div>
);
