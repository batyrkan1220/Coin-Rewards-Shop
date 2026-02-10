import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertUser } from "@shared/routes";
import { useLocation } from "wouter";
import { z } from "zod";
import { ROLES } from "@shared/schema";

const loginSchema = z.object({
  username: z.string().min(1, "Обязательное поле"),
  password: z.string().min(1, "Обязательное поле"),
});

type LoginData = z.infer<typeof loginSchema>;

export function useAuth() {
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [companyDeactivated, setCompanyDeactivated] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("reason") === "company_deactivated";
  });

  const { data: user, isLoading, error } = useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const res = await fetch(api.auth.me.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (res.status === 403) {
        const data = await res.json();
        if (data.message === "company_deactivated") {
          setCompanyDeactivated(true);
          window.location.href = "/auth?reason=company_deactivated";
          return null;
        }
      }
      if (!res.ok) throw new Error("Failed to fetch user");
      return await res.json();
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await fetch(api.auth.login.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(credentials),
      });
      
      if (!res.ok) {
        const data = await res.json();
        if (data.message === "company_deactivated") {
          setCompanyDeactivated(true);
          throw new Error("company_deactivated");
        }
        throw new Error(data.message || "Ошибка входа");
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      setCompanyDeactivated(false);
      if (window.location.search.includes("reason=")) {
        window.history.replaceState({}, "", "/auth");
      }
      queryClient.setQueryData([api.auth.me.path], data);
      setLocation(data.role === ROLES.SUPER_ADMIN ? "/super-admin" : "/dashboard");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch(api.auth.logout.path, { method: "POST", credentials: "include" });
    },
    onSuccess: () => {
      queryClient.setQueryData([api.auth.me.path], null);
      setCompanyDeactivated(false);
      setLocation("/");
    },
  });

  return {
    user,
    isLoading,
    error,
    companyDeactivated,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout: logoutMutation.mutate,
  };
}
