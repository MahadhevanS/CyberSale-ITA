import { useState, useEffect, useRef } from "react";
import { useGameState, useAdvancePhase, useRunAttack } from "@/hooks/use-game";
import { useTools } from "@/hooks/use-tools";
import { useStartAuction, useCloseAuction } from "@/hooks/use-coordinator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  TerminalSquare,
  AlertOctagon,
  Send,
  Play,
  Square,
  Hammer,
} from "lucide-react";

export default function Admin() {
  const { data: gameState, isLoading: isStateLoading } = useGameState();
  const { data: tools = [], isLoading: isToolsLoading } = useTools();
  const { mutateAsync: advancePhase, isPending: isAdvancing } =
    useAdvancePhase();
  const { mutateAsync: runAttack, isPending: isAttacking } =
    useRunAttack();
  const { mutateAsync: startAuction, isPending: isStarting } =
    useStartAuction();
  const { mutateAsync: closeAuction, isPending: isClosing } =
    useCloseAuction();
  const { toast } = useToast();
  const { user } = useAuth();

  const [selectedPhase, setSelectedPhase] = useState("");
  const [attackStrength, setAttackStrength] = useState("");

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const activeTool =
    tools.find((t) => t.id === gameState?.active_tool_id) || null;

  const pendingTools = tools.filter((t) => t.status === "pending");
  const nextAutoTool = pendingTools[0];

  /* ================= AUTO CLOSE LOGIC ================= */

  useEffect(() => {
    if (!user?.is_coordinator) return;
    if (!activeTool || activeTool.status !== "active") return;
    if (!activeTool.auction_end_at) return;

    const toolId = activeTool.id;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const endTime = new Date(activeTool.auction_end_at).getTime();

    intervalRef.current = setInterval(async () => {
      if (gameState?.active_tool_id !== toolId) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        return;
      }

      const now = Date.now();

      // 3 MIN LIMIT
      if (now >= endTime) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        await closeAuction();
        toast({
          title: "Auction Closed",
          description: "3 minute limit reached.",
        });
        return;
      }

      // 10 SECOND INACTIVITY
      if (activeTool.last_bid_at) {
        const lastBid = new Date(activeTool.last_bid_at).getTime();
        if (now - lastBid >= 10000) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          await closeAuction();
          toast({
            title: "Auction Closed",
            description: "10 seconds inactivity.",
          });
        }
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    activeTool?.id,
    activeTool?.auction_end_at,
    activeTool?.last_bid_at,
    gameState?.active_tool_id,
    user?.is_coordinator,
  ]);

  /* ===================================================== */

  const handleAdvance = async () => {
    if (!selectedPhase) return;

    try {
      const payload: any = { phase: selectedPhase };

      if (selectedPhase.startsWith("attack") && attackStrength) {
        payload.attack_strength = parseInt(attackStrength);
      }

      if (selectedPhase !== "auction") {
        payload.active_tool_id = null;
      }

      await advancePhase(payload);

      toast({
        title: "System Overridden",
        description: `Phase advanced to ${selectedPhase}`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Override Failed",
        description: err.message,
      });
    }
  };

  const handleAttack = async () => {
    try {
      await runAttack();
      toast({
        title: "Attack Executed",
        description: "Wave dispatched successfully.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Execution Failed",
        description: err.message,
      });
    }
  };

  const handleStartAuction = async (toolId: number) => {
    try {
      await startAuction(toolId);
      toast({
        title: "Auction Started",
        description: "Bidding is now open.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to start auction",
        description: err.message,
      });
    }
  };

  const handleManualClose = async () => {
    try {
      await closeAuction();
      toast({
        title: "Auction Closed",
        description: "Final bids processed.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to close auction",
        description: err.message,
      });
    }
  };

  if (isStateLoading || isToolsLoading)
    return (
      <div className="text-primary font-mono animate-pulse">
        Accessing Core...
      </div>
    );

  if (!user?.is_coordinator) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertOctagon className="w-16 h-16 text-destructive animate-pulse" />
        <h2 className="text-2xl font-display font-bold text-destructive">
          ACCESS DENIED
        </h2>
        <p className="text-muted-foreground font-mono">
          Coordinator privileges required.
        </p>
      </div>
    );
  }

  const phases = [
    "auction",
    "placement",
    "attack_1",
    "attack_2",
    "attack_3",
    "finished",
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold text-destructive flex items-center">
          <TerminalSquare className="w-6 h-6 mr-3" />
          Event Coordinator Console
        </h2>
      </div>

      {/* PHASE + ATTACK */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Phase Control */}
        <div className="cyber-panel border-destructive/30 p-6">
          <h3 className="text-lg font-display mb-4 uppercase flex items-center">
            <Send className="w-5 h-5 mr-2 text-secondary" />
            Phase Control
          </h3>

          <div className="space-y-4">
            <div className="p-3 bg-black/40 rounded border font-mono text-sm flex justify-between">
              <span>Current Phase:</span>
              <span className="text-primary font-bold">
                {gameState?.phase.toUpperCase()}
              </span>
            </div>

            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="w-full bg-background border border-border px-3 py-2 rounded text-foreground font-mono"
            >
              <option value="">Select Phase...</option>
              {phases.map((p) => (
                <option key={p} value={p}>
                  {p.toUpperCase()}
                </option>
              ))}
            </select>

            {selectedPhase.startsWith("attack") && (
              <input
                type="number"
                value={attackStrength}
                onChange={(e) => setAttackStrength(e.target.value)}
                className="cyber-input"
                placeholder="Attack strength"
              />
            )}

            <button
              onClick={handleAdvance}
              disabled={!selectedPhase || isAdvancing}
              className="cyber-button cyber-button-secondary w-full disabled:opacity-50"
            >
              Commit Phase Change
            </button>
          </div>
        </div>

        {/* Attack Execution */}
        <div className="cyber-panel border-destructive/50 p-6">
          <h3 className="text-lg font-display text-destructive mb-4 uppercase flex items-center">
            <AlertOctagon className="w-5 h-5 mr-2" />
            Attack Execution
          </h3>

          <button
            onClick={handleAttack}
            disabled={isAttacking || !gameState?.phase.startsWith("attack")}
            className="cyber-button w-full bg-destructive text-white disabled:opacity-50"
          >
            Initiate Attack Wave
          </button>
        </div>
      </div>

      {/* AUCTION CONTROL */}
      {gameState?.phase === "auction" && (
        <div className="cyber-panel border-primary/30 p-6">

          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-display text-primary uppercase flex items-center">
              <Hammer className="w-5 h-5 mr-2" />
              Auction Manager
            </h3>

            {nextAutoTool && !activeTool && (
              <button
                onClick={() => handleStartAuction(nextAutoTool.id)}
                disabled={isStarting}
                className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded font-bold uppercase hover:bg-primary/80"
              >
                Auto-Start: {nextAutoTool.name}
              </button>
            )}
          </div>

          {activeTool ? (
            <div className="p-6 border border-primary/40 bg-primary/5 rounded-lg">
              <h4 className="text-xl font-bold text-primary uppercase">
                {activeTool.name}
              </h4>

              <p className="text-muted-foreground text-sm mt-2">
                {activeTool.description}
              </p>

              <div className="text-2xl mt-4 font-bold text-primary">
                ₵{activeTool.current_bid}
              </div>

              <button
                onClick={handleManualClose}
                disabled={isClosing}
                className="cyber-button w-full mt-4 bg-primary/20 text-primary border border-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Square className="w-4 h-4 mr-2" />
                Close Auction & Sell Tool
              </button>
            </div>
          ) : (
            <div className="text-muted-foreground font-mono text-sm text-center py-6">
              No tool currently being auctioned.
            </div>
          )}

          {/* Pending Tools Grid */}
          <div className="mt-8">
            <h4 className="text-sm font-display mb-4 uppercase">
              Pending Tools
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingTools.map((tool) => (
                <div
                  key={tool.id}
                  className="p-4 bg-background/40 border border-border rounded-md flex flex-col justify-between"
                >
                  <div>
                    <h5 className="font-bold uppercase text-sm">
                      {tool.name}
                    </h5>
                    <p className="text-xs text-muted-foreground mt-2">
                      {tool.description}
                    </p>

                    <div className="flex gap-2 mt-3">
                      <span className="text-[10px] bg-secondary/10 text-secondary border border-secondary/30 px-2 py-0.5 rounded">
                        STR: {tool.strength}
                      </span>
                      <span className="text-[10px] bg-primary/10 text-primary border border-primary/30 px-2 py-0.5 rounded">
                        ₵{tool.base_price}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartAuction(tool.id)}
                    disabled={!!activeTool}
                    className="mt-4 py-2 border border-primary/50 text-primary text-xs font-bold uppercase hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
                  >
                    Put up for Bid
                  </button>
                </div>
              ))}

              {pendingTools.length === 0 && (
                <div className="col-span-full text-muted-foreground text-sm font-mono">
                  No more tools left in the black market.
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}