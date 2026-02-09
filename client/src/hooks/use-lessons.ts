import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useLessons() {
  return useQuery({
    queryKey: [api.lessons.list.path],
    queryFn: async () => {
      const res = await fetch(api.lessons.list.path);
      if (!res.ok) throw new Error("Не удалось загрузить уроки");
      return api.lessons.list.responses[200].parse(await res.json());
    },
  });
}
