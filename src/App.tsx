import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  LayoutDashboard, 
  Database, 
  Share2, 
  Zap, 
  Shield, 
  RefreshCw,
  Search,
  Bell
} from 'lucide-react';
import { useStore } from './lib/store';
import { StatsOverview } from './components/dashboard/StatsOverview';
import { EntityAnalytics } from './components/dashboard/EntityAnalytics';
import { KnowledgeGraph } from './components/dashboard/KnowledgeGraph';
import { OverviewWorkspace } from './components/dashboard/OverviewWorkspace';
import { InvestigationWorkspace } from './components/dashboard/InvestigationWorkspace';
import { RelationshipWorkspace } from './components/dashboard/RelationshipWorkspace';
import { SystemMonitorWorkspace } from './components/dashboard/SystemMonitorWorkspace';
import { DocumentInspector } from './components/dashboard/DocumentInspector';
import { Badge, Button, Card } from './components/ui/Base';

const App = () => {
  const { 
    stats, 
    documents, 
    analytics, 
    systemHealth, 
    fetchDashboard, 
    fetchHealth,
    isProcessing,
    selectedDocument,
    setSelectedDocument,
    activeWorkspace,
    setActiveWorkspace
  } = useStore();

  useEffect(() => {
    fetchDashboard();
    fetchHealth();
    
    const interval = setInterval(() => {
      fetchDashboard();
      fetchHealth();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const renderWorkspace = () => {
    switch (activeWorkspace) {
      case 'overview': return <OverviewWorkspace />;
      case 'investigation': return <InvestigationWorkspace />;
      case 'relationships': return <RelationshipWorkspace />;
      case 'monitor': return <SystemMonitorWorkspace />;
      default: return <OverviewWorkspace />;
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans selection:bg-emerald-500/30">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-zinc-950 border-r border-zinc-900 z-50 hidden lg:flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900/20">
            <Zap size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">GlobeNER</h1>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Intelligence v2.0</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavItem 
            icon={LayoutDashboard} 
            label="Overview" 
            active={activeWorkspace === 'overview'} 
            onClick={() => setActiveWorkspace('overview')}
          />
          <NavItem 
            icon={Search} 
            label="Investigation" 
            active={activeWorkspace === 'investigation'} 
            onClick={() => setActiveWorkspace('investigation')}
          />
          <NavItem 
            icon={Share2} 
            label="Relationships" 
            active={activeWorkspace === 'relationships'} 
            onClick={() => setActiveWorkspace('relationships')}
          />
          <NavItem 
            icon={Activity} 
            label="System Monitor" 
            active={activeWorkspace === 'monitor'} 
            onClick={() => setActiveWorkspace('monitor')}
          />
        </nav>

        <div className="p-4 border-t border-zinc-900">
          <Card className="p-4 bg-zinc-900/30 border-zinc-800/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Node Health</span>
              <div className={`w-2 h-2 rounded-full animate-pulse ${systemHealth.status === 'ok' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            </div>
            <div className="space-y-2">
              <HealthItem label="Inference" status={systemHealth.ner} />
              <HealthItem label="Extraction" status={systemHealth.pdf} />
            </div>
          </Card>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 min-h-screen flex flex-col">
        {/* Header */}
        <header className="h-20 border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-40 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
              <span className="text-zinc-700">Workspaces</span>
              <ChevronRight size={12} />
              <span className="text-emerald-500">{activeWorkspace}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="secondary" className="p-2 rounded-full">
              <Bell size={20} />
            </Button>
            <Button variant="secondary" onClick={fetchDashboard} disabled={isProcessing}>
              <RefreshCw size={18} className={isProcessing ? 'animate-spin' : ''} />
            </Button>
            <div className="h-8 w-px bg-zinc-800 mx-2" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white">Analyst Node</p>
                <p className="text-[10px] text-zinc-500">Global Cluster A</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 p-0.5">
                <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center">
                  <Shield size={20} className="text-emerald-500" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Workspace Content */}
        <div className="p-8 max-w-7xl mx-auto w-full flex-1">
          {renderWorkspace()}
        </div>
      </main>

      <AnimatePresence>
        {selectedDocument && (
          <DocumentInspector 
            doc={selectedDocument} 
            onClose={() => setSelectedDocument(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const NavItem = ({ icon: Icon, label, active = false, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
      active ? 'bg-emerald-600/10 text-emerald-500' : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
    }`}
  >
    <Icon size={20} className={active ? 'text-emerald-500' : 'text-zinc-600 group-hover:text-zinc-400'} />
    <span className="text-sm font-medium">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
  </button>
);

const HealthItem = ({ label, status }: any) => (
  <div className="flex items-center justify-between">
    <span className="text-[10px] text-zinc-500 font-medium">{label}</span>
    <span className={`text-[10px] font-bold ${status === 'ready' ? 'text-emerald-500' : 'text-rose-500'}`}>
      {status === 'ready' ? 'READY' : 'ERROR'}
    </span>
  </div>
);

export default App;
