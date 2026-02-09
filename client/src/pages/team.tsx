import { useUsers } from "@/hooks/use-team";
import { useCreateTransaction, useZeroOut, useBalance } from "@/hooks/use-transactions";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { User, ROLES } from "@shared/schema";
import { Coins, AlertTriangle, Loader2, RotateCcw, ArrowUpRight, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { buildUrl } from "@shared/routes";
import { api } from "@shared/routes";
import { useTeams } from "@/hooks/use-team";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TeamPage() {
  const { user: currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const { data: users, isLoading } = useUsers();
  const { data: teams } = useTeams();
  const { mutate: createTransaction, isPending } = useCreateTransaction();
  const { mutate: zeroOut, isPending: isZeroing } = useZeroOut();
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser && currentUser.role !== ROLES.ADMIN && currentUser.role !== ROLES.ROP) {
      setLocation("/");
    }
  }, [currentUser, setLocation]);

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionType, setActionType] = useState<"EARN" | "ADJUST">("EARN");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [showZeroConfirm, setShowZeroConfirm] = useState<any>(null);
  const [searchName, setSearchName] = useState("");
  const [filterTeamId, setFilterTeamId] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");

  const filteredUsers = users?.filter((u: any) => {
    if (u.role === ROLES.ADMIN) return false;
    if (currentUser?.role === ROLES.ROP && u.teamId !== currentUser.teamId) return false;

    if (searchName.trim()) {
      const q = searchName.trim().toLowerCase();
      if (!u.name?.toLowerCase().includes(q) && !u.username?.toLowerCase().includes(q)) return false;
    }

    if (filterTeamId !== "all") {
      if (String(u.teamId) !== filterTeamId) return false;
    }

    if (filterRole !== "all") {
      if (u.role !== filterRole) return false;
    }

    return true;
  });

  const handleTransaction = () => {
    if (!selectedUser || !amount || !reason.trim()) return;

    createTransaction({
      userId: selectedUser.id,
      amount: parseInt(amount),
      type: actionType,
      reason: reason.trim()
    }, {
      onSuccess: () => {
        toast({ title: "Операция выполнена" });
        setSelectedUser(null);
        setAmount("");
        setReason("");
      },
      onError: (err) => {
        toast({ title: "Ошибка", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleZeroOut = () => {
    if (!showZeroConfirm) return;
    zeroOut(showZeroConfirm.id, {
      onSuccess: () => {
        toast({ title: "Баланс обнулен" });
        setShowZeroConfirm(null);
      },
      onError: (err) => {
        toast({ title: "Ошибка", description: err.message, variant: "destructive" });
      }
    });
  };

  if (isLoading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold" data-testid="text-team-title">Управление командой</h2>
        <p className="text-muted-foreground mt-1">Начисляйте монеты и управляйте сотрудниками</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="pl-9"
                data-testid="input-search-name"
              />
            </div>
            {currentUser?.role === ROLES.ADMIN && teams && teams.length > 0 && (
              <Select value={filterTeamId} onValueChange={setFilterTeamId}>
                <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-filter-team">
                  <SelectValue placeholder="Все команды" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все команды</SelectItem>
                  {teams.map((t: any) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-filter-role">
                <SelectValue placeholder="Все роли" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все роли</SelectItem>
                <SelectItem value="MANAGER">Менеджер</SelectItem>
                <SelectItem value="ROP">РОП</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {filteredUsers && (
            <p className="text-sm text-muted-foreground mt-3" data-testid="text-filter-count">
              Найдено: {filteredUsers.length}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers?.map((user: any) => (
          <UserCard
            key={user.id}
            user={user}
            onEarn={() => { setSelectedUser(user); setActionType("EARN"); }}
            onAdjust={() => { setSelectedUser(user); setActionType("ADJUST"); }}
            onZeroOut={() => setShowZeroConfirm(user)}
          />
        ))}
      </div>

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "EARN" ? "Начисление монет" : "Коррекция баланса"}
            </DialogTitle>
            <DialogDescription>
              Пользователь: <span className="font-bold text-foreground">{selectedUser?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Сумма <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                placeholder={actionType === "EARN" ? "100" : "-50"}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                data-testid="input-tx-amount"
              />
              {actionType === "ADJUST" && (
                <p className="text-xs text-muted-foreground">Используйте отрицательное значение для списания</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Номер заказа <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Введите номер заказа..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                data-testid="input-tx-order-number"
              />
              {!reason.trim() && reason !== "" && (
                <p className="text-xs text-destructive">Номер заказа обязателен</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>Отмена</Button>
            <Button onClick={handleTransaction} disabled={isPending || !amount || !reason.trim()} data-testid="button-submit-tx">
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {actionType === "EARN" ? "Начислить" : "Применить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showZeroConfirm} onOpenChange={(open) => !open && setShowZeroConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Обнуление баланса</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите обнулить баланс пользователя <span className="font-bold text-foreground">{showZeroConfirm?.name}</span>?
              Это создаст корректировочную транзакцию. История сохранится.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowZeroConfirm(null)}>Отмена</Button>
            <Button variant="destructive" onClick={handleZeroOut} disabled={isZeroing} data-testid="button-confirm-zero">
              {isZeroing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Обнулить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserCard({ user, onEarn, onAdjust, onZeroOut }: { user: any; onEarn: () => void; onAdjust: () => void; onZeroOut: () => void }) {
  const { data: balance } = useBalance(user.id);

  return (
    <Card data-testid={`card-user-${user.id}`}>
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Avatar className="h-12 w-12 border border-border">
          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
          <AvatarFallback>{user.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base truncate">{user.name}</CardTitle>
          <p className="text-sm text-muted-foreground truncate">
            {user.role === "MANAGER" ? "Менеджер" : user.role === "ROP" ? "РОП" : user.role}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Баланс</p>
          <p className="text-lg font-bold">{balance ?? 0}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mt-2 flex-wrap">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onEarn}
            data-testid={`button-earn-${user.id}`}
          >
            <ArrowUpRight className="w-4 h-4 mr-1" />
            Начислить
          </Button>
          <Button
            variant="outline"
            onClick={onAdjust}
            data-testid={`button-adjust-${user.id}`}
          >
            <AlertTriangle className="w-4 h-4" />
          </Button>
          <Button
            variant="destructive"
            onClick={onZeroOut}
            data-testid={`button-zero-${user.id}`}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
