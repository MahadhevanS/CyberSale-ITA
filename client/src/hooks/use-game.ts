import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { GameState } from "@shared/schema";

export function useGameState() {
  return useQuery<GameState>({
    queryKey: [api.game.state.path],
    queryFn: async () => {
      const res = await fetch(api.game.state.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch game state");
      return res.json();
    },
    refetchInterval: 2000, // Real-time polling
  });
}

export function useAdvancePhase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { phase: string; attack_strength?: number }) => {
      const res = await fetch(api.game.advance.path, {
        method: api.game.advance.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to advance phase");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.game.state.path] });
    },
  });
}

export function useRunAttack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.game.runAttack.path, {
        method: api.game.runAttack.method,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to run attack");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.game.state.path] });
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.tools.list.path] });
    },
  });
}
