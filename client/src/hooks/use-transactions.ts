import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useTransactions(userId?: number) {
  return useQuery({
    queryKey: [api.transactions.list.path, userId],
    queryFn: async () => {
      const url = userId
        ? `${api.transactions.list.path}?userId=${userId}`
        : api.transactions.list.path;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load transactions");
      return await res.json();
    },
  });
}

export function useAllTransactions() {
  return useQuery({
    queryKey: [api.transactions.listAll.path],
    queryFn: async () => {
      const res = await fetch(api.transactions.listAll.path, { credentials: "include" });
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
      const res = await fetch(url, { credentials: "include" });
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
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Ошибка создания транзакции" }));
        throw new Error(error.message || "Ошибка создания транзакции");
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
        credentials: "include",
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Ошибка обнуления" }));
        throw new Error(error.message || "Ошибка обнуления");
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

export function usePendingTransactions() {
  return useQuery({
    queryKey: [api.transactions.pending.path],
    queryFn: async () => {
      const res = await fetch(api.transactions.pending.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load pending transactions");
      return await res.json();
    },
  });
}

export function useUpdateTransactionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "APPROVED" | "REJECTED" }) => {
      const url = buildUrl(api.transactions.updateStatus.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Ошибка обновления статуса" }));
        throw new Error(error.message || "Ошибка обновления статуса");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.transactions.pending.path] });
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.transactions.listAll.path] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "balance" });
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
    },
  });
}
