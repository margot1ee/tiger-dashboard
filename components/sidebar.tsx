"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BarChart3,
  Share2,
  FileText,
  Lightbulb,
  PenSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/traffic", label: "Traffic", icon: BarChart3 },
  { href: "/channels", label: "Channels", icon: Share2 },
  { href: "/content", label: "Content", icon: FileText },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/input", label: "Data Input", icon: PenSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="relative flex shrink-0 group/sidebar">
      <aside
        className={cn(
          "relative border-r bg-card flex flex-col h-screen sticky top-0 transition-all duration-200 ease-in-out",
          collapsed ? "w-[60px]" : "w-56"
        )}
      >
        {/* Logo */}
        <div className={cn("border-b", collapsed ? "px-2 py-4" : "p-4")}>
          {collapsed ? (
            <div className="flex justify-center">
              <Image
                src="/logo_symbol.png"
                alt="Tiger Research"
                width={28}
                height={30}
                className="h-[28px] w-auto"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo_symbol.png"
                alt="Tiger Research"
                width={24}
                height={26}
                className="h-[24px] w-auto"
              />
              <div>
                <h1 className="font-bold text-base tracking-tight text-foreground">
                  Tiger Research
                </h1>
                <p className="text-[10px] text-muted-foreground -mt-0.5">
                  Analytics Dashboard
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center rounded-md text-sm transition-colors",
                  collapsed
                    ? "justify-center px-2 py-2.5"
                    : "gap-2.5 px-3 py-2",
                  isActive
                    ? "bg-orange-50 text-orange-600 font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t">
            <p className="text-[10px] text-muted-foreground">
              Tiger Research Inc. &copy; 2026
            </p>
          </div>
        )}

        {/* Collapse toggle - floating circle on the right border edge */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 -right-3 z-10",
            "h-6 w-6 rounded-full",
            "bg-white border border-border shadow-sm",
            "flex items-center justify-center",
            "text-muted-foreground hover:text-orange-500 hover:border-orange-300 hover:shadow-md",
            "opacity-0 group-hover/sidebar:opacity-100",
            "transition-all duration-200 cursor-pointer"
          )}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      </aside>
    </div>
  );
}
