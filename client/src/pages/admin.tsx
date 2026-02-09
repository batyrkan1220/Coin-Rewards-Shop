import { useAuth } from "@/hooks/use-auth";
import { ROLES } from "@shared/schema";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useShopItems, useCreateShopItem, useUpdateShopItem } from "@/hooks/use-shop";
import { useUsers, useTeams, useCreateUser, useUpdateUser, useCreateTeam, useUpdateTeam } from "@/hooks/use-team";
import { useLessons, useCreateLesson, useUpdateLesson } from "@/hooks/use-lessons";
import { useAllTransactions, useBalance } from "@/hooks/use-transactions";
import { useRedemptions, useUpdateRedemptionStatus } from "@/hooks/use-redemptions";
import { useAuditLogs } from "@/hooks/use-audit";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Check, X, Package, Users, BookOpen, ShoppingBag, List, Shield, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const itemSchema = z.object({
  title: z.string().min(1, "Обязательно"),
  description: z.string().min(1, "Обязательно"),
  priceCoins: z.coerce.number().min(1, "Минимум 1"),
  stock: z.coerce.number().min(0).optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});

const userSchema = z.object({
  name: z.string().min(1, "Обязательно"),
  username: z.string().min(1, "Обязательно"),
  password: z.string().min(3, "Минимум 3 символа"),
  role: z.enum(["MANAGER", "ROP", "ADMIN"]),
  teamId: z.coerce.number().nullable().optional(),
  isActive: z.boolean().optional(),
});

const teamSchema = z.object({
  name: z.string().min(1, "Обязательно"),
  ropUserId: z.coerce.number().nullable().optional(),
});

const lessonSchema = z.object({
  course: z.string().min(1, "Обязательно"),
  title: z.string().min(1, "Обязательно"),
  contentType: z.string().default("LINK"),
  content: z.string().min(1, "Обязательно"),
  orderIndex: z.coerce.number().min(0),
  isActive: z.boolean().optional(),
});

export default function AdminPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && user.role !== ROLES.ADMIN) {
      setLocation("/");
    }
  }, [user, setLocation]);

  if (!user || user.role !== ROLES.ADMIN) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold" data-testid="text-admin-title">Администрирование</h2>
        <p className="text-muted-foreground mt-1">Управление платформой</p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="users" data-testid="tab-users"><Users className="w-4 h-4 mr-1" /> Пользователи</TabsTrigger>
          <TabsTrigger value="teams" data-testid="tab-teams"><Shield className="w-4 h-4 mr-1" /> Команды</TabsTrigger>
          <TabsTrigger value="shop" data-testid="tab-shop"><ShoppingBag className="w-4 h-4 mr-1" /> Товары</TabsTrigger>
          <TabsTrigger value="lessons" data-testid="tab-lessons"><BookOpen className="w-4 h-4 mr-1" /> Уроки</TabsTrigger>
          <TabsTrigger value="redemptions" data-testid="tab-redemptions"><Package className="w-4 h-4 mr-1" /> Заявки</TabsTrigger>
          <TabsTrigger value="transactions" data-testid="tab-transactions"><List className="w-4 h-4 mr-1" /> Транзакции</TabsTrigger>
          <TabsTrigger value="audit" data-testid="tab-audit"><Shield className="w-4 h-4 mr-1" /> Журнал</TabsTrigger>
        </TabsList>

        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="teams"><TeamsTab /></TabsContent>
        <TabsContent value="shop"><ShopTab /></TabsContent>
        <TabsContent value="lessons"><LessonsTab /></TabsContent>
        <TabsContent value="redemptions"><RedemptionsTab /></TabsContent>
        <TabsContent value="transactions"><TransactionsTab /></TabsContent>
        <TabsContent value="audit"><AuditTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function UserBalanceCell({ userId }: { userId: number }) {
  const { data: balance } = useBalance(userId);
  return <span className="font-mono font-bold">{balance ?? 0}</span>;
}

