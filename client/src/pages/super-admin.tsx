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
import { Building2, CreditCard, Users, Plus, Pencil, BarChart3, Globe, Copy, KeyRound, Clock, CalendarPlus, Phone, Calendar } from "lucide-react";
import type { Company, SubscriptionPlan } from "@shared/schema";

type CompanyWithDetails = Company & { plan: SubscriptionPlan | null; userCount: number; adminUser: { id: number; username: string; name: string } | null };

type Tab = "stats" | "companies" | "plans";

function getTrialDaysLeft(trialEndsAt: string | Date | null | undefined): number | null {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

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

  const trialCompanies = companiesList?.filter(c => {
    const days = getTrialDaysLeft(c.trialEndsAt);
    return days !== null && days > 0;
  }) || [];

  const expiredTrials = companiesList?.filter(c => {
    const days = getTrialDaysLeft(c.trialEndsAt);
    return days !== null && days <= 0;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Активных</CardTitle>
            <Globe className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-active-companies">{stats?.activeCompanies ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Пользователей</CardTitle>
            <Users className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-users">{stats?.totalUsers ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">На триале</CardTitle>
            <Clock className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-trial-companies">{trialCompanies.length}</div>
            {expiredTrials.length > 0 && (
              <p className="text-xs text-destructive mt-1">Истекло: {expiredTrials.length}</p>
            )}
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
              {companiesList.map((c) => {
                const daysLeft = getTrialDaysLeft(c.trialEndsAt);
                return (
                  <div key={c.id} className="flex items-center justify-between gap-4 p-3 rounded-lg border">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Building2 className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.userCount} польз.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {daysLeft !== null && (
                        <Badge variant={daysLeft > 0 ? "outline" : "destructive"}>
                          <Clock className="w-3 h-3 mr-1" />
                          {daysLeft > 0 ? `${daysLeft} дн.` : "Истёк"}
                        </Badge>
                      )}
                      <Badge variant={c.isActive ? "default" : "secondary"}>
                        {c.isActive ? "Активна" : "Неактивна"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
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
  const [formData, setFormData] = useState({ name: "", planId: "", adminUsername: "", adminPassword: "", adminName: "" });
  const [credentialsDialog, setCredentialsDialog] = useState<{ open: boolean; companyName: string; username: string; password: string }>({ open: false, companyName: "", username: "", password: "" });
  const [adminCredDialog, setAdminCredDialog] = useState<{ open: boolean; company: CompanyWithDetails | null; newEmail: string; newPassword: string }>({ open: false, company: null, newEmail: "", newPassword: "" });
  const [trialDialog, setTrialDialog] = useState<{ open: boolean; company: CompanyWithDetails | null; days: string }>({ open: false, company: null, days: "7" });

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

  const trialMutation = useMutation({
    mutationFn: ({ id, trialEndsAt }: { id: number; trialEndsAt: string }) =>
      apiRequest("PATCH", `/api/super/companies/${id}`, { trialEndsAt }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/super/stats"] });
      setTrialDialog({ open: false, company: null, days: "7" });
      toast({ title: "Триал обновлен" });
    },
    onError: (err: any) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const updateAdminCredMutation = useMutation({
    mutationFn: async ({ companyId, data }: { companyId: number; data: { newEmail?: string; newPassword?: string } }) => {
      const res = await apiRequest("PATCH", `/api/super/companies/${companyId}/admin-credentials`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super/companies"] });
      setAdminCredDialog({ open: false, company: null, newEmail: "", newPassword: "" });
      toast({ title: "Данные администратора обновлены" });
    },
    onError: (err: any) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", planId: "", adminUsername: "", adminPassword: "", adminName: "" });
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
      planId: company.planId ? String(company.planId) : "",
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
          planId: formData.planId ? Number(formData.planId) : null,
        },
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        planId: formData.planId ? Number(formData.planId) : null,
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

  const handleTrialSubmit = () => {
    if (!trialDialog.company) return;
    const days = parseInt(trialDialog.days);
    if (isNaN(days) || days < 0) return;
    const base = trialDialog.company.trialEndsAt
      ? new Date(Math.max(new Date(trialDialog.company.trialEndsAt).getTime(), Date.now()))
      : new Date();
    base.setDate(base.getDate() + days);
    trialMutation.mutate({ id: trialDialog.company.id, trialEndsAt: base.toISOString() });
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
        {companiesList?.map((company) => {
          const daysLeft = getTrialDaysLeft(company.trialEndsAt);
          return (
            <Card key={company.id}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Building2 className="w-6 h-6 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate" data-testid={`text-company-name-${company.id}`}>{company.name}</p>
                        {company.adminUser && (
                          <p className="text-xs text-muted-foreground" data-testid={`text-admin-login-${company.id}`}>
                            <KeyRound className="w-3 h-3 inline mr-1" />
                            Админ: {company.adminUser.name} ({company.adminUser.username})
                          </p>
                        )}
                        {(company as any).phone && (
                          <p className="text-xs text-muted-foreground">
                            <Phone className="w-3 h-3 inline mr-1" />
                            {(company as any).phone}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          Создана: {formatDate(company.createdAt)}
                        </p>
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
                      {daysLeft !== null && (
                        <Badge
                          variant={daysLeft > 3 ? "outline" : daysLeft > 0 ? "secondary" : "destructive"}
                          data-testid={`badge-trial-${company.id}`}
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          {daysLeft > 0
                            ? `Триал: ${daysLeft} дн.`
                            : "Триал истёк"
                          }
                        </Badge>
                      )}
                      <Badge variant={company.isActive ? "default" : "secondary"}>
                        {company.isActive ? "Активна" : "Неактивна"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap border-t pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTrialDialog({ open: true, company, days: "7" })}
                      className="gap-1"
                      data-testid={`button-trial-${company.id}`}
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      Триал
                    </Button>
                    <div className="flex items-center gap-1 ml-1">
                      <Switch
                        checked={company.isActive || false}
                        onCheckedChange={() => toggleActive(company)}
                        data-testid={`switch-active-${company.id}`}
                      />
                      <span className="text-xs text-muted-foreground">Активна</span>
                    </div>
                    <div className="flex-1" />
                    {company.adminUser && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAdminCredDialog({ open: true, company, newEmail: "", newPassword: "" })}
                        className="gap-1"
                        data-testid={`button-admin-cred-${company.id}`}
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        Пароль админа
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => openEdit(company)} className="gap-1" data-testid={`button-edit-company-${company.id}`}>
                      <Pencil className="w-3.5 h-3.5" />
                      Изменить
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
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
              disabled={createMutation.isPending || updateMutation.isPending || !formData.name}
              data-testid="button-submit-company"
            >
              {(createMutation.isPending || updateMutation.isPending) ? "Сохранение..." : editingCompany ? "Сохранить" : "Создать"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={trialDialog.open} onOpenChange={(open) => { if (!open) setTrialDialog({ open: false, company: null, days: "7" }); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Управление триалом</DialogTitle>
            <DialogDescription>
              Компания: {trialDialog.company?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {trialDialog.company?.trialEndsAt && (
              <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                <p className="text-sm text-muted-foreground">Текущий триал до:</p>
                <p className="font-medium" data-testid="text-current-trial">{formatDate(trialDialog.company.trialEndsAt)}</p>
                {(() => {
                  const days = getTrialDaysLeft(trialDialog.company!.trialEndsAt);
                  if (days === null) return null;
                  return (
                    <p className={`text-sm font-medium ${days > 0 ? "text-green-600" : "text-destructive"}`}>
                      {days > 0 ? `Осталось ${days} дн.` : `Истёк ${Math.abs(days)} дн. назад`}
                    </p>
                  );
                })()}
              </div>
            )}
            <div className="space-y-2">
              <Label>Добавить дней</Label>
              <Input
                type="number"
                min="0"
                value={trialDialog.days}
                onChange={(e) => setTrialDialog(p => ({ ...p, days: e.target.value }))}
                placeholder="7"
                data-testid="input-trial-days"
              />
              <p className="text-xs text-muted-foreground">
                Новая дата окончания: {(() => {
                  const days = parseInt(trialDialog.days);
                  if (isNaN(days)) return "-";
                  const base = trialDialog.company?.trialEndsAt
                    ? new Date(Math.max(new Date(trialDialog.company.trialEndsAt).getTime(), Date.now()))
                    : new Date();
                  base.setDate(base.getDate() + days);
                  return formatDate(base);
                })()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setTrialDialog(p => ({ ...p, days: "3" }))}
              >
                3 дня
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setTrialDialog(p => ({ ...p, days: "7" }))}
              >
                7 дней
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setTrialDialog(p => ({ ...p, days: "14" }))}
              >
                14 дней
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setTrialDialog(p => ({ ...p, days: "30" }))}
              >
                30 дней
              </Button>
            </div>
            <Button
              className="w-full"
              onClick={handleTrialSubmit}
              disabled={trialMutation.isPending}
              data-testid="button-submit-trial"
            >
              {trialMutation.isPending ? "Сохранение..." : "Продлить триал"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={adminCredDialog.open} onOpenChange={(open) => { if (!open) setAdminCredDialog({ open: false, company: null, newEmail: "", newPassword: "" }); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Изменить данные администратора</DialogTitle>
            <DialogDescription>
              Компания: {adminCredDialog.company?.name}. Текущий логин: {adminCredDialog.company?.adminUser?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Новый email (логин)</Label>
              <Input
                type="email"
                value={adminCredDialog.newEmail}
                onChange={(e) => setAdminCredDialog(p => ({ ...p, newEmail: e.target.value }))}
                placeholder="Оставьте пустым, если не меняете"
                data-testid="input-super-admin-email"
              />
            </div>
            <div className="space-y-2">
              <Label>Новый пароль</Label>
              <Input
                type="password"
                value={adminCredDialog.newPassword}
                onChange={(e) => setAdminCredDialog(p => ({ ...p, newPassword: e.target.value }))}
                placeholder="Оставьте пустым, если не меняете"
                data-testid="input-super-admin-password"
              />
            </div>
            <Button
              className="w-full"
              disabled={updateAdminCredMutation.isPending || (!adminCredDialog.newEmail && !adminCredDialog.newPassword)}
              onClick={() => {
                if (!adminCredDialog.company) return;
                const data: any = {};
                if (adminCredDialog.newEmail) data.newEmail = adminCredDialog.newEmail;
                if (adminCredDialog.newPassword) data.newPassword = adminCredDialog.newPassword;
                updateAdminCredMutation.mutate({ companyId: adminCredDialog.company.id, data });
              }}
              data-testid="button-submit-admin-cred"
            >
              {updateAdminCredMutation.isPending ? "Сохранение..." : "Сохранить"}
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

  const toggleActive = (plan: SubscriptionPlan) => {
    updateMutation.mutate({
      id: plan.id,
      data: { isActive: !plan.isActive },
    });
  };

  const handleSubmit = () => {
    const data = {
      name: formData.name,
      maxUsers: Number(formData.maxUsers),
      priceMonthly: Number(formData.priceMonthly),
    };
    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data });
    } else {
      createMutation.mutate(data);
    }
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

      <div className="space-y-3">
        {plans?.map((plan) => (
          <Card key={plan.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="font-medium" data-testid={`text-plan-name-${plan.id}`}>{plan.name}</p>
                  <p className="text-sm text-muted-foreground">
                    До {plan.maxUsers} польз. / {plan.priceMonthly > 0 ? `${plan.priceMonthly} KZT/мес` : "Бесплатно"}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={plan.isActive ? "default" : "secondary"}>
                    {plan.isActive ? "Активен" : "Неактивен"}
                  </Badge>
                  <Switch
                    checked={plan.isActive || false}
                    onCheckedChange={() => toggleActive(plan)}
                    data-testid={`switch-plan-active-${plan.id}`}
                  />
                  <Button variant="outline" size="icon" onClick={() => openEdit(plan)} data-testid={`button-edit-plan-${plan.id}`}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!plans || plans.length === 0) && (
          <p className="text-muted-foreground text-center py-8">Нет тарифов</p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Редактировать тариф" : "Создать тариф"}</DialogTitle>
            <DialogDescription>
              {editingPlan ? "Измените параметры тарифа" : "Заполните данные для нового тарифа"}
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
                placeholder="50"
                data-testid="input-plan-max-users"
              />
            </div>
            <div className="space-y-2">
              <Label>Цена (KZT/мес)</Label>
              <Input
                type="number"
                value={formData.priceMonthly}
                onChange={(e) => setFormData(p => ({ ...p, priceMonthly: e.target.value }))}
                placeholder="0"
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
