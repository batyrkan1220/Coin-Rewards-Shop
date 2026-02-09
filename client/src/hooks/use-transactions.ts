import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useTransactions(userId?: number) {
  return useQuery({
    queryKey: [api.transactions.list.path, userId],
    queryFn: async () => {
      const url = userId
        ? `${api.transactions.list.path}?userId=${userId}`
        : api.transactions.list.path;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load transactions");
      return await res.json();
    },
  });
}

export function useAllTransactions() {
  return useQuery({
    queryKey: [api.transactions.listAll.path],
    queryFn: async () => {
      const res = await fetch(api.transactions.listAll.path);
      if (!res.ok) throw new Error("Failed to load transactions");
      return await res.json();
    },
  });
}

export function useBalance(userId?: number) {
  return useQuery({
    queryKey: ["balance", userId],
    queryFn: async () => {
      if (!userId) return null;
      const url = buildUrl(api.transactions.balance.path, { userId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load balance");
      const data = await res.json();
      return data.balance as number;
    },
    enabled: !!userId,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { userId: number; amount: number; type: "EARN" | "SPEND" | "ADJUST"; reason: string }) => {
      const res = await fetch(api.transactions.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create transaction");
      }
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.transactions.listAll.path] });
      queryClient.invalidateQueries({ queryKey: ["balance", variables.userId] });
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
    },
  });
}

export function useZeroOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(api.transactions.zeroOut.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to zero out");
      }
      return await res.json();
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.transactions.listAll.path] });
      queryClient.invalidateQueries({ queryKey: ["balance", userId] });
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
    },
  });
}
