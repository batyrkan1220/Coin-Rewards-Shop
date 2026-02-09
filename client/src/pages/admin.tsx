import { useAuth } from "@/hooks/use-auth";
import { ROLES } from "@shared/schema";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateShopItem, useShopItems } from "@/hooks/use-shop";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const itemSchema = z.object({
  title: z.string().min(1, "Обязательно"),
  description: z.string().min(1, "Обязательно"),
  priceCoins: z.coerce.number().min(1, "Минимум 1"),
  stock: z.coerce.number().min(0).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export default function AdminPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { mutate: createItem, isPending } = useCreateShopItem();

  useEffect(() => {
    if (user && user.role !== ROLES.ADMIN) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      title: "",
      description: "",
      priceCoins: 100,
      stock: 10,
      imageUrl: "",
    },
  });

  const onSubmit = (values: z.infer<typeof itemSchema>) => {
    createItem(values, {
      onSuccess: () => {
        toast({ title: "Товар создан" });
        form.reset();
      }
    });
  };

  if (!user || user.role !== ROLES.ADMIN) return null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-display font-bold">Администрирование ⚙️</h2>
        <p className="text-muted-foreground mt-1">Управление контентом платформы</p>
      </div>

      <Tabs defaultValue="items" className="w-full">
        <TabsList>
          <TabsTrigger value="items">Товары</TabsTrigger>
          {/* Add Users/Lessons tabs later */}
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Добавить товар</CardTitle>
              <CardDescription>Создайте новый лот для магазина наград</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Название</FormLabel>
                        <FormControl>
                          <Input placeholder="Футболка с логотипом" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Описание</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Размеры S-XL, 100% хлопок..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="priceCoins"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Цена (монеты)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Количество (склад)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ссылка на изображение (опционально)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Создать товар
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
