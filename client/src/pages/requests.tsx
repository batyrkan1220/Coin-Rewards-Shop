import { useRedemptions, useUpdateRedemptionStatus } from "@/hooks/use-redemptions";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Check, X, PackageCheck, Loader2, Coins } from "lucide-react";
import { ROLES } from "@shared/schema";
import { useState } from "react";

export default function RequestsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("my"); // my | team | all
  const { data: redemptions, isLoading } = useRedemptions(tab as any);
  const { mutate: updateStatus, isPending } = useUpdateRedemptionStatus();

  const canApprove = user?.role === ROLES.ROP || user?.role === ROLES.ADMIN;

  const handleStatus = (id: number, status: "APPROVED" | "REJECTED" | "ISSUED") => {
    updateStatus({ id, status });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-display font-bold">Заявки на награды</h2>
        <p className="text-muted-foreground mt-1">Отслеживайте статус своих заявок</p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="my">Мои заявки</TabsTrigger>
          {canApprove && <TabsTrigger value="team">Заявки команды</TabsTrigger>}
        </TabsList>

        <TabsContent value={tab} className="mt-0 space-y-4">
          {isLoading ? (
             <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
          ) : redemptions?.length === 0 ? (
            <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border">
              <p className="text-muted-foreground">Заявок нет</p>
            </div>
          ) : (
            redemptions?.map((r) => (
              <Card key={r.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row md:items-center p-4 gap-4">
                    {/* Item Info */}
                    <div className="flex items-center gap-4 min-w-[200px]">
                      <Avatar className="h-16 w-16 rounded-lg border border-border/50">
                        <AvatarImage src={r.item.imageUrl || ""} className="object-cover" />
                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs">P</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-bold">{r.item.title}</h4>
                        <p className="text-sm text-muted-foreground flex gap-2">
                           <span className="text-accent-foreground font-medium flex items-center gap-1">{r.priceCoinsSnapshot} <Coins className="w-3 h-3" /></span>
                        </p>
                      </div>
                    </div>

                    {/* User Info (if viewing team requests) */}
                    {tab !== "my" && (
                      <div className="flex items-center gap-3 border-l pl-4 border-border/50">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{r.user.username.substring(0,2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="text-sm">
                          <p className="font-medium">{r.user.name}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(r.createdAt!), "d MMM yyyy", { locale: ru })}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex-1">
                      {r.comment && (
                        <p className="text-sm bg-muted/30 p-2 rounded text-muted-foreground italic">
                          "{r.comment}"
                        </p>
                      )}
                    </div>

                    {/* Actions / Status */}
                    <div className="flex flex-col items-end gap-2 min-w-[140px]">
                       <Badge variant={
                          r.status === 'APPROVED' ? 'default' : 
                          r.status === 'REJECTED' ? 'destructive' : 
                          r.status === 'ISSUED' ? 'secondary' : 'outline'
                        } className="mb-2">
                          {r.status === 'PENDING' && 'Ожидает'}
                          {r.status === 'APPROVED' && 'Подтверждено'}
                          {r.status === 'REJECTED' && 'Отклонено'}
                          {r.status === 'ISSUED' && 'Выдано'}
                        </Badge>

                        {/* Approval Actions */}
                        {canApprove && tab !== "my" && r.status === "PENDING" && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10 border-destructive/20" onClick={() => handleStatus(r.id, "REJECTED")}>
                              <X className="w-4 h-4" />
                            </Button>
                            <Button size="sm" className="bg-success hover:bg-success/90 text-white" onClick={() => handleStatus(r.id, "APPROVED")}>
                              <Check className="w-4 h-4 mr-1" />
                              Одобрить
                            </Button>
                          </div>
                        )}

                        {/* Issue Action (Admin/ROP usually) */}
                        {canApprove && tab !== "my" && r.status === "APPROVED" && (
                          <Button size="sm" variant="secondary" onClick={() => handleStatus(r.id, "ISSUED")}>
                            <PackageCheck className="w-4 h-4 mr-1" />
                            Выдать
                          </Button>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
