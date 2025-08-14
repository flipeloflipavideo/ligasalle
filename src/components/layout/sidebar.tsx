"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Home, 
  Trophy, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings,
  Menu,
  X,
  CalendarDays,
  Users2,
  CalendarClock
} from "lucide-react";

const navigation = [
  {
    name: "Inicio",
    href: "/",
    icon: Home,
  },
  {
    name: "Temporadas",
    href: "/seasons",
    icon: CalendarDays,
  },
  {
    name: "Equipos por Liga",
    href: "/league-teams",
    icon: Users2,
  },
  {
    name: "Calendario",
    href: "/schedule",
    icon: CalendarClock,
  },
  {
    name: "Ligas",
    href: "/leagues",
    icon: Trophy,
  },
  {
    name: "Partidos",
    href: "/matches",
    icon: Calendar,
  },
  {
    name: "Estadísticas",
    href: "/statistics",
    icon: BarChart3,
  },
  {
    name: "Configuración",
    href: "/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className={cn(
      "border-r bg-gray-50/40 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center border-b px-4">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Trophy className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-lg font-semibold">Ligas</h1>
                <p className="text-xs text-muted-foreground">Deportivas</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "ml-auto",
              isCollapsed && "mx-auto"
            )}
          >
            {isCollapsed ? (
              <Menu className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2 py-4">
          <nav className="flex flex-col gap-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {!isCollapsed && item.name}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        {!isCollapsed && (
          <div className="border-t p-4">
            <div className="text-xs text-muted-foreground">
              <p>Sistema de Gestión</p>
              <p>Ligas Deportivas v1.0</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}