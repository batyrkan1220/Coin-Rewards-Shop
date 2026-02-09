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
      if (!res.ok) throw new Error("Не удалось загрузить транзакции");
      return api.transactions.list.responses[200].parse(await res.json());
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
      if (!res.ok) throw new Error("Ошибка загрузки баланса");
      const data = await res.json();
      return data.balance as number;
    },
    enabled: !!userId,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { userId: number; amount: number; type: "EARN" | "ADJUST"; reason: string }) => {
      const res = await fetch(api.transactions.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Ошибка создания транзакции");
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path] });
      queryClient.invalidateQueries({ queryKey: ["balance", variables.userId] });
    },
  });
}
