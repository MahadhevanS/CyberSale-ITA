import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { User } from "@shared/schema";

export function useUsers() {
  return useQuery<User[]>({
    queryKey: [api.users.list.path],
    queryFn: async () => {
      const res = await fetch(api.users.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    refetchInterval: 3000,
  });
}
