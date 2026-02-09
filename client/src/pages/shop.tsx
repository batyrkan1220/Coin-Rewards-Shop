import { useAuth } from "@/hooks/use-auth";
import { useShopItems } from "@/hooks/use-shop";
import { useCreateRedemption } from "@/hooks/use-redemptions";
import { useBalance } from "@/hooks/use-transactions";
import { ItemCard } from "@/components/item-card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { ShopItem } from "@shared/schema";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ShopPage() {
  const { user } = useAuth();
  const { data: items, isLoading } = useShopItems();
  const { data: balance } = useBalance(user?.id);
  const { mutate: redeem, isPending: isRedeeming } = useCreateRedemption();

  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [comment, setComment] = useState("");
  const [search, setSearch] = useState("");

  const handleRedeem = () => {
    if (!selectedItem) return;
    redeem({ shopItemId: selectedItem.id, comment }, {
      onSuccess: () => {
        setSelectedItem(null);
        setComment("");
      }
    });
  };

  const filteredItems = items?.filter(item => 
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
          <h2 className="text-3xl font-display font-bold">Магазин наград 🎁</h2>
          <p className="text-muted-foreground mt-1">Обменяйте свои монеты на крутые призы</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Поиск товаров..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-9 bg-background border-border/50 focus:border-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems?.map((item) => (
          <ItemCard 
            key={item.id} 
            item={item} 
            canAfford={(balance || 0) >= item.priceCoins} 
            onRedeem={setSelectedItem}
          />
        ))}
      </div>

      {filteredItems?.length === 0 && (
        <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border">
          <p className="text-muted-foreground">Товары не найдены</p>
        </div>
      )}

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Подтверждение покупки</DialogTitle>
            <DialogDescription>
              Вы собираетесь приобрести "{selectedItem?.title}" за <span className="font-bold text-primary">{selectedItem?.priceCoins} монет</span>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Комментарий к заказу (необязательно)</label>
              <Textarea 
                placeholder="Размер, цвет, или пожелания..." 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="resize-none focus:ring-primary/20"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSelectedItem(null)}>Отмена</Button>
            <Button onClick={handleRedeem} disabled={isRedeeming} className="bg-primary shadow-lg shadow-primary/20">
              {isRedeeming ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Подтвердить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
