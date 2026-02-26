import React, { useState, useEffect } from 'react';
import { Search, Filter, Tag, Calendar, Shield, ChevronRight, FileText, User, MapPin, Building2 } from 'lucide-react';
import { Card, Badge, Button } from '../ui/Base';
import { useStore } from '../../lib/store';

export const InvestigationWorkspace = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const { setSelectedDocument } = useStore();

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length > 2) {
      const res = await fetch(`/api/investigate?query=${val}`);
      const data = await res.json();
      setResults(data);
    } else {
      setResults([]);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Intelligence Investigation</h2>
          <p className="text-zinc-500 mt-1">Deep search and entity profiling across all documents.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Filter size={14} />
              Analysis Filters
            </h3>
            <div className="space-y-4">
              <FilterGroup label="Entity Type">
                <FilterOption label="Person" count={12} />
                <FilterOption label="Location" count={8} />
                <FilterOption label="Organization" count={15} />
              </FilterGroup>
              <FilterGroup label="Confidence">
                <FilterOption label="High (>90%)" />
                <FilterOption label="Medium (50-90%)" />
                <FilterOption label="Low (<50%)" />
              </FilterGroup>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            <input 
              type="text" 
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search entities, aliases, or identifiers..." 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-lg focus:outline-none focus:border-emerald-500/50 transition-all shadow-xl shadow-black/20"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.length > 0 ? results.map((entity, i) => (
              <Card key={i} className="p-6 hover:border-emerald-500/30 transition-all group cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-zinc-800 text-zinc-500 group-hover:text-emerald-500 transition-colors">
                      <EntityIcon type={entity.type} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">{entity.text}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="info">{entity.type}</Badge>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                          {entity.mentions_count} Mentions
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-zinc-800 group-hover:text-zinc-500 transition-colors" />
                </div>
                
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="p-2 rounded-lg bg-zinc-950/50 border border-zinc-900">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">First Seen</p>
                    <p className="text-xs text-zinc-300 mt-1">{new Date(entity.first_seen).toLocaleDateString()}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-950/50 border border-zinc-900">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">Avg Confidence</p>
                    <p className="text-xs text-emerald-500 mt-1 font-bold">{(entity.avg_confidence * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </Card>
            )) : query.length > 2 ? (
              <div className="col-span-2 py-20 text-center">
                <Search size={48} className="mx-auto mb-4 text-zinc-800" />
                <p className="text-zinc-500">No entities found matching "{query}"</p>
              </div>
            ) : (
              <div className="col-span-2 py-20 text-center">
                <Tag size={48} className="mx-auto mb-4 text-zinc-800" />
                <p className="text-zinc-500">Enter a search term to begin investigation.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const FilterGroup = ({ label, children }: any) => (
  <div className="space-y-2">
    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{label}</p>
    <div className="space-y-1">{children}</div>
  </div>
);

const FilterOption = ({ label, count }: any) => (
  <button className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
    <span>{label}</span>
    {count !== undefined && <span className="text-[10px] text-zinc-600 font-bold">{count}</span>}
  </button>
);

const EntityIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'PER': return <User size={20} />;
    case 'LOC': return <MapPin size={20} />;
    case 'ORG': return <Building2 size={20} />;
    default: return <Tag size={20} />;
  }
};
