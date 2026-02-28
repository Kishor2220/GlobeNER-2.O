import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { TextAnalysis } from "./components/TextAnalysis";
import { BatchUpload } from "./components/BatchUpload";
import { Analytics } from "./components/Analytics";
import { KnowledgeGraph } from "./components/KnowledgeGraph";
import { ReliabilityDashboard } from "./components/ReliabilityDashboard";
import { ApiDocs } from "./components/ApiDocs";
import { Settings } from "./components/Settings";
import { Button } from "./components/ui/Button";

const queryClient = new QueryClient();

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-[#0a0a0a] text-zinc-100 p-6">
          <div className="max-w-md text-center space-y-4">
            <div className="h-16 w-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-zinc-400 text-sm">{this.state.error?.message}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Reload Application
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = React.useState("analysis");

  const renderContent = () => {
    switch (activeTab) {
      case "analysis":
        return <TextAnalysis />;
      case "batch":
        return <BatchUpload />;
      case "analytics":
        return <Analytics />;
      case "graph":
        return <KnowledgeGraph />;
      case "reliability":
        return <ReliabilityDashboard />;
      case "docs":
        return <ApiDocs />;
      case "settings":
        return <Settings />;
      default:
        return <TextAnalysis />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <div className="flex h-screen w-full bg-[#0a0a0a] text-zinc-100 overflow-hidden font-sans selection:bg-indigo-500/30">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <main className="flex-1 overflow-y-auto bg-[#0a0a0a] relative">
            {/* Subtle background gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
            
            <div className="mx-auto max-w-[1600px] p-6 lg:p-10 relative z-10">
              {renderContent()}
            </div>
          </main>
        </div>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
