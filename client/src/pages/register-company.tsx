import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Loader2, Phone, Check, Eye, EyeOff } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const registerCompanySchema = z.object({
  companyName: z.string().min(1, "Введите название компании"),
  phone: z.string().min(6, "Введите номер телефона"),
  adminEmail: z.string().email("Некорректный email"),
  adminPassword: z.string().min(6, "Минимум 6 символов"),
  adminName: z.string().min(1, "Введите имя"),
  gender: z.enum(["male", "female"], { required_error: "Выберите пол" }),
});

type RegisterCompanyForm = z.infer<typeof registerCompanySchema>;

export default function RegisterCompanyPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) setLocation("/dashboard");
  }, [user, setLocation]);

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterCompanyForm) => {
      const res = await apiRequest("POST", "/api/register-company", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Компания зарегистрирована" });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка регистрации", description: error.message, variant: "destructive" });
    },
  });

  const form = useForm<RegisterCompanyForm>({
    resolver: zodResolver(registerCompanySchema),
    defaultValues: {
      companyName: "",
      phone: "",
      adminEmail: "",
      adminPassword: "",
      adminName: "",
    },
  });

  function onSubmit(values: RegisterCompanyForm) {
    registerMutation.mutate(values);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-primary/10 rounded-2xl animate-in zoom-in duration-500">
            <Building2 className="w-12 h-12 text-primary" />
          </div>
        </div>

        <Card className="border-border/50 shadow-2xl shadow-black/5">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-display font-bold" data-testid="text-register-title">Регистрация компании</CardTitle>
            <CardDescription>Создайте аккаунт для вашей компании на платформе Tabys</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-center gap-4 mb-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-green-600" />
                3 дня бесплатно
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-green-600" />
                Без привязки карты
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Данные компании</h3>

                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Название компании</FormLabel>
                        <FormControl>
                          <Input placeholder="ООО Рога и Копыта" {...field} className="h-11 bg-muted/30" data-testid="input-company-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Номер телефона</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="+7 (777) 123-45-67" {...field} className="h-11 bg-muted/30 pl-10" data-testid="input-phone" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4 pt-2 border-t">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide pt-2">Администратор</h3>

                  <FormField
                    control={form.control}
                    name="adminName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Имя</FormLabel>
                        <FormControl>
                          <Input placeholder="Иван Иванов" {...field} className="h-11 bg-muted/30" data-testid="input-admin-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="adminEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="admin@company.com" {...field} className="h-11 bg-muted/30" data-testid="input-admin-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="adminPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Пароль</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Минимум 6 символов"
                              {...field}
                              className="h-11 bg-muted/30 pr-11"
                              data-testid="input-admin-password"
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

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Пол</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-6"
                          >
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="male" id="gender-male" data-testid="radio-gender-male" />
                              <Label htmlFor="gender-male">Мужской</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="female" id="gender-female" data-testid="radio-gender-female" />
                              <Label htmlFor="gender-female">Женский</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {registerMutation.error && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium" data-testid="text-error">
                    {registerMutation.error.message}
                  </div>
                )}

                <Button type="submit" className="w-full h-11 text-base shadow-lg shadow-primary/20" disabled={registerMutation.isPending} data-testid="button-register">
                  {registerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Начать бесплатно на 3 дня
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Уже есть аккаунт?{" "}
                  <Link href="/auth" className="text-primary font-medium hover:underline" data-testid="link-login">
                    Войти
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
