import { ShopItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface ItemCardProps {
  item: ShopItem;
  canAfford: boolean;
  onRedeem: (item: ShopItem) => void;
  isRedeeming?: boolean;
}

export function ItemCard({ item, canAfford, onRedeem, isRedeeming }: ItemCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="h-full overflow-hidden border-border/50 shadow-md hover:shadow-xl transition-shadow bg-card flex flex-col">
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          <img
            src={item.imageUrl || "https://images.unsplash.com/photo-1553484771-371af705e8a4?w=800&q=80"}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          />
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur text-foreground font-bold shadow-sm px-3 py-1 flex gap-1 items-center">
              {item.priceCoins} <Coins className="w-3 h-3 text-accent fill-accent" />
            </Badge>
          </div>
          {item.stock !== null && item.stock <= 5 && (
            <div className="absolute bottom-3 left-3">
              <Badge variant="destructive" className="font-medium text-xs">
                Осталось: {item.stock}
              </Badge>
            </div>
          )}
        </div>

        <CardHeader className="pb-2">
          <h3 className="font-display font-bold text-lg leading-tight line-clamp-1">{item.title}</h3>
        </CardHeader>

        <CardContent className="flex-1 pb-4">
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {item.description}
          </p>
        </CardContent>

        <CardFooter className="pt-0">
          <Button
            className={`w-full font-semibold shadow-lg ${
              canAfford
                ? "bg-primary hover:bg-primary/90 shadow-primary/25"
                : "opacity-80"
            }`}
            disabled={!canAfford || (item.stock !== null && item.stock <= 0) || isRedeeming}
            onClick={() => onRedeem(item)}
            data-testid={`button-redeem-${item.id}`}
          >
            {isRedeeming ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {item.stock !== null && item.stock <= 0 ? "Нет в наличии" : canAfford ? "Получить" : "Недостаточно монет"}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
