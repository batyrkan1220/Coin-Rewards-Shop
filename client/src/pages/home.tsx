import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Coins,
  ShoppingBag,
  BookOpen,
  ArrowRight,
  LogIn,
  Users,
  Shield,
  BarChart3,
  Zap,
  Building2,
  Check,
  Star,
  TrendingUp,
  Target,
  Award,
  Clock,
  Lock,
  Globe,
  HeadphonesIcon,
  MessageCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
            <span className="font-display font-bold text-xl tracking-tight" data-testid="text-logo">tabys</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-features">Возможности</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-how">Как это работает</a>
            <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-about">О нас</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/dashboard">
                <Button data-testid="button-go-dashboard">
                  Панель управления
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="ghost" data-testid="button-login">
                    <LogIn className="w-4 h-4 mr-2" />
                    Вход
                  </Button>
                </Link>
                <Link href="/register-company">
                  <Button data-testid="button-register">
                    Попробовать
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8" data-testid="text-hero-badge">
              <Zap className="w-4 h-4" />
              Платформа мотивации для бизнеса
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight" data-testid="text-hero-title">
              Мотивируйте команду. Растите продажи.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed" data-testid="text-hero-description">
              Tabys -- это SaaS-платформа для компаний, где сотрудники зарабатывают монеты за достижения и обменивают их на реальные подарки. Повышайте вовлеченность, управляйте обучением и отслеживайте результаты.
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
                <>
                  <Link href="/register-company">
                    <Button size="lg" className="text-base px-8" data-testid="button-hero-register">
                      Начать бесплатно
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/auth">
                    <Button size="lg" variant="outline" className="text-base px-8" data-testid="button-hero-login">
                      <LogIn className="w-5 h-5 mr-2" />
                      Войти
                    </Button>
                  </Link>
                </>
              )}
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-green-600" />
                3 дня бесплатно
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-green-600" />
                Без привязки карты
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-green-600" />
                Готово за 2 минуты
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 border-t border-border/50 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            <div data-testid="stat-companies">
              <div className="text-3xl sm:text-4xl font-display font-bold text-foreground">50+</div>
              <div className="text-sm text-muted-foreground mt-1">Компаний</div>
            </div>
            <div data-testid="stat-users">
              <div className="text-3xl sm:text-4xl font-display font-bold text-foreground">1 000+</div>
              <div className="text-sm text-muted-foreground mt-1">Пользователей</div>
            </div>
            <div data-testid="stat-rewards">
              <div className="text-3xl sm:text-4xl font-display font-bold text-foreground">5 000+</div>
              <div className="text-sm text-muted-foreground mt-1">Наград выдано</div>
            </div>
            <div data-testid="stat-satisfaction">
              <div className="text-3xl sm:text-4xl font-display font-bold text-foreground">98%</div>
              <div className="text-sm text-muted-foreground mt-1">Довольных клиентов</div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-16 sm:py-24 border-t border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4" data-testid="badge-features">Возможности</Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground" data-testid="text-features-title">
              Все для мотивации вашей команды
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
              Полный набор инструментов для управления системой поощрений, обучения и аналитики в одной платформе
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
                  Начисляйте монеты за выполнение KPI, продажи, инициативу и другие достижения. Полная история и прозрачный баланс.
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
                  Каталог наград с фотографиями: от билетов в кино до сертификатов и подарков. Сотрудники сами выбирают награду.
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
                  Встроенная библиотека уроков: видео, статьи, полезные ссылки. Создавайте курсы для обучения команды прямо на платформе.
                </p>
              </CardContent>
            </Card>

            <Card className="group">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-display font-bold text-foreground mb-2">Управление командами</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Создавайте команды, назначайте руководителей (РОП), контролируйте активность и достижения каждого сотрудника.
                </p>
              </CardContent>
            </Card>

            <Card className="group">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-display font-bold text-foreground mb-2">Роли и доступы</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Четыре роли: Админ, РОП, Менеджер и Супер-админ. Каждый видит только то, что ему положено. Полная изоляция данных.
                </p>
              </CardContent>
            </Card>

            <Card className="group">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-rose-600" />
                </div>
                <h3 className="text-lg font-display font-bold text-foreground mb-2">Аналитика и аудит</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Полный журнал всех действий. Отчеты по транзакциям, выдачам наград, активности команды. Прозрачность на всех уровнях.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-16 sm:py-24 bg-muted/30 border-t border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4" data-testid="badge-how">Как это работает</Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground" data-testid="text-how-title">
              Начните за 3 простых шага
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
              Запуск платформы занимает всего пару минут. Никакой сложной настройки.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center" data-testid="step-1">
              <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-display font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-lg font-display font-bold text-foreground mb-3">Зарегистрируйте компанию</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Создайте аккаунт компании и получите 3 дня бесплатного доступа. 20 товаров-шаблонов уже в магазине.
              </p>
            </div>

            <div className="text-center" data-testid="step-2">
              <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-display font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-lg font-display font-bold text-foreground mb-3">Пригласите сотрудников</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Создайте команды и отправьте пригласительные ссылки. Сотрудники регистрируются сами за минуту с выбором аватара.
              </p>
            </div>

            <div className="text-center" data-testid="step-3">
              <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-display font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-lg font-display font-bold text-foreground mb-3">Начисляйте и награждайте</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Начисляйте монеты за достижения, а сотрудники выбирают награды в магазине. Утверждайте заявки и выдавайте подарки.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 border-t border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Для кого</Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground" data-testid="text-audience-title">
              Идеально подходит для
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <Target className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-display font-bold text-foreground mb-2">Отделы продаж</h3>
                <p className="text-muted-foreground text-sm">Мотивация менеджеров за выполнение планов и KPI</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-display font-bold text-foreground mb-2">Стартапы</h3>
                <p className="text-muted-foreground text-sm">Вовлечение молодой команды через геймификацию</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-display font-bold text-foreground mb-2">Корпорации</h3>
                <p className="text-muted-foreground text-sm">Единая система наград для филиалов и подразделений</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Award className="w-8 h-8 text-orange-600 mx-auto mb-3" />
                <h3 className="font-display font-bold text-foreground mb-2">HR-отделы</h3>
                <p className="text-muted-foreground text-sm">Инструмент для программ лояльности и признания</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="about" className="py-16 sm:py-24 bg-muted/30 border-t border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4" data-testid="badge-about">О платформе</Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground" data-testid="text-about-title">
              Почему Tabys?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <div className="space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                <span className="font-display font-bold text-foreground">Tabys</span> -- это казахстанская платформа корпоративной мотивации, созданная для современных компаний. Мы помогаем бизнесу повышать продуктивность и вовлеченность сотрудников через прозрачную систему поощрений.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Платформа разработана с учетом потребностей отделов продаж, где мотивация команды напрямую влияет на выручку. Менеджеры зарабатывают монеты за реальные результаты и обменивают их на подарки, которые выбирают сами.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Мы верим, что признание достижений -- ключ к построению сильной команды. Tabys делает этот процесс простым, прозрачным и увлекательным для каждого сотрудника.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                <Lock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-display font-bold text-foreground text-sm mb-1">Безопасность данных</h4>
                  <p className="text-muted-foreground text-sm">Полная изоляция данных каждой компании. Шифрование паролей и защита на уровне платформы.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                <Globe className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-display font-bold text-foreground text-sm mb-1">Облачное решение</h4>
                  <p className="text-muted-foreground text-sm">Работает в браузере с любого устройства. Не нужно ничего устанавливать или настраивать.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                <Clock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-display font-bold text-foreground text-sm mb-1">Быстрый запуск</h4>
                  <p className="text-muted-foreground text-sm">Регистрация за 2 минуты. 20 товаров-шаблонов в магазине уже готовы. Просто добавьте команду.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                <HeadphonesIcon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-display font-bold text-foreground text-sm mb-1">Поддержка</h4>
                  <p className="text-muted-foreground text-sm">Мы на связи и всегда готовы помочь с настройкой и вопросами по платформе.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-primary text-primary-foreground border-t border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <Star className="w-10 h-10 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl sm:text-4xl font-display font-bold leading-tight mb-4" data-testid="text-cta-title">
            Готовы мотивировать команду?
          </h2>
          <p className="text-lg opacity-80 max-w-xl mx-auto mb-8">
            Зарегистрируйте компанию и получите 3 дня бесплатного доступа ко всем возможностям Tabys. Без привязки карты.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register-company">
              <Button size="lg" variant="secondary" className="text-base px-8" data-testid="button-cta-register">
                Зарегистрировать компанию
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-10 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-primary" />
                </div>
                <span className="font-display font-bold text-lg">tabys</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Корпоративная платформа мотивации и обучения для современных компаний Казахстана.
              </p>
            </div>
            <div>
              <h4 className="font-display font-bold text-foreground mb-3 text-sm">Платформа</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#features" className="block hover:text-foreground transition-colors">Возможности</a>
                <a href="#how-it-works" className="block hover:text-foreground transition-colors">Как это работает</a>
                <a href="#about" className="block hover:text-foreground transition-colors">О нас</a>
              </div>
            </div>
            <div>
              <h4 className="font-display font-bold text-foreground mb-3 text-sm">Контакты</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a
                  href="https://wa.me/77770145874"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-foreground transition-colors"
                  data-testid="link-footer-whatsapp"
                >
                  <MessageCircle className="w-4 h-4" />
                  +7 777 014 58 74
                </a>
                <p>Казахстан</p>
              </div>
            </div>
          </div>
          <div className="border-t border-border/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              2025 Tabys. Все права защищены.
            </p>
            <p className="text-sm text-muted-foreground">
              Платформа мотивации для бизнеса
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
