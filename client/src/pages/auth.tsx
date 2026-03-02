import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    try {
      if (isLogin) {
        await login({ username, password });
        toast({ title: "System Access Granted", description: "Welcome back to the Nexus." });
      } else {
        await register({ username, password });
        toast({ title: "Registration Successful", description: "Identity instantiated in the grid." });
      }
      setLocation("/");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: err.message,
      });
    }
  };

  const isPending = isLoggingIn || isRegistering;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background p-4">
      {/* Abstract Background */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1920&h=1080&fit=crop')] opacity-5 mix-blend-screen pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="cyber-panel p-8 w-full max-w-md backdrop-blur-xl bg-background/80"
      >
        <div className="text-center mb-8">
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-4 text-primary"
          >
            <Shield className="w-16 h-16 drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]" />
          </motion.div>
          <h1 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-2">
            CYBERSALE
          </h1>
          <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest">
            Identity Authorization
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-mono text-primary uppercase">Handle</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="cyber-input"
              placeholder="operator_01"
              required
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-mono text-primary uppercase">Passphrase</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="cyber-input"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="cyber-button cyber-button-primary w-full mt-4 flex items-center justify-center space-x-2"
          >
            {isPending ? (
              <span className="animate-pulse">Authenticating...</span>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>{isLogin ? "Initialize Session" : "Establish Identity"}</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors"
          >
            {isLogin ? "No identity? Request clearance here." : "Already registered? Authenticate."}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
