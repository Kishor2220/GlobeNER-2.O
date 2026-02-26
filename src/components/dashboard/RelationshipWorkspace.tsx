import React from 'react';
import { Share2, Network, Filter, Info } from 'lucide-react';
import { Card, Badge, Button } from '../ui/Base';
import { KnowledgeGraph } from './KnowledgeGraph';
import { useStore } from '../../lib/store';

export const RelationshipWorkspace = () => {
  const { analytics } = useStore();

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-500 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Relationship Intelligence</h2>
          <p className="text-zinc-500 mt-1">Mapping co-occurrences and influence networks.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="text-xs">Export Graph</Button>
          <Button variant="primary" className="text-xs">Full Screen</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1">
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Filter size={14} />
              Graph Controls
            </h3>
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Visibility</p>
                <ToggleOption label="Strong Links Only" active />
                <ToggleOption label="Person → Org Only" />
                <ToggleOption label="Show Labels" active />
              </div>
              
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Legend</h4>
                <div className="space-y-2">
                  <LegendItem color="bg-emerald-500" label="Person" />
                  <LegendItem color="bg-blue-500" label="Location" />
                  <LegendItem color="bg-amber-500" label="Organization" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-emerald-600/5 border-emerald-500/20">
            <div className="flex items-start gap-3">
              <Info size={16} className="text-emerald-500 mt-0.5" />
              <p className="text-xs text-emerald-500/80 leading-relaxed">
                Nodes are sized by mention frequency. Edge thickness represents relationship strength (co-occurrence frequency).
              </p>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3 h-[700px]">
          <KnowledgeGraph data={analytics.relationships} />
        </div>
      </div>
    </div>
  );
};

const ToggleOption = ({ label, active = false }: any) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-zinc-400">{label}</span>
    <div className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${active ? 'bg-emerald-600' : 'bg-zinc-800'}`}>
      <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${active ? 'right-1' : 'left-1'}`} />
    </div>
  </div>
);

const LegendItem = ({ color, label }: any) => (
  <div className="flex items-center gap-2">
    <div className={`w-2 h-2 rounded-full ${color}`} />
    <span className="text-[10px] text-zinc-400 font-medium">{label}</span>
  </div>
);
