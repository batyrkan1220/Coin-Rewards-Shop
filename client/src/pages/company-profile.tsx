import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Users, CreditCard, Globe, Calendar, Loader2, Save, Shield, KeyRound } from "lucide-react";
import type { Company, SubscriptionPlan } from "@shared/schema";

type CompanyWithDetails = Company & { plan: SubscriptionPlan | null; userCount: number };

const updateCompanySchema = z.object({
  name: z.string().min(1, "Введите название компании"),
});

const changeCredentialsSchema = z.object({
  newEmail: z.string().email("Некорректный email").optional().or(z.literal("")),
  newPassword: z.string().min(6, "Минимум 6 символов").optional().or(z.literal("")),
  currentPassword: z.string().min(1, "Введите текущий пароль"),
});

export default function CompanyProfilePage() {
  const { toast } = useToast();

  const { data: company, isLoading } = useQuery<CompanyWithDetails>({
    queryKey: ["/api/company"],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof updateCompanySchema>) => {
      const res = await apiRequest("PATCH", "/api/company", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company"] });
      toast({ title: "Профиль компании обновлен" });
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const credentialsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof changeCredentialsSchema>) => {
      const body: any = { currentPassword: data.currentPassword };
      if (data.newEmail) body.newEmail = data.newEmail;
      if (data.newPassword) body.newPassword = data.newPassword;
      const res = await apiRequest("PATCH", "/api/company/credentials", body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      credentialsForm.reset({ newEmail: "", newPassword: "", currentPassword: "" });
      toast({ title: "Данные для входа обновлены" });
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const form = useForm<z.infer<typeof updateCompanySchema>>({
    resolver: zodResolver(updateCompanySchema),
    defaultValues: {
      name: company?.name ?? "",
    },
    values: company ? {
      name: company.name,
    } : undefined,
  });

  const credentialsForm = useForm<z.infer<typeof changeCredentialsSchema>>({
    resolver: zodResolver(changeCredentialsSchema),
    defaultValues: {
      newEmail: "",
      newPassword: "",
      currentPassword: "",
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Компания не найдена
      </div>
    );
  }

  const formatPrice = (price: number) => {
    if (price === 0) return "Бесплатно";
    return `${price.toLocaleString("ru-RU")} KZT/мес`;
  };

  const formatDate = (dateStr: string | Date | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold" data-testid="text-company-title">Профиль компании</h1>
          <p className="text-sm text-muted-foreground">Управление настройками вашей компании</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-user-count">{company.userCount}</p>
                <p className="text-sm text-muted-foreground">
                  из {company.plan?.maxUsers ?? "---"} пользователей
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-lg font-bold" data-testid="text-plan-name">{company.plan?.name ?? "Без плана"}</p>
                <p className="text-sm text-muted-foreground">
                  {company.plan ? formatPrice(company.plan.priceMonthly) : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-lg font-bold" data-testid="text-subdomain">{company.subdomain}</p>
                <p className="text-sm text-muted-foreground">.rewards.kz</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Редактирование
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => updateMutation.mutate(v))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название компании</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-muted/30" data-testid="input-edit-company-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-company">
                  {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Сохранить
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              Данные для входа
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...credentialsForm}>
              <form onSubmit={credentialsForm.handleSubmit((v) => credentialsMutation.mutate(v))} className="space-y-4">
                <FormField
                  control={credentialsForm.control}
                  name="newEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Новый email (логин)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Оставьте пустым, если не меняете" {...field} className="bg-muted/30" data-testid="input-new-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={credentialsForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Новый пароль</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Оставьте пустым, если не меняете" {...field} className="bg-muted/30" data-testid="input-new-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={credentialsForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Текущий пароль</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Для подтверждения изменений" {...field} className="bg-muted/30" data-testid="input-current-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={credentialsMutation.isPending} data-testid="button-save-credentials">
                  {credentialsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Обновить данные входа
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Информация
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Globe className="w-4 h-4" /> Субдомен
            </span>
            <Badge variant="secondary" data-testid="badge-subdomain">{company.subdomain}.rewards.kz</Badge>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Тарифный план
            </span>
            <Badge variant="outline" data-testid="badge-plan">{company.plan?.name ?? "-"}</Badge>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" /> Лимит пользователей
            </span>
            <span className="text-sm font-medium" data-testid="text-user-limit">
              {company.userCount} / {company.plan?.maxUsers ?? "---"}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Дата регистрации
            </span>
            <span className="text-sm font-medium" data-testid="text-created-at">{formatDate(company.createdAt)}</span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Статус</span>
            <Badge variant={company.isActive ? "default" : "destructive"} data-testid="badge-status">
              {company.isActive ? "Активна" : "Заблокирована"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
