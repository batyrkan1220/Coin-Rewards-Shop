import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useRedemptions(scope: "my" | "team" | "all" = "my") {
  return useQuery({
    queryKey: [api.redemptions.list.path, scope],
    queryFn: async () => {
      const res = await fetch(`${api.redemptions.list.path}?scope=${scope}`, { credentials: "include" });
      if (!res.ok) throw new Error("Не удалось загрузить заявки");
      return api.redemptions.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateRedemption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { shopItemId: number; comment?: string }) => {
      const res = await fetch(api.redemptions.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Ошибка создания заявки" }));
        throw new Error(error.message || "Ошибка создания заявки");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.redemptions.list.path] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "balance" });
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.transactions.listAll.path] });
    },
  });
}

export function useUpdateRedemptionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "APPROVED" | "REJECTED" | "ISSUED" }) => {
      const url = buildUrl(api.redemptions.updateStatus.path, { id });
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
      queryClient.invalidateQueries({ queryKey: [api.redemptions.list.path] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "balance" });
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.transactions.listAll.path] });
    },
  });
}
