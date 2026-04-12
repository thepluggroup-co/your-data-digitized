import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, TrendingUp, BarChart3, Settings, FileText,
  Building2, PiggyBank, Wallet, CreditCard, Users, ChevronLeft, ChevronRight, Zap, Landmark, Target
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Tableau de Bord" },
  { to: "/parametres", icon: Settings, label: "Paramètres" },
  { to: "/ventes", icon: TrendingUp, label: "Ventes" },
  { to: "/salaires", icon: Users, label: "Salaires" },
  { to: "/amortissements", icon: Building2, label: "Amortissements" },
  { to: "/charges", icon: FileText, label: "Charges" },
  { to: "/investissements", icon: BarChart3, label: "Investissements" },
  { to: "/resultats", icon: PiggyBank, label: "Résultats" },
  { to: "/bilan", icon: Wallet, label: "Bilan" },
  { to: "/emprunt", icon: CreditCard, label: "Emprunt" },
  { to: "/plan-financement", icon: Landmark, label: "Plan Financement" },
  { to: "/seuil-rentabilite", icon: Target, label: "Seuil Rentabilité" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 flex-shrink-0",
          collapsed ? "w-16" : "w-56"
        )}
      >
        {/* Logo */}
        <div className={cn("flex items-center gap-3 px-4 py-5 border-b border-sidebar-border", collapsed && "justify-center px-2")}>
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div>
              <div className="text-white font-bold text-sm leading-tight">KENENERGIE</div>
              <div className="text-sidebar-foreground/60 text-[10px]">Modèle Financier</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors group",
                  isActive
                    ? "bg-sidebar-primary text-white font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white",
                  collapsed && "justify-center px-2"
                )
              }
              title={collapsed ? label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center p-3 border-t border-sidebar-border hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-auto">
        <div className="p-6 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
