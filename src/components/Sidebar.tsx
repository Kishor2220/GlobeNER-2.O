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

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [isOpen, setIsOpen] = React.useState(true);

  const navItems = [
    { id: "analysis", label: "Text Analysis", icon: Search },
    { id: "batch", label: "Batch Upload", icon: UploadCloud },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "graph", label: "Knowledge Graph", icon: Share2 },
    { id: "docs", label: "API Docs", icon: FileJson },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div 
      className={cn(
        "flex flex-col border-r border-zinc-800/60 bg-[#0a0a0a] transition-all duration-300 relative z-20",
        isOpen ? "w-64" : "w-[72px]"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-zinc-800/60">
        {isOpen && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner shadow-indigo-500/10">
              <Globe className="h-4 w-4" />
            </div>
            <span className="font-semibold text-zinc-100 tracking-tight whitespace-nowrap">GlobeNER <span className="text-zinc-500 font-normal">2.0</span></span>
          </div>
        )}
        {!isOpen && (
          <div className="mx-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner shadow-indigo-500/10">
            <Globe className="h-4 w-4" />
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsOpen(!isOpen)}
          className={cn("hidden md:flex shrink-0 text-zinc-400 hover:text-zinc-100", !isOpen && "absolute -right-3 top-4 h-6 w-6 rounded-full border border-zinc-800 bg-[#121212] shadow-sm")}
        >
          {isOpen ? <X className="h-4 w-4" /> : <ChevronRight className="h-3 w-3" />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-3 overflow-y-auto overflow-x-hidden">
        <div className="mb-4 mt-2 px-3">
          <p className={cn("text-xs font-semibold text-zinc-500 uppercase tracking-wider transition-opacity duration-200", isOpen ? "opacity-100" : "opacity-0 hidden")}>
            Intelligence
          </p>
        </div>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative",
              activeTab === item.id
                ? "bg-indigo-500/10 text-indigo-400"
                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
            )}
          >
            {activeTab === item.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-500 rounded-r-full" />
            )}
            <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", activeTab === item.id ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300")} />
            {isOpen && <span className="whitespace-nowrap">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800/60 bg-[#0a0a0a]">
        {isOpen ? (
          <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-zinc-800/50 transition-colors cursor-pointer">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium text-xs shadow-sm">
              AU
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-zinc-200 truncate">Admin User</span>
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <Zap className="h-3 w-3 text-amber-400" /> Pro Plan
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium text-xs shadow-sm cursor-pointer hover:opacity-90 transition-opacity">
            AU
          </div>
        )}
      </div>
    </div>
  );
}
