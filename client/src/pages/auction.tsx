import { useState, useEffect } from "react";
import { useTools, useBid } from "@/hooks/use-tools";
import { useGameState } from "@/hooks/use-game";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Hammer, Wallet, Timer } from "lucide-react";

export default function Auction() {
  const { data: tools = [], isLoading } = useTools();
  const { data: gameState } = useGameState();
  const { user } = useAuth();
  const { mutateAsync: placeBid, isPending: isBidding } = useBid();
  const { toast } = useToast();

  const [bidAmount, setBidAmount] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [inactivityLeft, setInactivityLeft] = useState<number | null>(null);
  const [auctionClosed, setAuctionClosed] = useState(false);

  const activeTool =
    tools.find((t) => t.id === gameState?.active_tool_id) || null;

  const isSold = activeTool?.status === "sold";
  const isWinner = isSold && activeTool.highest_bidder_id === user?.id;
  const pendingTools = tools.filter((t) => t.status === "pending");
  const soldTools = tools.filter((t) => t.status === "sold");

  const isAuctionActive =
    gameState?.phase === "auction" &&
    activeTool &&
    activeTool.status === "active" &&
    !auctionClosed;

  const minBid = activeTool
    ? (activeTool.current_bid || activeTool.base_price) + 5
    : 0;

  /* ================= RESET ON TOOL CHANGE ================= */

  useEffect(() => {
    setAuctionClosed(false);
    setBidAmount("");
    setTimeLeft("");
    setInactivityLeft(null);
  }, [activeTool?.id]);

  /* ================= TIMER LOGIC ================= */

  useEffect(() => {
    if (!activeTool || activeTool.status !== "active") return;
    if (!activeTool.auction_end_at) return;

    const toolId = activeTool.id;
    const endTime = new Date(activeTool.auction_end_at).getTime();

    const interval = setInterval(() => {
      // Kill timer if tool changes
      if (gameState?.active_tool_id !== toolId) {
        clearInterval(interval);
        return;
      }

      const now = Date.now();

      /* 3 MIN TIMER */
      const diff = endTime - now;
      if (diff <= 0) {
        setTimeLeft("00:00");
        setAuctionClosed(true);
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins}:${secs < 10 ? "0" : ""}${secs}`);
      }

      /* 10 SEC INACTIVITY */
      if (activeTool.last_bid_at) {
        const lastBid = new Date(activeTool.last_bid_at).getTime();
        const inactivity = 10000 - (now - lastBid);

        if (inactivity <= 0) {
          setInactivityLeft(0);
          setAuctionClosed(true);
        } else {
          setInactivityLeft(Math.floor(inactivity / 1000));
        }
      } else {
        setInactivityLeft(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    activeTool?.id,
    activeTool?.auction_end_at,
    activeTool?.last_bid_at,
    gameState?.active_tool_id,
  ]);

  /* ================= BID HANDLER ================= */

  const handleBid = async () => {
    const amount = parseInt(bidAmount);

    if (isNaN(amount) || amount < minBid) {
      toast({
        variant: "destructive",
        title: "Invalid Bid",
        description: `Minimum bid is ₵${minBid}`,
      });
      return;
    }

    try {
      await placeBid({ id: activeTool!.id, amount });
      toast({ title: "Bid Accepted" });
      setBidAmount("");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Bid Failed",
        description: err.message,
      });
    }
  };

  if (isLoading)
    return (
      <div className="text-primary font-mono animate-pulse">
        Scanning Market...
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto space-y-10">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-display font-bold text-primary flex items-center">
          <Hammer className="w-8 h-8 mr-3" />
          Black Market Auction
        </h2>

        <div className="cyber-panel px-6 py-3 flex items-center gap-4">
          <div>
            <div className="text-xs uppercase text-muted-foreground font-mono">
              Available Credits
            </div>
            <div className="text-xl font-display font-bold text-primary">
              ₵{user?.credits}
            </div>
          </div>
          <Wallet className="w-6 h-6 text-primary" />
        </div>
      </div>

      {/* ACTIVE AUCTION */}
      {activeTool && activeTool.status === "active" ? (
        <div className="cyber-panel p-8 border-primary bg-primary/5">

          <h3 className="text-3xl font-bold">{activeTool.name}</h3>
          <p className="text-muted-foreground mt-4">
            {activeTool.description}
          </p>

          <div className="flex justify-between items-center mt-6">
            <div>
              <div className="text-sm uppercase text-muted-foreground">
                Current Bid
              </div>
              <div className="text-4xl font-bold text-primary">
                ₵{activeTool.current_bid || activeTool.base_price}
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-2 text-secondary">
                <Timer className="w-4 h-4" />
                <span>{timeLeft}</span>
              </div>

              {inactivityLeft !== null && (
                <div
                  className={`text-xs font-bold ${
                    inactivityLeft <= 3
                      ? "text-destructive animate-pulse"
                      : "text-orange-400"
                  }`}
                >
                  10s RESET TIMER: {inactivityLeft}s
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <input
              type="number"
              value={bidAmount}
              disabled={!isAuctionActive}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder={`Min ₵${minBid}`}
              className="cyber-input flex-1 text-xl"
            />

            <button
              onClick={handleBid}
              disabled={!isAuctionActive || isBidding}
              className="cyber-button cyber-button-primary px-8 disabled:opacity-50"
            >
              {isAuctionActive ? "Place Bid" : "Auction Closed"}
            </button>
          </div>

          {!isAuctionActive && (
            <p className="text-destructive text-sm mt-4 font-mono text-center">
              Bidding Disabled — Auction Closed
            </p>
          )}
        </div>
      ) : activeTool && activeTool.status === "sold" ? (
        <div className="cyber-panel p-10 text-center border-primary bg-primary/5">

          <h3 className="text-2xl font-bold mb-4">
            {activeTool.name}
          </h3>

          <div className="text-3xl font-bold text-primary mb-4">
            ₵{activeTool.current_bid}
          </div>

          {activeTool.highest_bidder_id === user?.id ? (
            <div className="text-green-400 font-bold text-lg animate-pulse">
              🎉 You Won This Auction!
            </div>
          ) : (
            <div className="text-destructive font-bold text-lg">
              Auction Lost
            </div>
          )}
          
        </div>
      ) : (
        <div className="cyber-panel p-12 text-center">
          Auction Paused
        </div>
      )}

      {/* ================= PENDING TOOLS ================= */}

      <div>
        <h3 className="text-lg font-bold mb-4 uppercase">
          Pending Tools
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pendingTools.map((tool) => (
            <div
              key={tool.id}
              className="cyber-panel p-4 border-border bg-card/40"
            >
              <h4 className="font-bold uppercase text-sm">
                {tool.name}
              </h4>
              <p className="text-xs text-muted-foreground mt-2">
                {tool.description}
              </p>
              <div className="mt-3 text-primary font-bold">
                ₵{tool.base_price}
              </div>
            </div>
          ))}

          {pendingTools.length === 0 && (
            <div className="col-span-full text-muted-foreground text-sm font-mono">
              No tools pending.
            </div>
          )}
        </div>
      </div>

      {/* ================= SOLD HISTORY ================= */}

      <div>
        <h3 className="text-lg font-bold mb-4 uppercase">
          Auction History
        </h3>

        <div className="space-y-3">
          {soldTools.map((tool) => (
            <div
              key={tool.id}
              className="cyber-panel p-4 bg-black/20 border-border"
            >
              <div className="flex justify-between">
                <span>{tool.name}</span>
                <span className="text-primary font-bold">
                  ₵{tool.current_bid}
                </span>
              </div>
            </div>
          ))}

          {soldTools.length === 0 && (
            <div className="text-muted-foreground text-sm font-mono">
              No tools sold yet.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
