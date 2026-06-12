"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";

const navigationItems = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/cars", label: "차량" },
  { href: "/wash", label: "세차 기록" },
  { href: "/routine/new", label: "AI 루틴" },
  { href: "/community", label: "커뮤니티" },
  { href: "/bookmarks", label: "북마크" },
  { href: "/profile", label: "프로필" },
];

function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return navigationItems.map((item) => {
    const isActive =
      pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

    return (
      <Link
        className={cn(
          "rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground",
          isActive && "bg-primary/10 text-primary",
        )}
        href={item.href}
        key={item.href}
        onClick={onNavigate}
      >
        {item.label}
      </Link>
    );
  });
}

export function AppNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <nav className="hidden items-center gap-1 lg:flex" aria-label="주요 메뉴">
        <NavigationLinks />
      </nav>
      <button
        aria-expanded={isOpen}
        aria-label={isOpen ? "메뉴 닫기" : "메뉴 열기"}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-foreground transition hover:bg-muted lg:hidden"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {isOpen ? (
        <nav
          className="absolute inset-x-0 top-full z-50 border-b border-border bg-white/95 px-5 py-4 shadow-lg backdrop-blur lg:hidden"
          aria-label="모바일 주요 메뉴"
        >
          <div className="mx-auto grid max-w-6xl gap-1">
            <NavigationLinks onNavigate={() => setIsOpen(false)} />
          </div>
        </nav>
      ) : null}
    </>
  );
}
