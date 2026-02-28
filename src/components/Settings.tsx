import * as React from "react";
import { 
  Shield, 
  Cpu, 
  Database, 
  Bell, 
  User,
  Check,
  Save,
  RefreshCw,
  Key,
  Lock,
  Server,
  Activity
} from "lucide-react";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import { Tooltip } from "./ui/Tooltip";

export function Settings() {
  const [isSaving, setIsSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-1 bg-indigo-500 rounded-full" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-100">System Settings</h1>
          </div>
          <p className="text-zinc-400 text-sm md:text-base max-w-2xl">Configure model parameters, API keys, and platform preferences for your organization.</p>
        </div>
        <div className="flex items-center gap-3 bg-[#121212] p-2 rounded-xl border border-zinc-800/60 shadow-sm">
          <Tooltip content="Revert to default settings" position="top">
            <Button variant="ghost" className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">Reset Defaults</Button>
          </Tooltip>
          <Tooltip content="Apply and save current configuration" position="top">
            <Button onClick={handleSave} disabled={isSaving} className="gap-2 min-w-[140px] shadow-lg shadow-indigo-500/20">
              {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : (saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />)}
              {saved ? "Changes Saved" : "Save Configuration"}
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card className="border-zinc-800/60 shadow-xl shadow-black/20 bg-[#121212]/80 backdrop-blur-xl overflow-hidden">
          <CardHeader className="border-b border-zinc-800/60 bg-zinc-900/50 py-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-medium text-zinc-100 flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-indigo-400" />
                  Inference Engine Configuration
                </CardTitle>
                <CardDescription className="text-sm text-zinc-400 mt-1">Configure the underlying NER model behavior and hardware acceleration.</CardDescription>
              </div>
              <Tooltip content="Inference engine is running optimally" position="left">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 cursor-help">
                  <Activity className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">System Healthy</span>
                </div>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <Server className="h-4 w-4 text-zinc-500" />
                  Model Version
                </label>
                <div className="relative">
                  <select className="w-full p-3 rounded-lg border border-zinc-700 bg-[#0a0a0a] text-sm text-zinc-300 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none shadow-inner shadow-black/50 transition-all">
                    <option>XLM-RoBERTa Multilingual (Latest - Recommended)</option>
                    <option>IndicNER (Legacy - Unsupported)</option>
                    <option>Multilingual-BERT Optimized</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-zinc-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
                <p className="text-xs text-zinc-500">Select the primary model used for entity extraction.</p>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-zinc-500" />
                  Hardware Acceleration
                </label>
                <div className="relative">
                  <select className="w-full p-3 rounded-lg border border-zinc-700 bg-[#0a0a0a] text-sm text-zinc-300 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none shadow-inner shadow-black/50 transition-all">
                    <option>Auto-detect (Recommended)</option>
                    <option>CUDA GPU (NVIDIA Tensor Core)</option>
                    <option>CPU (Intel/AMD AVX-512)</option>
                    <option>Apple Silicon (Neural Engine)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-zinc-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
                <p className="text-xs text-zinc-500">Force specific hardware for inference processing.</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-5 bg-zinc-900/50 rounded-xl border border-zinc-800/60 hover:border-zinc-700 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-100">Auto-Update Model Weights</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Automatically pull latest fine-tuned weights from the secure registry.</p>
                </div>
              </div>
              <Tooltip content="Toggle automatic model updates" position="left">
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-colors">
                  <span className="inline-block h-4 w-4 translate-x-6 rounded-full bg-white transition-transform shadow-sm" />
                </button>
              </Tooltip>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/60 shadow-xl shadow-black/20 bg-[#121212]/80 backdrop-blur-xl overflow-hidden">
          <CardHeader className="border-b border-zinc-800/60 bg-zinc-900/50 py-5">
            <CardTitle className="text-lg font-medium text-zinc-100 flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-400" />
              Security & Access Control
            </CardTitle>
            <CardDescription className="text-sm text-zinc-400 mt-1">Manage your API keys, access tokens, and security policies.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Key className="h-4 w-4 text-zinc-500" />
                Production API Key
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input 
                    type="password" 
                    value="sk_live_51Mxxxxxxxxxxxxxxxxxxxx" 
                    readOnly
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-zinc-700 bg-[#0a0a0a] text-sm font-mono text-zinc-400 outline-none shadow-inner shadow-black/50"
                  />
                </div>
                <Button variant="outline" className="shrink-0 gap-2 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100">
                  <RefreshCw className="h-4 w-4" />
                  Rotate Key
                </Button>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
              <Shield className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-400">Enterprise-Grade Security</p>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Your keys and data are encrypted at rest using AES-256-GCM. All API traffic is secured via TLS 1.3. 
                  We comply with SOC2 Type II and GDPR requirements.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
