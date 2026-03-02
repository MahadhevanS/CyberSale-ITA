import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGameState } from "@/hooks/use-game";
import { Shield, Sword, Activity, TerminalSquare, LogOut, Coins, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { data: gameState } = useGameState();
  const [location] = useLocation();

  if (!user) return <>{children}</>;

  const navItems = [
    { href: "/", label: "Nexus", icon: Activity },
    { href: "/auction", label: "Black Market", icon: Coins },
    { href: "/defense", label: "Defense Grid", icon: Shield },
    { href: "/admin", label: "System Core", icon: TerminalSquare },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-primary">
            <Sword className="w-6 h-6" />
            <h1 className="font-display font-bold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              CYBERSALE
            </h1>
          </div>

          <div className="flex items-center space-x-6 text-sm font-mono">
            <div className="hidden md:flex items-center space-x-2 text-muted-foreground">
              <span className="uppercase text-xs tracking-widest">Phase:</span>
              <span className="text-secondary font-bold">
                {gameState?.phase || "UNKNOWN"}
              </span>
            </div>
            
            <div className="h-6 w-px bg-border hidden md:block"></div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5 text-primary" title="Credits">
                <Coins className="w-4 h-4" />
                <span>{user.credits.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-accent" title="Health">
                <ShieldAlert className="w-4 h-4" />
                <span>{user.security_health}%</span>
              </div>
              <div className="flex items-center space-x-1.5 text-secondary" title="Score">
                <Activity className="w-4 h-4" />
                <span>{user.score.toFixed(0)}</span>
              </div>
            </div>

            <button 
              onClick={() => logout()}
              className="ml-4 text-muted-foreground hover:text-destructive transition-colors"
              title="Disconnect"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        {/* Side Navigation */}
        <aside className="w-full md:w-64 md:border-r border-border p-4 space-y-2 overflow-x-auto md:overflow-visible flex md:flex-col shrink-0">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="flex-1 md:flex-none">
                <div
                  className={clsx(
                    "flex flex-col md:flex-row items-center md:items-start md:space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(0,255,255,0.1)]"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <item.icon className={clsx("w-5 h-5 mb-1 md:mb-0", isActive && "drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]")} />
                  <span className="font-display text-xs md:text-sm tracking-wider uppercase text-center md:text-left">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </aside>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 min-h-0 relative">
          {/* Subtle background glow effect */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-[100px] pointer-events-none"></div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="relative z-10"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
