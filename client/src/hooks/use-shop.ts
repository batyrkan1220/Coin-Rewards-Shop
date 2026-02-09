import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useShopItems() {
  return useQuery({
    queryKey: [api.shop.list.path],
    queryFn: async () => {
      const res = await fetch(api.shop.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load shop items");
      return await res.json();
    },
  });
}

export function useCreateShopItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.shop.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Ошибка создания товара" }));
        throw new Error(err.message || "Ошибка создания товара");
      }
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.shop.list.path] }),
  });
}

export function useUpdateShopItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number; [key: string]: any }) => {
      const url = buildUrl(api.shop.update.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Ошибка обновления товара" }));
        throw new Error(err.message || "Ошибка обновления товара");
      }
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.shop.list.path] }),
  });
}
