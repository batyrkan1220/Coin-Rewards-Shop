import { useAuth } from "@/hooks/use-auth";
import { useTransactions, useBalance, usePendingTransactions, useUpdateTransactionStatus } from "@/hooks/use-transactions";
import { useRedemptions, useUpdateRedemptionStatus } from "@/hooks/use-redemptions";
import { useUsers, useTeams } from "@/hooks/use-team";
import { useShopItems } from "@/hooks/use-shop";
import { useLessons } from "@/hooks/use-lessons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  ShoppingBag,
  Coins,
  Users,
  BookOpen,
  CheckCircle,
  XCircle,
  PackageCheck,
  TrendingUp,
  BarChart3,
  AlertCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ROLES } from "@shared/schema";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: transactions, isLoading: txLoading } = useTransactions();
  const { data: myRedemptions, isLoading: redLoading } = useRedemptions("my");
  const { data: balance } = useBalance(user?.id);
  const { toast } = useToast();

  const isAdmin = user?.role === ROLES.ADMIN;
  const isRop = user?.role === ROLES.ROP;

  const totalEarned = transactions?.filter((t: any) => t.type === 'EARN' && t.status === 'APPROVED').reduce((sum: number, t: any) => sum + t.amount, 0) || 0;
  const totalSpent = transactions?.filter((t: any) => t.type === 'SPEND' && t.status === 'APPROVED').reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0) || 0;
  const pendingCount = transactions?.filter((t: any) => t.status === 'PENDING').length || 0;

  const recentTransactions = transactions?.slice(0, 5) || [];
  const recentRedemptions = myRedemptions?.slice(0, 5) || [];

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      <div className="flex flex-col md:flex-row gap-4 md:items-end justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground" data-testid="text-welcome">
            Привет, {user?.name}!
          </h2>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? "Панель управления системой" : isRop ? "Управление командой и наградами" : "Ваш обзор активности и баланса"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/shop">
            <Button variant="outline" data-testid="link-shop-quick">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Магазин
            </Button>
          </Link>
          <Link href="/lessons">
            <Button variant="outline" data-testid="link-lessons-quick">
              <BookOpen className="w-4 h-4 mr-2" />
              Уроки
            </Button>
          </Link>
          {(isAdmin || isRop) && (
            <Link href="/team">
              <Button variant="outline" data-testid="link-team-quick">
                <Users className="w-4 h-4 mr-2" />
                Команда
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary to-blue-600 text-white border-none shadow-xl shadow-primary/20">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100 uppercase tracking-wider">Баланс</CardTitle>
            <Coins className="w-5 h-5 text-white/60" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold" data-testid="text-balance">{balance ?? 0}</div>
            <p className="text-xs text-blue-200 mt-1">монет доступно</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Заработано</CardTitle>
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-foreground" data-testid="text-earned">{totalEarned}</div>
            <p className="text-xs text-muted-foreground mt-1">всего монет</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Потрачено</CardTitle>
            <ShoppingBag className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-foreground" data-testid="text-spent">{totalSpent}</div>
            <p className="text-xs text-muted-foreground mt-1">монет в магазине</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Покупки</CardTitle>
            <PackageCheck className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-foreground" data-testid="text-purchases">{myRedemptions?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">всего заявок</p>
          </CardContent>
        </Card>
      </div>

      {pendingCount > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-2 rounded-full bg-yellow-500/10">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">У вас {pendingCount} операций на рассмотрении</p>
              <p className="text-xs text-muted-foreground">Ожидают подтверждения администратором</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isAdmin && <AdminSection />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="font-display flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Последние операции
            </CardTitle>
            {(transactions?.length || 0) > 5 && (
              <Link href={isAdmin ? "/admin" : "/requests"}>
                <Button variant="ghost" size="sm">
                  Все
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent className="flex-1">
            {txLoading ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">Нет операций</div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-transparent" data-testid={`row-transaction-${t.id}`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${t.type === 'EARN' ? 'bg-green-500/10 text-green-600' : t.type === 'ADJUST' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-red-500/10 text-red-600'}`}>
                        {t.type === 'EARN' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{t.reason}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(t.createdAt!), "d MMM, HH:mm", { locale: ru })}
                          </p>
                          {t.status === 'PENDING' && <Badge variant="outline" className="text-[10px]">Ожидает</Badge>}
                          {t.status === 'REJECTED' && <Badge variant="destructive" className="text-[10px]">Отклонено</Badge>}
                        </div>
                      </div>
                    </div>
                    <span className={`font-bold font-mono text-sm ${t.status === 'PENDING' ? 'text-muted-foreground' : t.type === 'EARN' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'EARN' ? '+' : ''}{t.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="font-display flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              Мои покупки
            </CardTitle>
            <Link href="/shop">
              <Button variant="ghost" size="sm">
                В магазин
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="flex-1">
            {redLoading ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : recentRedemptions.length === 0 ? (
              <div className="text-center py-10">
                <ShoppingBag className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Вы пока ничего не купили</p>
                <Link href="/shop">
                  <Button variant="outline" className="mt-4" size="sm">Перейти в магазин</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentRedemptions.map((r: any) => (
                  <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg border border-border" data-testid={`row-redemption-${r.id}`}>
                    <Avatar className="h-10 w-10 rounded-lg border border-border">
                      <AvatarImage src={r.item?.imageUrl || ""} />
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs">
                        {r.item?.title?.substring(0, 1) || "P"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{r.item?.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant={
                          r.status === 'APPROVED' ? 'default' :
                          r.status === 'REJECTED' ? 'destructive' :
                          r.status === 'ISSUED' ? 'secondary' : 'outline'
                        } className="text-[10px]">
                          {r.status === 'PENDING' && 'Ожидает'}
                          {r.status === 'APPROVED' && 'Подтверждено'}
                          {r.status === 'REJECTED' && 'Отклонено'}
                          {r.status === 'ISSUED' && 'Выдано'}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          {r.priceCoinsSnapshot} <Coins className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdminSection() {
  const { data: pendingTx, isLoading: ptxLoading } = usePendingTransactions();
  const { data: allRedemptions, isLoading: arLoading } = useRedemptions("all");
  const { data: users } = useUsers();
  const { data: teams } = useTeams();
  const { data: shopItems } = useShopItems();
  const { data: lessons } = useLessons();
  const { mutate: updateTxStatus, isPending: txUpdating } = useUpdateTransactionStatus();
  const { mutate: updateRedStatus, isPending: redUpdating } = useUpdateRedemptionStatus();
  const { toast } = useToast();

  const pendingRedemptions = allRedemptions?.filter((r: any) => r.status === 'PENDING') || [];
  const approvedRedemptions = allRedemptions?.filter((r: any) => r.status === 'APPROVED') || [];

  const handleTxAction = (id: number, status: "APPROVED" | "REJECTED") => {
    updateTxStatus({ id, status }, {
      onSuccess: () => toast({ title: status === "APPROVED" ? "Операция подтверждена" : "Операция отклонена" }),
      onError: (err) => toast({ title: "Ошибка", description: err.message, variant: "destructive" }),
    });
  };

  const handleRedAction = (id: number, status: "APPROVED" | "REJECTED" | "ISSUED") => {
    updateRedStatus({ id, status }, {
      onSuccess: () => toast({ title: status === "APPROVED" ? "Заявка подтверждена" : status === "ISSUED" ? "Товар выдан" : "Заявка отклонена" }),
      onError: (err) => toast({ title: "Ошибка", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-users-count">{users?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Пользователей</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-teams-count">{teams?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Команд</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 rounded-lg bg-green-500/10">
              <ShoppingBag className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-shop-count">{shopItems?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Товаров</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <BookOpen className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-lessons-count">{lessons?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Уроков</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {((pendingTx?.length || 0) > 0 || pendingRedemptions.length > 0 || approvedRedemptions.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(pendingTx?.length || 0) > 0 && (
            <Card className="border-yellow-500/30">
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="font-display flex items-center gap-2 text-base">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  Операции на подтверждение
                  <Badge variant="outline">{pendingTx?.length}</Badge>
                </CardTitle>
                <Link href="/team">
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {ptxLoading ? (
                  <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                ) : (
                  <div className="space-y-3">
                    {pendingTx?.slice(0, 5).map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30" data-testid={`pending-tx-${t.id}`}>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{t.user?.name || "---"}</p>
                          <p className="text-xs text-muted-foreground truncate">{t.reason}</p>
                          <p className="text-xs text-muted-foreground">{t.type === 'EARN' ? '+' : ''}{t.amount} монет</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="text-green-600" onClick={() => handleTxAction(t.id, "APPROVED")} disabled={txUpdating} data-testid={`button-approve-tx-${t.id}`}>
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-red-600" onClick={() => handleTxAction(t.id, "REJECTED")} disabled={txUpdating} data-testid={`button-reject-tx-${t.id}`}>
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {(pendingRedemptions.length > 0 || approvedRedemptions.length > 0) && (
            <Card className="border-yellow-500/30">
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="font-display flex items-center gap-2 text-base">
                  <PackageCheck className="w-5 h-5 text-yellow-600" />
                  Заявки на награды
                  <Badge variant="outline">{pendingRedemptions.length + approvedRedemptions.length}</Badge>
                </CardTitle>
                <Link href="/admin">
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {arLoading ? (
                  <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                ) : (
                  <div className="space-y-3">
                    {[...pendingRedemptions, ...approvedRedemptions].slice(0, 5).map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30" data-testid={`pending-red-${r.id}`}>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{r.user?.name || "---"}</p>
                          <p className="text-xs text-muted-foreground truncate">{r.item?.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={r.status === 'APPROVED' ? 'default' : 'outline'} className="text-[10px]">
                              {r.status === 'PENDING' ? 'Ожидает' : 'Подтверждено'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{r.priceCoinsSnapshot} монет</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {r.status === 'PENDING' && (
                            <>
                              <Button size="icon" variant="ghost" className="text-green-600" onClick={() => handleRedAction(r.id, "APPROVED")} disabled={redUpdating} data-testid={`button-approve-red-${r.id}`}>
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="text-red-600" onClick={() => handleRedAction(r.id, "REJECTED")} disabled={redUpdating} data-testid={`button-reject-red-${r.id}`}>
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {r.status === 'APPROVED' && (
                            <Button size="sm" variant="outline" onClick={() => handleRedAction(r.id, "ISSUED")} disabled={redUpdating} data-testid={`button-issue-red-${r.id}`}>
                              Выдать
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
