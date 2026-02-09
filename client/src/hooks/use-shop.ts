import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertShopItem } from "@shared/routes";

export function useShopItems() {
  return useQuery({
    queryKey: [api.shop.list.path],
    queryFn: async () => {
      const res = await fetch(api.shop.list.path);
      if (!res.ok) throw new Error("Не удалось загрузить товары");
      return api.shop.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateShopItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertShopItem) => {
      const res = await fetch(api.shop.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Ошибка создания товара");
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.shop.list.path] }),
  });
}
