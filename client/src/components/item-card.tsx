import { ShopItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Loader2, ImageOff } from "lucide-react";
import { useState } from "react";

interface ItemCardProps {
  item: ShopItem;
  canAfford: boolean;
  onRedeem: (item: ShopItem) => void;
  isRedeeming?: boolean;
}

export function ItemCard({ item, canAfford, onRedeem, isRedeeming }: ItemCardProps) {
  const [imgError, setImgError] = useState(false);
  const hasImage = item.imageUrl && item.imageUrl.trim() !== "" && !imgError;

  return (
    <Card className="h-full overflow-hidden border-border/50 shadow-md hover:shadow-xl transition-shadow bg-card flex flex-col" data-testid={`card-product-${item.id}`}>
      <div className="relative aspect-square bg-muted overflow-hidden">
        {hasImage ? (
          <img
            src={item.imageUrl!}
            alt={item.title}
            className="w-full h-full object-cover"
            data-testid={`img-product-${item.id}`}
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <ImageOff className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
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
        <h3 className="font-display font-bold text-lg leading-tight line-clamp-1" data-testid={`text-item-title-${item.id}`}>{item.title}</h3>
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
              ? "bg-primary shadow-primary/25"
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
  );
}
