import { useUsers } from "@/hooks/use-users";
import { useGameState } from "@/hooks/use-game";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { Trophy, Activity, Coins, ShieldAlert, Cpu } from "lucide-react";

export default function Dashboard() {
  const { data: users = [], isLoading } = useUsers();
  const { data: gameState } = useGameState();
  const { toast } = useToast();

  useEffect(() => {
    if (gameState?.phase?.startsWith('attack') && gameState?.current_attack_strength > 0) {
      toast({
        variant: "destructive",
        title: "INCOMING ATTACK DETECTED",
        description: `Alert: Attack strength ${gameState.current_attack_strength} wave approaching!`,
        duration: 10000
      });
    }
  }, [gameState?.phase, gameState?.current_attack_strength]);

  const sortedUsers = [...users].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.security_health - a.security_health;
  });

  if (isLoading) {
    return <div className="text-primary font-mono animate-pulse">Initializing Nexus Data...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="cyber-panel p-6 flex items-center space-x-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <Cpu className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-mono uppercase">Global State</p>
            <h3 className="text-xl font-display font-bold text-foreground">Phase: {gameState?.phase?.toUpperCase()}</h3>
          </div>
        </div>

        <div className="cyber-panel p-6 flex items-center space-x-4">
          <div className="p-3 bg-secondary/10 rounded-lg text-secondary">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-mono uppercase">Current Attack</p>
            <h3 className="text-xl font-display font-bold text-foreground">Level {gameState?.current_attack_strength || 0}</h3>
          </div>
        </div>

        <div className="cyber-panel p-6 flex items-center space-x-4">
          <div className="p-3 bg-accent/10 rounded-lg text-accent">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-mono uppercase">Active Operators</p>
            <h3 className="text-xl font-display font-bold text-foreground">{users.length}</h3>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div>
        <h2 className="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-6 flex items-center">
          <Trophy className="w-6 h-6 mr-3 text-primary" />
          Operator Leaderboard
        </h2>

        <div className="cyber-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-sm">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="p-4 text-muted-foreground font-medium uppercase">Rank</th>
                  <th className="p-4 text-muted-foreground font-medium uppercase">Handle</th>
                  <th className="p-4 text-muted-foreground font-medium uppercase text-right">Credits</th>
                  <th className="p-4 text-muted-foreground font-medium uppercase text-right">Health</th>
                  <th className="p-4 text-muted-foreground font-medium uppercase text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user, idx) => (
                  <motion.tr
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={user.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        idx === 0 ? "bg-accent/20 text-accent border border-accent/50 shadow-[0_0_10px_rgba(0,255,0,0.3)]" :
                        idx === 1 ? "bg-primary/20 text-primary border border-primary/50" :
                        idx === 2 ? "bg-secondary/20 text-secondary border border-secondary/50" :
                        "bg-white/5 text-muted-foreground"
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-foreground">{user.username}</td>
                    <td className="p-4 text-right text-primary">
                      <div className="flex items-center justify-end space-x-1">
                        <Coins className="w-4 h-4" />
                        <span>{user.credits}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-1 text-accent">
                        <ShieldAlert className="w-4 h-4" />
                        <span>{user.security_health}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-display text-lg font-bold text-secondary">
                      {user.score.toFixed(0)}
                    </td>
                  </motion.tr>
                ))}
                {sortedUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No operators detected in the grid.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
