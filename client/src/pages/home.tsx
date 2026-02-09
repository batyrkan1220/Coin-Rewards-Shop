import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Coins,
  ShoppingBag,
  BookOpen,
  Users,
  TrendingUp,
  Shield,
  ArrowRight,
  CheckCircle,
  LogIn,
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Coins className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">Rewards</span>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/dashboard">
                <Button data-testid="button-go-dashboard">
                  Панель управления
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <Link href="/auth">
                <Button data-testid="button-login">
                  <LogIn className="w-4 h-4 mr-2" />
                  Вход
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8" data-testid="text-hero-badge">
              <Coins className="w-4 h-4" />
              Корпоративная платформа мотивации
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight" data-testid="text-hero-title">
              Награждайте сотрудников за достижения
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Единая система управления корпоративными монетами, магазином наград и обучением. Мотивируйте команду, отслеживайте результаты и развивайте потенциал.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Link href="/dashboard">
                  <Button size="lg" className="text-base px-8" data-testid="button-hero-dashboard">
                    Перейти к панели
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              ) : (
                <Link href="/auth">
                  <Button size="lg" className="text-base px-8" data-testid="button-hero-login">
                    <LogIn className="w-5 h-5 mr-2" />
                    Войти в систему
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 border-t border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground" data-testid="text-features-title">
              Возможности платформы
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
              Все инструменты для управления мотивацией в одном месте
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="group">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Coins className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-display font-bold text-foreground mb-2">Система монет</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Начисляйте монеты за достижения, контролируйте баланс и отслеживайте все операции с полной историей транзакций.
                </p>
              </CardContent>
            </Card>

            <Card className="group">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-display font-bold text-foreground mb-2">Магазин наград</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Каталог корпоративных наград и подарков. Сотрудники обменивают заработанные монеты на ценные призы.
                </p>
              </CardContent>
            </Card>

            <Card className="group">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-display font-bold text-foreground mb-2">Обучение</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Библиотека уроков с видео, статьями и полезными ссылками. Развивайте навыки команды прямо на платформе.
                </p>
              </CardContent>
            </Card>

            <Card className="group">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-display font-bold text-foreground mb-2">Управление командой</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Распределяйте сотрудников по командам. Руководители управляют начислениями и контролируют баланс.
                </p>
              </CardContent>
            </Card>

            <Card className="group">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-display font-bold text-foreground mb-2">Аналитика</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Полная статистика по операциям, заявкам и активности. Принимайте решения на основе данных.
                </p>
              </CardContent>
            </Card>

            <Card className="group">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-display font-bold text-foreground mb-2">Безопасность</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Ролевой доступ, журнал аудита и многоуровневая система подтверждений для полного контроля.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 border-t border-border/50 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground" data-testid="text-roles-title">
              Три роли -- полный контроль
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
              Каждый участник видит только то, что ему нужно
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-7 h-7 text-red-600" />
                </div>
                <h3 className="text-lg font-display font-bold text-foreground mb-2">Администратор</h3>
                <ul className="text-sm text-muted-foreground space-y-2 text-left mt-4">
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /> Полное управление системой</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /> Подтверждение операций</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /> Управление магазином и уроками</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /> Просмотр журнала аудита</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-lg font-display font-bold text-foreground mb-2">РОП (Руководитель)</h3>
                <ul className="text-sm text-muted-foreground space-y-2 text-left mt-4">
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /> Начисление монет команде</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /> Управление балансом сотрудников</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /> Подтверждение заявок команды</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /> Доступ к магазину и обучению</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-lg font-display font-bold text-foreground mb-2">Менеджер</h3>
                <ul className="text-sm text-muted-foreground space-y-2 text-left mt-4">
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /> Получение монет за достижения</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /> Покупки в магазине наград</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /> Прохождение обучения</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /> Отслеживание своих заявок</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 border-t border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
            Готовы начать?
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto mb-8">
            Войдите в систему и начните мотивировать вашу команду уже сегодня.
          </p>
          {user ? (
            <Link href="/dashboard">
              <Button size="lg" className="text-base px-8" data-testid="button-cta-dashboard">
                Перейти к панели
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          ) : (
            <Link href="/auth">
              <Button size="lg" className="text-base px-8" data-testid="button-cta-login">
                <LogIn className="w-5 h-5 mr-2" />
                Войти в систему
              </Button>
            </Link>
          )}
        </div>
      </section>

      <footer className="border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Coins className="w-4 h-4" />
            <span>Rewards Platform</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Корпоративная система мотивации и обучения
          </p>
        </div>
      </footer>
    </div>
  );
}
