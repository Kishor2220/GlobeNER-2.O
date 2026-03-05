import * as React from "react";
import { motion } from "motion/react";
import { 
  Shield, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Loader2, 
  ArrowRight, 
  ShieldCheck, 
  Network,
  Globe
} from "lucide-react";
import { useAuth } from "./AuthGuard";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Simulate authentication
    setTimeout(() => {
      if (email === "admin@globerner.int" && password === "admin123") {
        login("mock-jwt-token-" + Date.now());
      } else {
        setError("Invalid credentials. Access denied.");
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] text-zinc-100 overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Left Side (40%) - Branding & Background */}
      <div className="hidden lg:flex lg:w-[40%] relative flex-col justify-between p-12 border-r border-white/5 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse delay-1000" />
          
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          
          {/* Animated Network Lines (Simplified SVG) */}
          <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
            <motion.path
              d="M 100 100 L 300 400 L 500 200 L 700 500"
              stroke="rgba(99, 102, 241, 0.3)"
              strokeWidth="1"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            />
            <motion.circle
              cx="300" cy="400" r="4" fill="rgba(99, 102, 241, 0.6)"
              animate={{ r: [4, 8, 4], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </svg>
        </div>

        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-12"
          >
            <div className="h-10 w-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)]">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tighter uppercase">GlobeNER</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-5xl font-bold tracking-tighter leading-tight mb-6 uppercase">
              GlobeNER <br />
              <span className="text-indigo-500">Intelligence Bureau</span>
            </h1>
            <p className="text-zinc-500 text-lg max-w-md font-mono uppercase tracking-widest leading-relaxed">
              Multilingual Signal Extraction & Decision Intelligence Platform
            </p>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="relative z-10 flex items-center gap-4 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em]"
        >
          <Network className="h-4 w-4" />
          <span>Global Intelligence Network v2.0.0</span>
        </motion.div>
      </div>

      {/* Right Side (60%) - Login Form */}
      <div className="w-full lg:w-[60%] flex items-center justify-center p-6 relative">
        {/* Mobile Background Elements */}
        <div className="lg:hidden absolute inset-0 z-0">
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-500/5 to-transparent" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="intel-card p-10 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-indigo-400" />
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em]">Security Protocol</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white uppercase">Admin Access</h2>
              <p className="text-zinc-500 text-sm mt-2">Enter your credentials to access the bureau.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@globerner.int"
                    className="w-full h-14 pl-12 pr-4 bg-white/[0.03] border border-white/5 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all text-zinc-100 placeholder:text-zinc-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Access Key</label>
                  <button type="button" className="text-[10px] font-bold text-indigo-400/60 hover:text-indigo-400 uppercase tracking-widest transition-colors">Forgot Key?</button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-14 pl-12 pr-12 bg-white/[0.03] border border-white/5 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all text-zinc-100 placeholder:text-zinc-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-3"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-indigo-500 hover:bg-indigo-400 text-white font-bold uppercase tracking-[0.2em] rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <div className="flex items-center gap-3">
                    <span>Initialize Access</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-center gap-3">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Secure Intelligence Access</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
