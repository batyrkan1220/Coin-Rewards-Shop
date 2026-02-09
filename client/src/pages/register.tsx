import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";
import { Loader2, Coins, AlertCircle } from "lucide-react";

const registerSchema = z.object({
  username: z.string().min(1, "Обязательное поле"),
  password: z.string().min(3, "Минимум 3 символа"),
  name: z.string().min(1, "Обязательное поле"),
  gender: z.enum(["male", "female"], { required_error: "Выберите пол" }),
});

type RegisterData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const params = useParams<{ token: string }>();
  const token = params.token || "";
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: validation, isLoading: isValidating, error: validationError } = useQuery({
    queryKey: ["/api/invites/validate", token],
    queryFn: async () => {
      const res = await fetch(`/api/invites/validate/${token}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Ошибка валидации ссылки");
      }
      return await res.json();
    },
    retry: false,
    enabled: !!token,
  });

  const form = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", password: "", name: "", gender: undefined },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const res = await fetch(api.register.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...data, token }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Ошибка регистрации");
      }
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData([api.auth.me.path], user);
      toast({ title: "Регистрация успешна", description: "Добро пожаловать на платформу!" });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: RegisterData) => {
    registerMutation.mutate(data);
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="w-12 h-12 text-destructive" />
              <p className="text-lg font-medium">Недействительная ссылка для регистрации</p>
              <Button variant="outline" onClick={() => setLocation("/auth")} data-testid="link-go-login">
                Перейти к входу
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isValidating) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (validationError || !validation?.valid) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="w-12 h-12 text-destructive" />
              <p className="text-lg font-medium">
                {(validationError as Error)?.message || "Ссылка недействительна или истекла"}
              </p>
              <Button variant="outline" onClick={() => setLocation("/auth")} data-testid="link-go-login-error">
                Перейти к входу
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Coins className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Регистрация</CardTitle>
          <CardDescription>Создайте аккаунт для доступа к платформе</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Имя</FormLabel>
                    <FormControl>
                      <Input placeholder="Ваше имя" data-testid="input-register-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="user@example.com" type="email" data-testid="input-register-email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пароль</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Минимум 3 символа" data-testid="input-register-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пол</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-register-gender">
                          <SelectValue placeholder="Выберите пол" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Мужской</SelectItem>
                        <SelectItem value="female">Женский</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={registerMutation.isPending}
                data-testid="button-register-submit"
              >
                {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Зарегистрироваться
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center">
            <Button variant="link" onClick={() => setLocation("/auth")} data-testid="link-go-login-form">
              Уже есть аккаунт? Войти
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
