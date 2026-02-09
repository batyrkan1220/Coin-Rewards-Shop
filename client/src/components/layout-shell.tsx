import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useBalance } from "@/hooks/use-transactions";
import { 
  Home, 
  ShoppingBag, 
  BookOpen, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  Coins,
  UserCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import { ROLES } from "@shared/schema";
import { getAvatarUrl } from "@/lib/avatars";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const { data: balance } = useBalance(user?.id);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: { icon: any; label: string; href: string }[] = [];

  if (user?.role === ROLES.ADMIN) {
    navItems.push({ icon: Home, label: "Главная", href: "/dashboard" });
    navItems.push({ icon: ShoppingBag, label: "Магазин", href: "/shop" });
    navItems.push({ icon: BookOpen, label: "Уроки", href: "/lessons" });
    navItems.push({ icon: Users, label: "Команда", href: "/team" });
    navItems.push({ icon: Settings, label: "Админ", href: "/admin" });
  } else {
    navItems.push({ icon: Home, label: "Главная", href: "/dashboard" });
    navItems.push({ icon: ShoppingBag, label: "Магазин", href: "/shop" });
    navItems.push({ icon: BookOpen, label: "Уроки", href: "/lessons" });
    navItems.push({ icon: FileText, label: "Мои заявки", href: "/requests" });
    if (user?.role === ROLES.ROP) {
      navItems.push({ icon: Users, label: "Команда", href: "/team" });
    }
  }

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center gap-3 text-primary mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Coins className="w-6 h-6 text-primary" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">Rewards</span>
        </div>
        
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 font-medium" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }
              `} onClick={() => setIsMobileMenuOpen(false)}>
                <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-auto p-6 border-t border-border/50">
        <Link href="/profile" className="flex items-center gap-3 mb-4 p-2 rounded-xl transition-all duration-200 hover:bg-muted cursor-pointer" onClick={() => setIsMobileMenuOpen(false)} data-testid="link-profile">
          <Avatar className="h-10 w-10 border border-border">
            <AvatarImage src={user ? getAvatarUrl(user.username, (user as any).avatarStyle, user.gender) : ""} />
            <AvatarFallback>{user?.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.role === "ADMIN" ? "Админ" : user?.role === "ROP" ? "РОП" : "Менеджер"}</p>
          </div>
        </Link>
        <Button variant="outline" className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20" onClick={() => logout()} data-testid="button-logout">
          <LogOut className="w-4 h-4" />
          Выйти
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 border-r border-border fixed h-full bg-card z-20">
        <NavContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <Coins className="w-6 h-6 text-primary" />
            <span className="font-display font-bold text-lg">Rewards</span>
          </div>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SheetTitle className="sr-only">Меню навигации</SheetTitle>
              <NavContent />
            </SheetContent>
          </Sheet>
        </header>

        {/* Top Bar (Balance) */}
        <div className="glass-panel px-6 py-4 flex justify-between items-center lg:px-8">
          <h1 className="text-xl font-display font-bold text-foreground capitalize">
            {navItems.find(i => i.href === location)?.label || "Панель управления"}
          </h1>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full border border-accent/20 shadow-sm">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide text-[10px]">Баланс</span>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-xl text-accent-foreground">
                {balance ?? 0}
              </span>
              <Coins className="w-5 h-5 text-accent fill-accent" />
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
