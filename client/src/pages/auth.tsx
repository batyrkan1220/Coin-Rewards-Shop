import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Coins, Loader2, Eye, EyeOff, MessageCircle, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

const loginSchema = z.object({
  username: z.string().min(1, "Введите логин"),
  password: z.string().min(1, "Введите пароль"),
});

const WHATSAPP_PHONE = "+77770145874";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_PHONE.replace(/\+/g, "")}`;

export default function AuthPage() {
  const { login, isLoggingIn, loginError, user, companyDeactivated } = useAuth();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);

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

        {companyDeactivated && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5" data-testid="card-company-deactivated">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-3">
                  <div>
                    <h3 className="font-display font-bold text-foreground mb-1">Доступ приостановлен</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Срок действия тарифного плана вашей компании истек. Для продления доступа свяжитесь с технической поддержкой.
                    </p>
                  </div>
                  <a
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="link-whatsapp-support"
                  >
                    <Button variant="default" className="w-full gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Написать в WhatsApp
                    </Button>
                  </a>
                  <p className="text-xs text-muted-foreground text-center">
                    +7 777 014 58 74
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card className="border-border/50 shadow-2xl shadow-black/5">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-display font-bold">Вход в систему</CardTitle>
            <CardDescription>Введите данные для доступа к платформе Tabys</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Логин</FormLabel>
                      <FormControl>
                        <Input placeholder="Логин" {...field} className="h-11 bg-muted/30" data-testid="input-login" />
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
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Пароль"
                            {...field}
                            className="h-11 bg-muted/30 pr-11"
                            data-testid="input-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {loginError && !companyDeactivated && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium" data-testid="text-login-error">
                    {loginError.message === "company_deactivated"
                      ? "Доступ приостановлен"
                      : loginError.message}
                  </div>
                )}

                <Button type="submit" className="w-full h-11 text-base shadow-lg shadow-primary/20" disabled={isLoggingIn} data-testid="button-submit-login">
                  {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Войти
                </Button>

              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
