import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Building2, CreditCard, Users, Plus, Pencil, BarChart3, Globe, Copy, KeyRound } from "lucide-react";
import type { Company, SubscriptionPlan } from "@shared/schema";

type CompanyWithDetails = Company & { plan: SubscriptionPlan | null; userCount: number; adminUser: { id: number; username: string; name: string } | null };

type Tab = "stats" | "companies" | "plans";

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("stats");

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "stats", label: "Статистика", icon: BarChart3 },
    { id: "companies", label: "Компании", icon: Building2 },
    { id: "plans", label: "Тарифы", icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            onClick={() => setActiveTab(tab.id)}
            className="gap-2"
            data-testid={`tab-${tab.id}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "stats" && <StatsTab />}
      {activeTab === "companies" && <CompaniesTab />}
      {activeTab === "plans" && <PlansTab />}
    </div>
  );
}

function StatsTab() {
  const { data: stats, isLoading } = useQuery<{ totalCompanies: number; activeCompanies: number; totalUsers: number }>({
    queryKey: ["/api/super/stats"],
  });

  const { data: companiesList } = useQuery<CompanyWithDetails[]>({
    queryKey: ["/api/super/companies"],
  });

  if (isLoading) {
    return <div className="text-muted-foreground">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Всего компаний</CardTitle>
            <Building2 className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-companies">{stats?.totalCompanies ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Активных компаний</CardTitle>
            <Globe className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-active-companies">{stats?.activeCompanies ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Всего пользователей</CardTitle>
            <Users className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-users">{stats?.totalUsers ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {companiesList && companiesList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Обзор компаний</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {companiesList.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-4 p-3 rounded-lg border">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Building2 className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.subdomain}.platform.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={c.isActive ? "default" : "secondary"}>
                      {c.isActive ? "Активна" : "Неактивна"}
                    </Badge>
                    <Badge variant="outline">{c.userCount} польз.</Badge>
                    {c.plan && <Badge variant="outline">{c.plan.name}</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CompaniesTab() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyWithDetails | null>(null);
  const [formData, setFormData] = useState({ name: "", subdomain: "", planId: "", supportEmail: "", adminUsername: "", adminPassword: "", adminName: "" });
  const [credentialsDialog, setCredentialsDialog] = useState<{ open: boolean; companyName: string; username: string; password: string }>({ open: false, companyName: "", username: "", password: "" });

  const { data: companiesList, isLoading } = useQuery<CompanyWithDetails[]>({
    queryKey: ["/api/super/companies"],
  });

  const { data: plans } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/super/plans"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/super/companies", data);
      return await res.json() as { company: Company; adminCredentials: { username: string; password: string; name: string } | null };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/super/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/super/stats"] });
      setDialogOpen(false);
      resetForm();
      if (result.adminCredentials) {
        setCredentialsDialog({
          open: true,
          companyName: result.company.name,
          username: result.adminCredentials.username,
          password: result.adminCredentials.password,
        });
      } else {
        toast({ title: "Компания создана" });
      }
    },
    onError: (err: any) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/super/companies/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/super/stats"] });
      setDialogOpen(false);
      setEditingCompany(null);
      resetForm();
      toast({ title: "Компания обновлена" });
    },
    onError: (err: any) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", subdomain: "", planId: "", supportEmail: "", adminUsername: "", adminPassword: "", adminName: "" });
  };

  const openCreate = () => {
    setEditingCompany(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (company: CompanyWithDetails) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      subdomain: company.subdomain,
      planId: company.planId ? String(company.planId) : "",
      supportEmail: company.supportEmail || "",
      adminUsername: "",
      adminPassword: "",
      adminName: "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingCompany) {
      updateMutation.mutate({
        id: editingCompany.id,
        data: {
          name: formData.name,
          subdomain: formData.subdomain,
          planId: formData.planId ? Number(formData.planId) : null,
          supportEmail: formData.supportEmail || null,
        },
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        subdomain: formData.subdomain,
        planId: formData.planId ? Number(formData.planId) : null,
        supportEmail: formData.supportEmail || null,
        adminUsername: formData.adminUsername || undefined,
        adminPassword: formData.adminPassword || undefined,
        adminName: formData.adminName || undefined,
      });
    }
  };

  const toggleActive = (company: CompanyWithDetails) => {
    updateMutation.mutate({
      id: company.id,
      data: { isActive: !company.isActive },
    });
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Загрузка...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-semibold">Компании</h2>
        <Button onClick={openCreate} className="gap-2" data-testid="button-create-company">
          <Plus className="w-4 h-4" />
          Создать компанию
        </Button>
      </div>

      <div className="space-y-3">
        {companiesList?.map((company) => (
          <Card key={company.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Building2 className="w-6 h-6 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate" data-testid={`text-company-name-${company.id}`}>{company.name}</p>
                    <p className="text-sm text-muted-foreground">{company.subdomain}.platform.com</p>
                    {company.adminUser && (
                      <p className="text-xs text-muted-foreground" data-testid={`text-admin-login-${company.id}`}>
                        <KeyRound className="w-3 h-3 inline mr-1" />
                        Админ: {company.adminUser.name} ({company.adminUser.username})
                      </p>
                    )}
                    {company.supportEmail && <p className="text-xs text-muted-foreground">{company.supportEmail}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" data-testid={`text-user-count-${company.id}`}>
                    <Users className="w-3 h-3 mr-1" />
                    {company.userCount} польз.
                  </Badge>
                  {company.plan && (
                    <Badge variant="outline">
                      <CreditCard className="w-3 h-3 mr-1" />
                      {company.plan.name}
                    </Badge>
                  )}
                  <Badge variant={company.isActive ? "default" : "secondary"}>
                    {company.isActive ? "Активна" : "Неактивна"}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={company.isActive || false}
                      onCheckedChange={() => toggleActive(company)}
                      data-testid={`switch-active-${company.id}`}
                    />
                  </div>
                  <Button variant="outline" size="icon" onClick={() => openEdit(company)} data-testid={`button-edit-company-${company.id}`}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!companiesList || companiesList.length === 0) && (
          <p className="text-muted-foreground text-center py-8">Нет компаний</p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCompany ? "Редактировать компанию" : "Создать компанию"}</DialogTitle>
            <DialogDescription>
              {editingCompany ? "Измените данные компании" : "Заполните данные для новой компании"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                placeholder="ООО Компания"
                data-testid="input-company-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Субдомен</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={formData.subdomain}
                  onChange={(e) => setFormData(p => ({ ...p, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                  placeholder="company-name"
                  data-testid="input-company-subdomain"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">.platform.com</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Тариф</Label>
              <Select value={formData.planId} onValueChange={(v) => setFormData(p => ({ ...p, planId: v }))}>
                <SelectTrigger data-testid="select-company-plan">
                  <SelectValue placeholder="Выберите тариф" />
                </SelectTrigger>
                <SelectContent>
                  {plans?.map(plan => (
                    <SelectItem key={plan.id} value={String(plan.id)}>{plan.name} (до {plan.maxUsers} польз.)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Email поддержки</Label>
              <Input
                value={formData.supportEmail}
                onChange={(e) => setFormData(p => ({ ...p, supportEmail: e.target.value }))}
                placeholder="support@company.com"
                data-testid="input-company-support-email"
              />
            </div>

            {!editingCompany && (
              <div className="space-y-4 border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground">Администратор компании (необязательно)</p>
                <div className="space-y-2">
                  <Label>Email администратора</Label>
                  <Input
                    value={formData.adminUsername}
                    onChange={(e) => setFormData(p => ({ ...p, adminUsername: e.target.value }))}
                    placeholder="admin@company.com"
                    data-testid="input-admin-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Имя администратора</Label>
                  <Input
                    value={formData.adminName}
                    onChange={(e) => setFormData(p => ({ ...p, adminName: e.target.value }))}
                    placeholder="Иванов Иван"
                    data-testid="input-admin-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Пароль администратора</Label>
                  <Input
                    type="password"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData(p => ({ ...p, adminPassword: e.target.value }))}
                    placeholder="Минимум 3 символа"
                    data-testid="input-admin-password"
                  />
                </div>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              className="w-full"
              disabled={createMutation.isPending || updateMutation.isPending || !formData.name || !formData.subdomain}
              data-testid="button-submit-company"
            >
              {(createMutation.isPending || updateMutation.isPending) ? "Сохранение..." : editingCompany ? "Сохранить" : "Создать"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={credentialsDialog.open} onOpenChange={(open) => { if (!open) setCredentialsDialog({ open: false, companyName: "", username: "", password: "" }); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Компания создана</DialogTitle>
            <DialogDescription>
              Данные для входа администратора компании "{credentialsDialog.companyName}". Сохраните пароль - он не будет показан повторно.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Логин</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={credentialsDialog.username} data-testid="text-credentials-login" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => { navigator.clipboard.writeText(credentialsDialog.username); toast({ title: "Логин скопирован" }); }}
                  data-testid="button-copy-login"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Пароль</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={credentialsDialog.password} data-testid="text-credentials-password" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => { navigator.clipboard.writeText(credentialsDialog.password); toast({ title: "Пароль скопирован" }); }}
                  data-testid="button-copy-password"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlansTab() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState({ name: "", maxUsers: "10", priceMonthly: "0" });

  const { data: plans, isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/super/plans"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/super/plans", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super/plans"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Тариф создан" });
    },
    onError: (err: any) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/super/plans/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super/plans"] });
      setDialogOpen(false);
      setEditingPlan(null);
      resetForm();
      toast({ title: "Тариф обновлен" });
    },
    onError: (err: any) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", maxUsers: "10", priceMonthly: "0" });
  };

  const openCreate = () => {
    setEditingPlan(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      maxUsers: String(plan.maxUsers),
      priceMonthly: String(plan.priceMonthly),
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      name: formData.name,
      maxUsers: Number(formData.maxUsers),
      priceMonthly: Number(formData.priceMonthly),
    };

    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const toggleActive = (plan: SubscriptionPlan) => {
    updateMutation.mutate({
      id: plan.id,
      data: { isActive: !plan.isActive },
    });
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Загрузка...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-semibold">Тарифные планы</h2>
        <Button onClick={openCreate} className="gap-2" data-testid="button-create-plan">
          <Plus className="w-4 h-4" />
          Создать тариф
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans?.map((plan) => (
          <Card key={plan.id}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="text-base" data-testid={`text-plan-name-${plan.id}`}>{plan.name}</CardTitle>
              <div className="flex items-center gap-1">
                <Switch
                  checked={plan.isActive || false}
                  onCheckedChange={() => toggleActive(plan)}
                  data-testid={`switch-plan-active-${plan.id}`}
                />
                <Button variant="outline" size="icon" onClick={() => openEdit(plan)} data-testid={`button-edit-plan-${plan.id}`}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Макс. пользователей</span>
                <span className="font-medium">{plan.maxUsers}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Цена / мес</span>
                <span className="font-medium">{plan.priceMonthly} KZT</span>
              </div>
              <Badge variant={plan.isActive ? "default" : "secondary"}>
                {plan.isActive ? "Активен" : "Неактивен"}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
      {(!plans || plans.length === 0) && (
        <p className="text-muted-foreground text-center py-8">Нет тарифов</p>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Редактировать тариф" : "Создать тариф"}</DialogTitle>
            <DialogDescription>
              {editingPlan ? "Измените параметры тарифа" : "Заполните параметры нового тарифа"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                placeholder="Базовый"
                data-testid="input-plan-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Макс. пользователей</Label>
              <Input
                type="number"
                value={formData.maxUsers}
                onChange={(e) => setFormData(p => ({ ...p, maxUsers: e.target.value }))}
                min="1"
                data-testid="input-plan-max-users"
              />
            </div>
            <div className="space-y-2">
              <Label>Цена в месяц (KZT)</Label>
              <Input
                type="number"
                value={formData.priceMonthly}
                onChange={(e) => setFormData(p => ({ ...p, priceMonthly: e.target.value }))}
                min="0"
                data-testid="input-plan-price"
              />
            </div>
            <Button
              onClick={handleSubmit}
              className="w-full"
              disabled={createMutation.isPending || updateMutation.isPending || !formData.name}
              data-testid="button-submit-plan"
            >
              {(createMutation.isPending || updateMutation.isPending) ? "Сохранение..." : editingPlan ? "Сохранить" : "Создать"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
