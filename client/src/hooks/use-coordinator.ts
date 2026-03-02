import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";

export function useStartAuction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (toolId: number) => {
      const res = await apiRequest("POST", buildUrl(api.game.startAuction.path, { toolId }));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.game.state.path] });
      queryClient.invalidateQueries({ queryKey: [api.tools.list.path] });
    },
  });
}

export function useCloseAuction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", api.game.closeAuction.path);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.game.state.path] });
      queryClient.invalidateQueries({ queryKey: [api.tools.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.userTools.list.path] });
    },
  });
}
