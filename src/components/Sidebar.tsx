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
  Share2
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
        "flex flex-col border-r border-zinc-200 bg-zinc-50/50 transition-all duration-300",
        isOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-bottom border-zinc-200">
        {isOpen && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <Globe className="h-5 w-5" />
            </div>
            <span className="font-bold text-zinc-900 tracking-tight">GlobeNER 2.0</span>
          </div>
        )}
        {!isOpen && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
            <Globe className="h-5 w-5" />
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsOpen(!isOpen)}
          className="hidden md:flex"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activeTab === item.id
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {isOpen && <span>{item.label}</span>}
            {isOpen && activeTab === item.id && (
              <ChevronRight className="ml-auto h-3 w-3 opacity-50" />
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-200">
        {isOpen ? (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-zinc-200" />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-zinc-900">Admin User</span>
              <span className="text-[10px] text-zinc-500">Pro Plan</span>
            </div>
          </div>
        ) : (
          <div className="mx-auto h-8 w-8 rounded-full bg-zinc-200" />
        )}
      </div>
    </div>
  );
}
