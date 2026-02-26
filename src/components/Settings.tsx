import * as React from "react";
import { 
  Shield, 
  Cpu, 
  Database, 
  Bell, 
  User,
  Check,
  Save,
  RefreshCw
} from "lucide-react";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";

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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">System Settings</h1>
        <p className="text-zinc-500">Configure model parameters, API keys, and platform preferences.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Cpu className="h-4 w-4 text-zinc-500" />
              Inference Engine
            </CardTitle>
            <CardDescription>Configure the underlying NER model behavior.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-900">Model Version</label>
                <select className="w-full p-2 rounded-md border border-zinc-200 bg-white text-sm outline-none focus:ring-2 focus:ring-zinc-900">
                  <option>XLM-RoBERTa Multilingual (Latest - Recommended)</option>
                  <option>IndicNER (Legacy - Unsupported)</option>
                  <option>Multilingual-BERT Optimized</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-900">Inference Device</label>
                <select className="w-full p-2 rounded-md border border-zinc-200 bg-white text-sm outline-none focus:ring-2 focus:ring-zinc-900">
                  <option>Auto-detect (Recommended)</option>
                  <option>CUDA GPU (NVIDIA)</option>
                  <option>CPU (Intel/AMD)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-lg border border-zinc-100">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 text-zinc-400" />
                <div>
                  <p className="text-sm font-medium text-zinc-900">Auto-Update Model Weights</p>
                  <p className="text-xs text-zinc-500">Automatically pull latest fine-tuned weights from registry.</p>
                </div>
              </div>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-zinc-200">
                <span className="inline-block h-4 w-4 translate-x-1 rounded-full bg-white transition" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-4 w-4 text-zinc-500" />
              Security & API Keys
            </CardTitle>
            <CardDescription>Manage your access tokens and security policies.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-900">Production API Key</label>
              <div className="flex gap-2">
                <input 
                  type="password" 
                  value="sk_live_51Mxxxxxxxxxxxxxxxxxxxx" 
                  readOnly
                  className="flex-1 p-2 rounded-md border border-zinc-200 bg-zinc-50 text-sm font-mono text-zinc-500 outline-none"
                />
                <Button variant="outline">Rotate Key</Button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Shield className="h-3 w-3" />
              Your keys are encrypted at rest using AES-256.
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="ghost">Reset Defaults</Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 min-w-[120px]">
            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : (saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />)}
            {saved ? "Saved!" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
