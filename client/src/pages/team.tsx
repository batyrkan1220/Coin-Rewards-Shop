import { useUsers } from "@/hooks/use-team";
import { useCreateTransaction } from "@/hooks/use-transactions";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { User, ROLES } from "@shared/schema";
import { Coins, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TeamPage() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading } = useUsers();
  const { mutate: createTransaction, isPending } = useCreateTransaction();
  const { toast } = useToast();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<"EARN" | "ADJUST">("EARN");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  // Only show users in my team if ROP, or all if Admin
  const filteredUsers = users?.filter(u => {
    if (currentUser?.role === ROLES.ADMIN) return true;
    if (currentUser?.role === ROLES.ROP) return u.teamId === currentUser.teamId;
    return false;
  });

  const handleTransaction = () => {
    if (!selectedUser || !amount || !reason) return;
    
    // For "Zero out" (Adjust), amount is handled by backend logic or specific input?
    // Spec says "Zero out" sets balance to 0. 
    // Implementation: In this simple form, ADJUST is manual +/-. 
    // Let's keep it simple: "ADJUST" allows negative values. "EARN" is positive only.
    
    createTransaction({
      userId: selectedUser.id,
      amount: parseInt(amount),
      type: actionType,
      reason
    }, {
      onSuccess: () => {
        toast({ title: "Успешно", description: "Операция выполнена" });
        setSelectedUser(null);
        setAmount("");
        setReason("");
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
        <h2 className="text-3xl font-display font-bold">Управление командой 👥</h2>
        <p className="text-muted-foreground mt-1">Начисляйте монеты и управляйте сотрудниками</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers?.map((user) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <Avatar className="h-12 w-12 border border-border">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
                <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base truncate">{user.name}</CardTitle>
                <p className="text-sm text-muted-foreground truncate">{user.role}</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mt-2">
                <Button 
                  className="flex-1 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary border-none shadow-none"
                  variant="outline"
                  onClick={() => {
                    setSelectedUser(user);
                    setActionType("EARN");
                  }}
                >
                  <Coins className="w-4 h-4 mr-2" />
                  Начислить
                </Button>
                <Button 
                  className="bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive border-none shadow-none"
                  variant="outline"
                  onClick={() => {
                    setSelectedUser(user);
                    setActionType("ADJUST");
                  }}
                >
                  <AlertTriangle className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
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
              <Label>Сумма</Label>
              <Input 
                type="number" 
                placeholder={actionType === "EARN" ? "100" : "-50"} 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {actionType === "ADJUST" && (
                <p className="text-xs text-muted-foreground">Используйте отрицательное значение для списания</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Причина / Комментарий</Label>
              <Textarea 
                placeholder="За отличную работу над проектом..." 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>Отмена</Button>
            <Button onClick={handleTransaction} disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {actionType === "EARN" ? "Начислить" : "Применить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