function UsersTab() {
  const { data: users, isLoading } = useUsers();
  const { data: teams } = useTeams();
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: "", username: "", password: "", role: "MANAGER", teamId: null, isActive: true },
  });

  const editForm = useForm({
    defaultValues: { name: "", username: "", password: "", role: "MANAGER", teamId: null as number | null, isActive: true },
  });

  const onCreateSubmit = (values: z.infer<typeof userSchema>) => {
    createUser(values, {
      onSuccess: () => {
        toast({ title: "Пользователь создан" });
        setShowCreate(false);
        form.reset();
      },
      onError: (err) => toast({ title: "Ошибка", description: err.message, variant: "destructive" }),
    });
  };

  const onEditSubmit = () => {
    if (!editingUser) return;
    const values = editForm.getValues();
    const updates: any = {};
    if (values.name && values.name !== editingUser.name) updates.name = values.name;
    if (values.username && values.username !== editingUser.username) updates.username = values.username;
    if (values.password) updates.password = values.password;
    if (values.role !== editingUser.role) updates.role = values.role;
    if (values.teamId !== editingUser.teamId) updates.teamId = values.teamId;
    if (values.isActive !== editingUser.isActive) updates.isActive = values.isActive;

    updateUser({ id: editingUser.id, ...updates }, {
      onSuccess: () => {
        toast({ title: "Пользователь обновлен" });
        setEditingUser(null);
      },
      onError: (err) => toast({ title: "Ошибка", description: err.message, variant: "destructive" }),
    });
  };

  if (isLoading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold">Пользователи ({users?.length || 0})</h3>
        <Button onClick={() => setShowCreate(true)} data-testid="button-add-user"><Plus className="w-4 h-4 mr-1" /> Добавить пользователя</Button>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">ФИО</th>
              <th className="text-left p-3 font-medium">Email</th>
              <th className="text-left p-3 font-medium">Роль</th>
              <th className="text-left p-3 font-medium">Команда</th>
              <th className="text-left p-3 font-medium">Баланс</th>
              <th className="text-left p-3 font-medium">Статус</th>
              <th className="text-left p-3 font-medium">Действия</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u: any) => (
              <tr key={u.id} className="border-t" data-testid={`row-user-${u.id}`}>
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3 text-muted-foreground">{u.username}</td>
                <td className="p-3">
                  <Badge variant={u.role === "ADMIN" ? "default" : u.role === "ROP" ? "secondary" : "outline"}>
                    {u.role === "ADMIN" ? "Админ" : u.role === "ROP" ? "РОП" : "Менеджер"}
                  </Badge>
                </td>
                <td className="p-3 text-muted-foreground">{u.team?.name || "—"}</td>
                <td className="p-3" data-testid={`text-balance-${u.id}`}><UserBalanceCell userId={u.id} /></td>
                <td className="p-3">
                  <Badge variant={u.isActive ? "default" : "destructive"}>
                    {u.isActive ? "Активен" : "Заблокирован"}
                  </Badge>
                </td>
                <td className="p-3">
                  <Button variant="ghost" size="icon" onClick={() => {
                    setEditingUser(u);
                    editForm.reset({
                      name: u.name,
                      username: u.username,
                      password: "",
                      role: u.role,
                      teamId: u.teamId,
                      isActive: u.isActive,
                    });
                  }} data-testid={`button-edit-user-${u.id}`}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить пользователя</DialogTitle>
            <DialogDescription>Заполните данные нового пользователя</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>ФИО</FormLabel><FormControl><Input {...field} data-testid="input-user-name" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} data-testid="input-user-email" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>Пароль</FormLabel><FormControl><Input type="password" {...field} data-testid="input-user-password" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem><FormLabel>Роль</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-user-role"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="MANAGER">Менеджер</SelectItem>
                      <SelectItem value="ROP">РОП</SelectItem>
                      <SelectItem value="ADMIN">Админ</SelectItem>
                    </SelectContent>
                  </Select>
                <FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="teamId" render={({ field }) => (
                <FormItem><FormLabel>Команда</FormLabel>
                  <Select onValueChange={(v) => field.onChange(v === "none" ? null : Number(v))} value={field.value ? String(field.value) : "none"}>
                    <FormControl><SelectTrigger data-testid="select-user-team"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">Без команды</SelectItem>
                      {teams?.map((t: any) => (
                        <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                <FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Отмена</Button>
                <Button type="submit" disabled={isCreating} data-testid="button-submit-user">
                  {isCreating && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Создать
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать пользователя</DialogTitle>
            <DialogDescription>{editingUser?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">ФИО</label>
              <Input value={editForm.watch("name")} onChange={(e) => editForm.setValue("name", e.target.value)} data-testid="input-edit-user-name" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input value={editForm.watch("username")} onChange={(e) => editForm.setValue("username", e.target.value)} data-testid="input-edit-user-email" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Новый пароль (оставьте пустым для без изменений)</label>
              <Input type="password" value={editForm.watch("password")} onChange={(e) => editForm.setValue("password", e.target.value)} data-testid="input-edit-user-password" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Роль</label>
              <Select value={editForm.watch("role")} onValueChange={(v) => editForm.setValue("role", v as any)}>
                <SelectTrigger data-testid="select-edit-user-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANAGER">Менеджер</SelectItem>
                  <SelectItem value="ROP">РОП</SelectItem>
                  <SelectItem value="ADMIN">Админ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Команда</label>
              <Select value={editForm.watch("teamId") ? String(editForm.watch("teamId")) : "none"} onValueChange={(v) => editForm.setValue("teamId", v === "none" ? null : Number(v))}>
                <SelectTrigger data-testid="select-edit-user-team"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без команды</SelectItem>
                  {teams?.map((t: any) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editForm.watch("isActive")} onCheckedChange={(v) => editForm.setValue("isActive", v)} data-testid="switch-edit-user-active" />
              <label className="text-sm">{editForm.watch("isActive") ? "Активен" : "Заблокирован"}</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>Отмена</Button>
            <Button onClick={onEditSubmit} disabled={isUpdating} data-testid="button-save-user">
              {isUpdating && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TeamsTab() {
  const { data: teams, isLoading } = useTeams();
  const { data: users } = useUsers();
  const { mutate: createTeam, isPending: isCreating } = useCreateTeam();
  const { mutate: updateTeam, isPending: isUpdating } = useUpdateTeam();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [editName, setEditName] = useState("");
  const [editRopId, setEditRopId] = useState<number | null>(null);

  const rops = users?.filter((u: any) => u.role === "ROP") || [];

  if (isLoading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold">Команды ({teams?.length || 0})</h3>
        <Button onClick={() => setShowCreate(true)} data-testid="button-add-team"><Plus className="w-4 h-4 mr-1" /> Создать команду</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams?.map((t: any) => {
          const teamMembers = users?.filter((u: any) => u.teamId === t.id) || [];
          const rop = users?.find((u: any) => u.id === t.ropUserId);
          return (
            <Card key={t.id} data-testid={`card-team-${t.id}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-base">{t.name}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => {
                  setEditingTeam(t);
                  setEditName(t.name);
                  setEditRopId(t.ropUserId);
                }} data-testid={`button-edit-team-${t.id}`}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">РОП: {rop?.name || "Не назначен"}</p>
                <p className="text-sm text-muted-foreground">Участников: {teamMembers.length}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать команду</DialogTitle>
            <DialogDescription>Введите название новой команды</DialogDescription>
          </DialogHeader>
          <Input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="Название команды" data-testid="input-team-name" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Отмена</Button>
            <Button onClick={() => {
              createTeam({ name: newTeamName }, {
                onSuccess: () => { toast({ title: "Команда создана" }); setShowCreate(false); setNewTeamName(""); },
              });
            }} disabled={isCreating || !newTeamName} data-testid="button-submit-team">
              {isCreating && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingTeam} onOpenChange={(open) => !open && setEditingTeam(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать команду</DialogTitle>
            <DialogDescription>{editingTeam?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Название</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} data-testid="input-edit-team-name" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Назначить РОП</label>
              <Select value={editRopId ? String(editRopId) : "none"} onValueChange={(v) => setEditRopId(v === "none" ? null : Number(v))}>
                <SelectTrigger data-testid="select-edit-team-rop"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Не назначен</SelectItem>
                  {rops.map((r: any) => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTeam(null)}>Отмена</Button>
            <Button onClick={() => {
              updateTeam({ id: editingTeam.id, name: editName, ropUserId: editRopId }, {
                onSuccess: () => { toast({ title: "Команда обновлена" }); setEditingTeam(null); },
              });
            }} disabled={isUpdating} data-testid="button-save-team">
              {isUpdating && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ShopTab() {
  const { data: items, isLoading } = useShopItems();
  const { mutate: createItem, isPending: isCreating } = useCreateShopItem();
  const { mutate: updateItem, isPending: isUpdating } = useUpdateShopItem();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: { title: "", description: "", priceCoins: 100, stock: 10, imageUrl: "", isActive: true },
  });

  const editForm = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: { title: "", description: "", priceCoins: 100, stock: 10, imageUrl: "", isActive: true },
  });

  if (isLoading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold">Товары ({items?.length || 0})</h3>
        <Button onClick={() => { form.reset(); setShowCreate(true); }} data-testid="button-add-item"><Plus className="w-4 h-4 mr-1" /> Добавить товар</Button>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Название</th>
              <th className="text-left p-3 font-medium">Цена</th>
              <th className="text-left p-3 font-medium">Остаток</th>
              <th className="text-left p-3 font-medium">Статус</th>
              <th className="text-left p-3 font-medium">Действия</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item: any) => (
              <tr key={item.id} className="border-t" data-testid={`row-item-${item.id}`}>
                <td className="p-3 font-medium">{item.title}</td>
                <td className="p-3">{item.priceCoins} монет</td>
                <td className="p-3">{item.stock ?? "—"}</td>
                <td className="p-3">
                  <Badge variant={item.isActive ? "default" : "destructive"}>
                    {item.isActive ? "Активен" : "Скрыт"}
                  </Badge>
                </td>
                <td className="p-3">
                  <Button variant="ghost" size="icon" onClick={() => {
                    setEditingItem(item);
                    editForm.reset({
                      title: item.title,
                      description: item.description,
                      priceCoins: item.priceCoins,
                      stock: item.stock || 0,
                      imageUrl: item.imageUrl || "",
                      isActive: item.isActive,
                    });
                  }} data-testid={`button-edit-item-${item.id}`}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить товар</DialogTitle>
            <DialogDescription>Заполните данные товара</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => {
              createItem(values, {
                onSuccess: () => { toast({ title: "Товар создан" }); setShowCreate(false); form.reset(); },
              });
            })} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Название</FormLabel><FormControl><Input {...field} data-testid="input-item-title" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Описание</FormLabel><FormControl><Textarea {...field} data-testid="input-item-description" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="priceCoins" render={({ field }) => (
                  <FormItem><FormLabel>Цена (монеты)</FormLabel><FormControl><Input type="number" {...field} data-testid="input-item-price" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="stock" render={({ field }) => (
                  <FormItem><FormLabel>Остаток</FormLabel><FormControl><Input type="number" {...field} data-testid="input-item-stock" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="imageUrl" render={({ field }) => (
                <FormItem><FormLabel>Ссылка на изображение</FormLabel><FormControl><Input {...field} data-testid="input-item-image" /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Отмена</Button>
                <Button type="submit" disabled={isCreating} data-testid="button-submit-item">
                  {isCreating && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Создать
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать товар</DialogTitle>
            <DialogDescription>{editingItem?.title}</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((values) => {
              updateItem({ id: editingItem.id, ...values }, {
                onSuccess: () => { toast({ title: "Товар обновлен" }); setEditingItem(null); },
              });
            })} className="space-y-4">
              <FormField control={editForm.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Название</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={editForm.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Описание</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editForm.control} name="priceCoins" render={({ field }) => (
                  <FormItem><FormLabel>Цена</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="stock" render={({ field }) => (
                  <FormItem><FormLabel>Остаток</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={editForm.control} name="imageUrl" render={({ field }) => (
                <FormItem><FormLabel>Ссылка на изображение</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={editForm.control} name="isActive" render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="!mt-0">{field.value ? "Активен" : "Скрыт"}</FormLabel>
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>Отмена</Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Сохранить
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LessonsTab() {
  const { data: lessons, isLoading } = useLessons();
  const { mutate: createLesson, isPending: isCreating } = useCreateLesson();
  const { mutate: updateLesson, isPending: isUpdating } = useUpdateLesson();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);

  const form = useForm<z.infer<typeof lessonSchema>>({
    resolver: zodResolver(lessonSchema),
    defaultValues: { course: "", title: "", contentType: "LINK", content: "", orderIndex: 0, isActive: true },
  });

  const editForm = useForm<z.infer<typeof lessonSchema>>({
    resolver: zodResolver(lessonSchema),
    defaultValues: { course: "", title: "", contentType: "LINK", content: "", orderIndex: 0, isActive: true },
  });

  if (isLoading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold">Уроки ({lessons?.length || 0})</h3>
        <Button onClick={() => { form.reset(); setShowCreate(true); }} data-testid="button-add-lesson"><Plus className="w-4 h-4 mr-1" /> Добавить урок</Button>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Курс</th>
              <th className="text-left p-3 font-medium">Название</th>
              <th className="text-left p-3 font-medium">Порядок</th>
              <th className="text-left p-3 font-medium">Статус</th>
              <th className="text-left p-3 font-medium">Действия</th>
            </tr>
          </thead>
          <tbody>
            {lessons?.map((l: any) => (
              <tr key={l.id} className="border-t" data-testid={`row-lesson-${l.id}`}>
                <td className="p-3 text-muted-foreground">{l.course}</td>
                <td className="p-3 font-medium">{l.title}</td>
                <td className="p-3">{l.orderIndex}</td>
                <td className="p-3">
                  <Badge variant={l.isActive ? "default" : "destructive"}>
                    {l.isActive ? "Активен" : "Скрыт"}
                  </Badge>
                </td>
                <td className="p-3">
                  <Button variant="ghost" size="icon" onClick={() => {
                    setEditingLesson(l);
                    editForm.reset({
                      course: l.course,
                      title: l.title,
                      contentType: l.contentType,
                      content: l.content,
                      orderIndex: l.orderIndex,
                      isActive: l.isActive,
                    });
                  }} data-testid={`button-edit-lesson-${l.id}`}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить урок</DialogTitle>
            <DialogDescription>Заполните данные урока</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => {
              createLesson(values, {
                onSuccess: () => { toast({ title: "Урок создан" }); setShowCreate(false); form.reset(); },
              });
            })} className="space-y-4">
              <FormField control={form.control} name="course" render={({ field }) => (
                <FormItem><FormLabel>Курс</FormLabel><FormControl><Input placeholder="Sales Basics" {...field} data-testid="input-lesson-course" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Название урока</FormLabel><FormControl><Input {...field} data-testid="input-lesson-title" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="content" render={({ field }) => (
                <FormItem><FormLabel>Ссылка / Контент</FormLabel><FormControl><Input placeholder="https://..." {...field} data-testid="input-lesson-content" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="orderIndex" render={({ field }) => (
                <FormItem><FormLabel>Порядок</FormLabel><FormControl><Input type="number" {...field} data-testid="input-lesson-order" /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Отмена</Button>
                <Button type="submit" disabled={isCreating} data-testid="button-submit-lesson">
                  {isCreating && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Создать
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingLesson} onOpenChange={(open) => !open && setEditingLesson(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать урок</DialogTitle>
            <DialogDescription>{editingLesson?.title}</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((values) => {
              updateLesson({ id: editingLesson.id, ...values }, {
                onSuccess: () => { toast({ title: "Урок обновлен" }); setEditingLesson(null); },
              });
            })} className="space-y-4">
              <FormField control={editForm.control} name="course" render={({ field }) => (
                <FormItem><FormLabel>Курс</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={editForm.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Название</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={editForm.control} name="content" render={({ field }) => (
                <FormItem><FormLabel>Ссылка / Контент</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={editForm.control} name="orderIndex" render={({ field }) => (
                <FormItem><FormLabel>Порядок</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={editForm.control} name="isActive" render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="!mt-0">{field.value ? "Активен" : "Скрыт"}</FormLabel>
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingLesson(null)}>Отмена</Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Сохранить
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RedemptionsTab() {
  const { data: redemptions, isLoading } = useRedemptions("all");
  const { mutate: updateStatus, isPending } = useUpdateRedemptionStatus();
  const { toast } = useToast();

  if (isLoading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  const statusLabel = (s: string) => {
    switch (s) {
      case "PENDING": return "Ожидает";
      case "APPROVED": return "Подтверждено";
      case "REJECTED": return "Отклонено";
      case "ISSUED": return "Выдано";
      default: return s;
    }
  };

  const statusVariant = (s: string) => {
    switch (s) {
      case "PENDING": return "outline" as const;
      case "APPROVED": return "default" as const;
      case "REJECTED": return "destructive" as const;
      case "ISSUED": return "secondary" as const;
      default: return "outline" as const;
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <h3 className="text-lg font-semibold">Все заявки ({redemptions?.length || 0})</h3>
      <div className="border rounded-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Менеджер</th>
              <th className="text-left p-3 font-medium">Товар</th>
              <th className="text-left p-3 font-medium">Цена</th>
              <th className="text-left p-3 font-medium">Статус</th>
              <th className="text-left p-3 font-medium">Дата</th>
              <th className="text-left p-3 font-medium">Действия</th>
            </tr>
          </thead>
          <tbody>
            {redemptions?.map((r: any) => (
              <tr key={r.id} className="border-t" data-testid={`row-redemption-${r.id}`}>
                <td className="p-3 font-medium">{r.user?.name || "—"}</td>
                <td className="p-3">{r.item?.title || "—"}</td>
                <td className="p-3">{r.priceCoinsSnapshot}</td>
                <td className="p-3"><Badge variant={statusVariant(r.status)}>{statusLabel(r.status)}</Badge></td>
                <td className="p-3 text-muted-foreground">{r.createdAt ? format(new Date(r.createdAt), "d MMM yyyy", { locale: ru }) : "—"}</td>
                <td className="p-3">
                  <div className="flex gap-1 flex-wrap">
                    {r.status === "PENDING" && (
                      <>
                        <Button size="sm" variant="default" onClick={() => updateStatus({ id: r.id, status: "APPROVED" }, {
                          onSuccess: () => toast({ title: "Заявка подтверждена" }),
                        })} disabled={isPending} data-testid={`button-approve-${r.id}`}>
                          <Check className="w-3 h-3 mr-1" /> Подтвердить
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => updateStatus({ id: r.id, status: "REJECTED" }, {
                          onSuccess: () => toast({ title: "Заявка отклонена" }),
                        })} disabled={isPending} data-testid={`button-reject-${r.id}`}>
                          <X className="w-3 h-3 mr-1" /> Отклонить
                        </Button>
                      </>
                    )}
                    {r.status === "APPROVED" && (
                      <Button size="sm" variant="secondary" onClick={() => updateStatus({ id: r.id, status: "ISSUED" }, {
                        onSuccess: () => toast({ title: "Отмечено как выдано" }),
                      })} disabled={isPending} data-testid={`button-issue-${r.id}`}>
                        Выдано
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TransactionsTab() {
  const { data: transactions, isLoading } = useAllTransactions();
  const { data: users } = useUsers();

  if (isLoading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  const getUserName = (id: number) => users?.find((u: any) => u.id === id)?.name || `User #${id}`;

  return (
    <div className="space-y-4 mt-4">
      <h3 className="text-lg font-semibold">Все транзакции ({transactions?.length || 0})</h3>
      <div className="border rounded-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Менеджер</th>
              <th className="text-left p-3 font-medium">Тип</th>
              <th className="text-left p-3 font-medium">Сумма</th>
              <th className="text-left p-3 font-medium">Причина</th>
              <th className="text-left p-3 font-medium">Кем</th>
              <th className="text-left p-3 font-medium">Дата</th>
            </tr>
          </thead>
          <tbody>
            {transactions?.map((t: any) => (
              <tr key={t.id} className="border-t" data-testid={`row-tx-${t.id}`}>
                <td className="p-3 font-medium">{getUserName(t.userId)}</td>
                <td className="p-3">
                  <Badge variant={t.type === "EARN" ? "default" : t.type === "SPEND" ? "destructive" : "secondary"}>
                    {t.type === "EARN" ? "Начисление" : t.type === "SPEND" ? "Списание" : "Коррекция"}
                  </Badge>
                </td>
                <td className="p-3">
                  <span className={`font-mono font-bold ${t.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                    {t.amount > 0 ? "+" : ""}{t.amount}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground max-w-[200px] truncate">{t.reason}</td>
                <td className="p-3 text-muted-foreground">{t.createdById ? getUserName(t.createdById) : "—"}</td>
                <td className="p-3 text-muted-foreground">{t.createdAt ? format(new Date(t.createdAt), "d MMM yyyy HH:mm", { locale: ru }) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AuditTab() {
  const { data: logs, isLoading } = useAuditLogs();

  if (isLoading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  const actionLabel = (action: string) => {
    const map: Record<string, string> = {
      CREATE_USER: "Создание пользователя",
      UPDATE_USER: "Обновление пользователя",
      CREATE_TEAM: "Создание команды",
      UPDATE_TEAM: "Обновление команды",
      CREATE_SHOP_ITEM: "Создание товара",
      UPDATE_SHOP_ITEM: "Обновление товара",
      CREATE_LESSON: "Создание урока",
      UPDATE_LESSON: "Обновление урока",
      CREATE_TRANSACTION: "Операция с монетами",
      ZERO_OUT: "Обнуление баланса",
      REDEMPTION_APPROVED: "Подтверждение заявки",
      REDEMPTION_REJECTED: "Отклонение заявки",
      REDEMPTION_ISSUED: "Выдача награды",
    };
    return map[action] || action;
  };

  return (
    <div className="space-y-4 mt-4">
      <h3 className="text-lg font-semibold">Журнал действий ({logs?.length || 0})</h3>
      <div className="border rounded-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Действие</th>
              <th className="text-left p-3 font-medium">Объект</th>
              <th className="text-left p-3 font-medium">Кто</th>
              <th className="text-left p-3 font-medium">Детали</th>
              <th className="text-left p-3 font-medium">Дата</th>
            </tr>
          </thead>
          <tbody>
            {logs?.map((log: any) => (
              <tr key={log.id} className="border-t" data-testid={`row-audit-${log.id}`}>
                <td className="p-3 font-medium">{actionLabel(log.action)}</td>
                <td className="p-3 text-muted-foreground">{log.entity} #{log.entityId}</td>
                <td className="p-3">{log.actor?.name || `User #${log.actorId}`}</td>
                <td className="p-3 text-muted-foreground text-xs max-w-[250px] truncate">
                  {log.details ? JSON.stringify(log.details) : "—"}
                </td>
                <td className="p-3 text-muted-foreground">{log.createdAt ? format(new Date(log.createdAt), "d MMM yyyy HH:mm", { locale: ru }) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
