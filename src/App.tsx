import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar } from "./components/Sidebar";
import { TextAnalysis } from "./components/TextAnalysis";
import { BatchUpload } from "./components/BatchUpload";
import { Analytics } from "./components/Analytics";
import { KnowledgeGraph } from "./components/KnowledgeGraph";
import { ApiDocs } from "./components/ApiDocs";
import { Settings } from "./components/Settings";

const queryClient = new QueryClient();

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
      <div className="flex h-screen w-full bg-white overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-1 overflow-y-auto bg-zinc-50/30">
          <div className="mx-auto max-w-7xl p-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </QueryClientProvider>
  );
}
