import { useAuth } from "@/hooks/use-auth";
import { useTeams } from "@/hooks/use-team";
import { useBalance } from "@/hooks/use-transactions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";
import { ROLES } from "@shared/schema";
import { Loader2, User, Lock, Coins, UsersRound } from "lucide-react";
import { useState } from "react";

const nameSchema = z.object({
  name: z.string().min(1, "Обязательное поле"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Обязательное поле"),
  newPassword: z.string().min(3, "Минимум 3 символа"),
  confirmPassword: z.string().min(3, "Минимум 3 символа"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type NameData = z.infer<typeof nameSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: teams } = useTeams();
  const { data: balance } = useBalance(user?.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const team = teams?.find((t: any) => t.id === user?.teamId);

  const nameForm = useForm<NameData>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: user?.name || "" },
  });

  const passwordForm = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const updateNameMutation = useMutation({
    mutationFn: async (data: NameData) => {
      const res = await fetch(api.profile.update.path, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: data.name }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Ошибка обновления");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      toast({ title: "Имя обновлено" });
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordData) => {
      const res = await fetch(api.profile.update.path, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Ошибка обновления пароля");
      }
      return await res.json();
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({ title: "Пароль обновлен" });
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const roleName = user?.role === ROLES.ADMIN ? "Администратор" : user?.role === ROLES.ROP ? "РОП" : "Менеджер";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold" data-testid="text-profile-title">Личный кабинет</h2>
        <p className="text-muted-foreground mt-1">Управление профилем и настройками</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-border">
                <AvatarImage src={user?.gender === "female"
                  ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}&top=longHairStraight,longHairBob,longHairCurly,longHairMiaWallace&accessories=prescription01,prescription02,round&facialHair=blank`
                  : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}&top=shortHairShortFlat,shortHairShortWaved,shortHairShortCurly,shortHairDreads01&facialHair=beardLight,beardMedium,moustacheFancy,blank`
                } />
                <AvatarFallback className="text-2xl">{user?.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="text-xl font-bold" data-testid="text-profile-name">{user?.name}</h3>
                <p className="text-sm text-muted-foreground" data-testid="text-profile-email">{user?.username}</p>
                <Badge variant="secondary" className="mt-2" data-testid="badge-profile-role">{roleName}</Badge>
              </div>

              <div className="w-full space-y-3 mt-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Баланс</span>
                  </div>
                  <span className="font-bold" data-testid="text-profile-balance">{balance ?? 0}</span>
                </div>
                {team && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <UsersRound className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Команда</span>
                    </div>
                    <span className="font-medium text-sm" data-testid="text-profile-team">{team.name}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-lg">Личные данные</CardTitle>
              </div>
              <CardDescription>Измените ваше отображаемое имя</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...nameForm}>
                <form onSubmit={nameForm.handleSubmit((d) => updateNameMutation.mutate(d))} className="space-y-4">
                  <FormField
                    control={nameForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Имя</FormLabel>
                        <FormControl>
                          <Input data-testid="input-profile-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={updateNameMutation.isPending}
                    data-testid="button-save-name"
                  >
                    {updateNameMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Сохранить
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-lg">Смена пароля</CardTitle>
              </div>
              <CardDescription>Введите текущий и новый пароль</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit((d) => updatePasswordMutation.mutate(d))} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Текущий пароль</FormLabel>
                        <FormControl>
                          <Input type="password" data-testid="input-current-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Новый пароль</FormLabel>
                        <FormControl>
                          <Input type="password" data-testid="input-new-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Подтверждение пароля</FormLabel>
                        <FormControl>
                          <Input type="password" data-testid="input-confirm-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={updatePasswordMutation.isPending}
                    data-testid="button-save-password"
                  >
                    {updatePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Изменить пароль
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
