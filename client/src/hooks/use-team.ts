import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useUsers() {
  return useQuery({
    queryKey: [api.users.list.path],
    queryFn: async () => {
      const res = await fetch(api.users.list.path);
      if (!res.ok) throw new Error("Не удалось загрузить пользователей");
      return api.users.list.responses[200].parse(await res.json());
    },
  });
}

export function useTeams() {
  return useQuery({
    queryKey: [api.teams.list.path],
    queryFn: async () => {
      const res = await fetch(api.teams.list.path);
      if (!res.ok) throw new Error("Не удалось загрузить команды");
      return api.teams.list.responses[200].parse(await res.json());
    },
  });
}
