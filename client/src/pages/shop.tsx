import { useAuth } from "@/hooks/use-auth";
import { useShopItems } from "@/hooks/use-shop";
import { useCreateRedemption } from "@/hooks/use-redemptions";
import { useBalance } from "@/hooks/use-transactions";
import { ItemCard } from "@/components/item-card";
import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function ShopPage() {
  const { user } = useAuth();
  const { data: items, isLoading } = useShopItems();
  const { data: balance } = useBalance(user?.id);
  const { mutate: redeem, isPending: isRedeeming } = useCreateRedemption();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const handleRedeem = (item: any) => {
    redeem({ shopItemId: item.id }, {
      onSuccess: () => {
        toast({ title: "Заявка создана", description: `Товар "${item.title}" списан с баланса` });
      },
      onError: (err) => {
        toast({ title: "Ошибка", description: err.message, variant: "destructive" });
      }
    });
  };

  const filteredItems = items?.filter((item: any) =>
    item.isActive &&
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold" data-testid="text-shop-title">Магазин наград</h2>
          <p className="text-muted-foreground mt-1">Обменяйте свои монеты на крутые призы</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск товаров..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-background border-border/50 focus:border-primary"
            data-testid="input-shop-search"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems?.map((item: any) => (
          <ItemCard
            key={item.id}
            item={item}
            canAfford={(balance || 0) >= item.priceCoins}
            onRedeem={handleRedeem}
            isRedeeming={isRedeeming}
          />
        ))}
      </div>

      {filteredItems?.length === 0 && (
        <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border">
          <p className="text-muted-foreground">Товары не найдены</p>
        </div>
      )}
    </div>
  );
}
