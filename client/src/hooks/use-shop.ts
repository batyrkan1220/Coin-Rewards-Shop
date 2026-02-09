import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useShopItems() {
  return useQuery({
    queryKey: [api.shop.list.path],
    queryFn: async () => {
      const res = await fetch(api.shop.list.path);
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
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create shop item");
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
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update shop item");
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.shop.list.path] }),
  });
}
