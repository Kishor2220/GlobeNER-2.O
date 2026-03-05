import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar } from "./components/Sidebar";
import { TextAnalysis } from "./components/TextAnalysis";
import { BatchUpload } from "./components/BatchUpload";
import { Analytics } from "./components/Analytics";
import { KnowledgeGraph } from "./components/KnowledgeGraph";
import { ReliabilityDashboard } from "./components/ReliabilityDashboard";
import { ApiDocs } from "./components/ApiDocs";
import { Settings } from "./components/Settings";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthGuard, useAuth } from "./components/auth/AuthGuard";
import { LoginPage } from "./components/auth/LoginPage";

const queryClient = new QueryClient();

function MainContent() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = React.useState("analysis");

  if (!isAuthenticated) {
    return <LoginPage />;
  }

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
    <div className="flex h-screen w-full bg-[#0a0a0a] text-zinc-100 overflow-hidden font-sans selection:bg-indigo-500/30">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 overflow-y-auto bg-[#0a0a0a] relative">
        {/* Subtle background gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="mx-auto max-w-[1600px] p-6 lg:p-10 relative z-10">
          <ErrorBoundary>
            {renderContent()}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AuthGuard>
          <MainContent />
        </AuthGuard>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
