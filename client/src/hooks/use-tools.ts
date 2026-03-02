import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { Tool, UserToolWithTool } from "@shared/schema";

export function useTools() {
  return useQuery<Tool[]>({
    queryKey: [api.tools.list.path],
    queryFn: async () => {
      const res = await fetch(api.tools.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tools");
      return res.json();
    },
    refetchInterval: 2000,
  });
}

export function useUserTools() {
  return useQuery<UserToolWithTool[]>({
    queryKey: [api.userTools.list.path],
    queryFn: async () => {
      const res = await fetch(api.userTools.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user tools");
      return res.json();
    },
    refetchInterval: 3000,
  });
}

export function useBid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, amount }: { id: number; amount: number }) => {
      const url = buildUrl(api.tools.bid.path, { id });
      const res = await fetch(url, {
        method: api.tools.bid.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to place bid");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tools.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
    },
  });
}

export function usePlaceTool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, layer }: { id: number; layer: number }) => {
      const url = buildUrl(api.userTools.place.path, { id });
      const res = await fetch(url, {
        method: api.userTools.place.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layer }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to place tool");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.userTools.list.path] });
    },
  });
}

export function useConfirmDefense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (layout: Record<number, number | null>) => {
      const res = await fetch("/api/user-tools/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout }),
        credentials: "include",
      });

      const text = await res.text();
      console.log("CONFIRM RESPONSE RAW:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Invalid JSON from server");
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to confirm defense");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.userTools.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
    },
  });
}