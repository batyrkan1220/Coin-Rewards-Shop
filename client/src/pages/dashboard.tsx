import { useAuth } from "@/hooks/use-auth";
import { useTransactions, useBalance } from "@/hooks/use-transactions";
import { useRedemptions } from "@/hooks/use-redemptions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUpRight, ArrowDownLeft, Clock, ShoppingBag } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: transactions } = useTransactions();
  const { data: myRedemptions } = useRedemptions("my");
  const { data: balance } = useBalance(user?.id);

  // Calculate stats
  const totalEarned = transactions?.filter(t => t.type === 'EARN').reduce((sum, t) => sum + t.amount, 0) || 0;
  const totalSpent = transactions?.filter(t => t.type === 'SPEND').reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">
            Привет, {user?.name}! 👋
          </h2>
          <p className="text-muted-foreground mt-2">
            Вот обзор вашей активности и баланса.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-primary to-blue-600 text-white border-none shadow-xl shadow-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-100 uppercase tracking-wider">Текущий баланс</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-display font-bold">{balance} 🪙</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Всего заработано</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-success">
              <ArrowUpRight className="w-5 h-5" />
              <div className="text-3xl font-display font-bold text-foreground">{totalEarned}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Потрачено</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-destructive">
              <ArrowDownLeft className="w-5 h-5" />
              <div className="text-3xl font-display font-bold text-foreground">{totalSpent}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Transactions */}
        <Card className="h-[400px] flex flex-col">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              История операций
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full px-6 pb-6">
              {transactions?.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">Нет операций</div>
              ) : (
                <div className="space-y-4">
                  {transactions?.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${t.type === 'EARN' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                          {t.type === 'EARN' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{t.reason}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(t.createdAt!), "d MMM yyyy, HH:mm", { locale: ru })}
                          </p>
                        </div>
                      </div>
                      <span className={`font-bold font-mono ${t.type === 'EARN' ? 'text-success' : 'text-destructive'}`}>
                        {t.type === 'EARN' ? '+' : ''}{t.amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Redemptions */}
        <Card className="h-[400px] flex flex-col">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              Мои покупки
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full px-6 pb-6">
              {myRedemptions?.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">Вы пока ничего не купили</div>
              ) : (
                <div className="space-y-4">
                  {myRedemptions?.map((r) => (
                    <div key={r.id} className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card hover:shadow-sm transition-all">
                      <Avatar className="h-10 w-10 rounded-lg">
                        <AvatarImage src={r.item.imageUrl || ""} />
                        <AvatarFallback className="rounded-lg">🎁</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{r.item.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={
                            r.status === 'APPROVED' ? 'default' : 
                            r.status === 'REJECTED' ? 'destructive' : 
                            r.status === 'ISSUED' ? 'secondary' : 'outline'
                          } className="text-[10px] h-5 px-2">
                            {r.status === 'PENDING' && 'Ожидает'}
                            {r.status === 'APPROVED' && 'Подтверждено'}
                            {r.status === 'REJECTED' && 'Отклонено'}
                            {r.status === 'ISSUED' && 'Выдано'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {r.priceCoinsSnapshot} 🪙
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
