import { create } from 'zustand';

interface Entity {
  text: string;
  type: string;
  confidence: number;
  startIndex: number;
  endIndex: number;
}

interface Document {
  id: string;
  filename: string;
  type: string;
  processed_at: string;
  processing_time: number;
  status: string;
}

interface DashboardStats {
  totalDocuments: number;
  totalEntities: number;
  averageConfidence: number;
  averageProcessingTime: number;
  typeDistribution: { type: string; count: number }[];
}

interface GraphData {
  nodes: any[];
  links: any[];
}

interface AppState {
  activeWorkspace: 'overview' | 'investigation' | 'relationships' | 'monitor';
  documents: Document[];
  entities: Entity[];
  anomalies: any[];
  stats: any | null;
  analytics: {
    frequency: { name: string; value: number }[];
    distribution: { name: string; value: number }[];
    relationships: GraphData;
  };
  systemHealth: {
    status: string;
    ner: string;
    pdf: string;
    memory?: any;
    uptime?: number;
    metrics?: any;
  };
  isProcessing: boolean;
  error: string | null;
  selectedDocument: any | null;
  
  setActiveWorkspace: (workspace: 'overview' | 'investigation' | 'relationships' | 'monitor') => void;
  fetchDashboard: () => Promise<void>;
  fetchHealth: () => Promise<void>;
  fetchSystemMetrics: () => Promise<void>;
  uploadFile: (file: File) => Promise<void>;
  analyzeText: (text: string) => Promise<void>;
  setError: (error: string | null) => void;
  setSelectedDocument: (doc: any | null) => void;
}

export const useStore = create<AppState>((set, get) => ({
  activeWorkspace: 'overview',
  documents: [],
  entities: [],
  anomalies: [],
  stats: null,
  analytics: {
    frequency: [],
    distribution: [],
    relationships: { nodes: [], links: [] }
  },
  systemHealth: {
    status: 'loading',
    ner: 'loading',
    pdf: 'loading'
  },
  isProcessing: false,
  error: null,
  selectedDocument: null,

  setActiveWorkspace: (activeWorkspace) => set({ activeWorkspace }),
  setSelectedDocument: (selectedDocument) => set({ selectedDocument }),

  setError: (error) => set({ error }),

  fetchHealth: async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      set((state) => ({ systemHealth: { ...state.systemHealth, ...data } }));
    } catch (err) {
      set((state) => ({ systemHealth: { ...state.systemHealth, status: 'error' } }));
    }
  },

  fetchSystemMetrics: async () => {
    try {
      const res = await fetch('/api/system');
      const data = await res.json();
      set((state) => ({ 
        systemHealth: { 
          ...state.systemHealth, 
          memory: data.memory, 
          uptime: data.uptime,
          metrics: data.stats
        } 
      }));
    } catch (err) {
      console.error('Failed to fetch system metrics');
    }
  },

  fetchDashboard: async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const data = await res.json();
      set({ 
        stats: data.stats,
        documents: data.documents,
        analytics: data.analytics,
        anomalies: data.anomalies
      });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  uploadFile: async (file: File) => {
    set({ isProcessing: true, error: null });
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }
      await get().fetchDashboard();
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isProcessing: false });
    }
  },

  analyzeText: async (text: string) => {
    set({ isProcessing: true, error: null });
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error('Analysis failed');
      await get().fetchDashboard();
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isProcessing: false });
    }
  }
}));
