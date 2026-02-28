import * as React from "react";
import { 
  Search, 
  UploadCloud, 
  BarChart3, 
  FileJson, 
  Settings, 
  Globe,
  Menu,
  X,
  ChevronRight,
  Share2,
  Zap
} from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/Button";
import { Tooltip } from "./ui/Tooltip";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [isOpen, setIsOpen] = React.useState(true);

  const navItems = [
    { id: "analysis", label: "Text Analysis", icon: Search, description: "Extract entities from text" },
    { id: "batch", label: "Batch Upload", icon: UploadCloud, description: "Process multiple files" },
    { id: "analytics", label: "Analytics", icon: BarChart3, description: "View intelligence insights" },
    { id: "graph", label: "Knowledge Graph", icon: Share2, description: "Explore entity relationships" },
    { id: "docs", label: "API Docs", icon: FileJson, description: "System integration guide" },
    { id: "settings", label: "Settings", icon: Settings, description: "Configure system parameters" },
  ];

  return (
    <div 
      className={cn(
        "flex flex-col border-r border-zinc-800/60 bg-[#0a0a0a] transition-all duration-300 relative z-20",
        isOpen ? "w-64" : "w-[72px]"
      )}
    >
      <div className="flex h-20 items-center justify-between px-6 border-b border-white/5 bg-white/[0.01]">
        {isOpen && (
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
              <Globe className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-zinc-100 tracking-tighter uppercase text-lg leading-none">GlobeNER</span>
              <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] mt-1">Intel Bureau</span>
            </div>
          </div>
        )}
        {!isOpen && (
          <div className="mx-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <Globe className="h-5 w-5" />
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-2 p-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="mb-6 mt-4 px-4">
          <p className={cn("text-[10px] font-bold text-zinc-700 uppercase tracking-[0.3em] transition-opacity duration-300", isOpen ? "opacity-100" : "opacity-0 hidden")}>
            Operations
          </p>
        </div>
        {navItems.map((item) => (
          <Tooltip key={item.id} content={item.description} position="right" disabled={isOpen}>
            <button
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "group flex w-full items-center gap-4 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 relative overflow-hidden",
                activeTab === item.id
                  ? "bg-indigo-500/10 text-indigo-400 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]"
                  : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-200"
              )}
            >
              {activeTab === item.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
              )}
              <item.icon className={cn("h-5 w-5 shrink-0 transition-all duration-300", activeTab === item.id ? "text-indigo-400 scale-110" : "text-zinc-600 group-hover:text-zinc-400")} />
              {isOpen && <span className="whitespace-nowrap uppercase tracking-tight">{item.label}</span>}
              {activeTab === item.id && isOpen && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              )}
            </button>
          </Tooltip>
        ))}
      </nav>

      <div className="p-6 border-t border-white/5 bg-white/[0.01]">
        {isOpen ? (
          <div className="flex items-center gap-4 rounded-2xl p-3 bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all cursor-pointer group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-lg group-hover:scale-105 transition-transform">
              AU
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-zinc-200 truncate uppercase tracking-tight">Admin User</span>
              <span className="text-[10px] text-zinc-600 font-bold flex items-center gap-1.5 uppercase tracking-widest">
                <Zap className="h-3 w-3 text-amber-500 fill-amber-500/20" /> Clearance Level 5
              </span>
            </div>
          </div>
        ) : (
          <Tooltip content="Admin User - Clearance Level 5" position="right">
            <div className="mx-auto h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-lg cursor-pointer hover:scale-110 transition-transform">
              AU
            </div>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
