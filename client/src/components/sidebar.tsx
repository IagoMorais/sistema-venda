import { useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  X,
  Home,
  Users,
  ClipboardList,
  UtensilsCrossed,
  Beer,
  CreditCard,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  onClose?: () => void;
}

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

export function Sidebar({ onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems = useMemo<NavItem[]>(() => {
    switch (user?.role) {
      case "admin":
        return [
          { icon: Home, label: "Dashboard", path: "/" },
          { icon: Users, label: "Usuários", path: "/users" },
        ];
      case "waiter":
        return [{ icon: ClipboardList, label: "Nova Comanda", path: "/" }];
      case "cashier":
        return [{ icon: CreditCard, label: "Caixa", path: "/" }];
      case "kitchen":
        return [{ icon: UtensilsCrossed, label: "Cozinha", path: "/" }];
      case "bar":
        return [{ icon: Beer, label: "Bar", path: "/" }];
      default:
        return [{ icon: Home, label: "Início", path: "/" }];
    }
  }, [user?.role]);

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between border-b border-sidebar-border p-4">
        <h1 className="text-xl font-semibold">Control Chef</h1>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-sidebar-accent lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map(({ icon: Icon, label, path }) => (
            <li key={path}>
              <Link
                href={path}
                className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                  location === path
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
                onClick={onClose}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-md px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium">
            {user?.username?.slice(0, 2).toUpperCase() ?? "US"}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">{user?.username ?? "Usuário"}</p>
            <p className="text-xs text-sidebar-foreground/70">
              {user?.role
                ? {
                    admin: "Administrador",
                    waiter: "Atendente",
                    cashier: "Caixa",
                    kitchen: "Cozinha",
                    bar: "Bar",
                  }[user.role]
                : "Visitante"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
