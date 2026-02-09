import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Coins, Loader2 } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useEffect } from "react";

const loginSchema = z.object({
  username: z.string().min(1, "Введите имя пользователя"),
  password: z.string().min(1, "Введите пароль"),
});

export default function AuthPage() {
  const { login, isLoggingIn, loginError, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) setLocation("/dashboard");
  }, [user, setLocation]);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof loginSchema>) {
    login(values);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-primary/10 rounded-2xl animate-in zoom-in duration-500">
            <Coins className="w-12 h-12 text-primary" />
          </div>
        </div>
        
        <Card className="border-border/50 shadow-2xl shadow-black/5">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-display font-bold">Вход в систему</CardTitle>
            <CardDescription>Введите данные для доступа к корпоративному магазину</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Имя пользователя</FormLabel>
                      <FormControl>
                        <Input placeholder="username" {...field} className="h-11 bg-muted/30" />
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
                        <Input type="password" placeholder="••••••••" {...field} className="h-11 bg-muted/30" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {loginError && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
                    {loginError.message}
                  </div>
                )}

                <Button type="submit" className="w-full h-11 text-base shadow-lg shadow-primary/20" disabled={isLoggingIn}>
                  {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Войти
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Нет аккаунта?{" "}
                  <Link href="/register-company" className="text-primary font-medium hover:underline" data-testid="link-register-company">
                    Зарегистрировать компанию
                  </Link>
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
