import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Loader2, Coins, Check } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SubscriptionPlan } from "@shared/schema";

const registerCompanySchema = z.object({
  companyName: z.string().min(1, "Введите название компании"),
  planId: z.number({ required_error: "Выберите тариф" }),
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

  useEffect(() => {
    if (user) setLocation("/dashboard");
  }, [user, setLocation]);

  const { data: plans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/plans"],
  });

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
      adminEmail: "",
      adminPassword: "",
      adminName: "",
    },
  });

  function onSubmit(values: RegisterCompanyForm) {
    registerMutation.mutate(values);
  }

  const formatPrice = (price: number) => {
    if (price === 0) return "Бесплатно";
    return `${price.toLocaleString("ru-RU")} KZT/мес`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-2xl">
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-primary/10 rounded-2xl animate-in zoom-in duration-500">
            <Building2 className="w-12 h-12 text-primary" />
          </div>
        </div>

        <Card className="border-border/50 shadow-2xl shadow-black/5">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-display font-bold" data-testid="text-register-title">Регистрация компании</CardTitle>
            <CardDescription>Создайте аккаунт для вашей компании на платформе Rewards</CardDescription>
          </CardHeader>
          <CardContent>
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
                    name="planId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Тарифный план</FormLabel>
                        {plansLoading ? (
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" /> Загрузка планов...
                          </div>
                        ) : (
                          <div className="grid gap-3">
                            {plans?.map((plan) => (
                              <div
                                key={plan.id}
                                className={`relative flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                                  field.value === plan.id
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-border hover:border-primary/50"
                                }`}
                                onClick={() => field.onChange(plan.id)}
                                data-testid={`plan-option-${plan.id}`}
                              >
                                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                  field.value === plan.id ? "border-primary bg-primary" : "border-muted-foreground/30"
                                }`}>
                                  {field.value === plan.id && <Check className="w-3 h-3 text-primary-foreground" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <span className="font-medium">{plan.name}</span>
                                    <span className="text-sm font-semibold text-primary">{formatPrice(plan.priceMonthly)}</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    До {plan.maxUsers} пользователей
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
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
                          <Input type="password" placeholder="Минимум 6 символов" {...field} className="h-11 bg-muted/30" data-testid="input-admin-password" />
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
                  Зарегистрировать компанию
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
