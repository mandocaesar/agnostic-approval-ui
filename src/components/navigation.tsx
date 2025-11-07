"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, type ChangeEvent } from "react";

export interface NavItem {
  href: string;
  label: string;
  description?: string;
}

interface NavigationProps {
  items: NavItem[];
  className?: string;
}

export function SidebarNav({ items, className }: NavigationProps) {
  const pathname = usePathname();

  return (
    <nav
      className={[
        "flex flex-col gap-2",
        className ?? "",
      ]
        .join(" ")
        .trim()}
    >
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={[
                  "group relative block px-4 py-3 text-sm font-medium transition-all",
                  isActive
                    ? "bg-[#0d1d3b] text-white shadow-[0_10px_24px_-12px_rgba(2,6,23,0.65)]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-[#0d1d3b]",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="tracking-tight">{item.label}</span>
                  {isActive ? (
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  ) : null}
                </div>
                {item.description ? (
                  <p
                    className={`mt-1 text-xs ${isActive ? "text-white/70" : "text-slate-400"}`}
                  >
                    {item.description}
                  </p>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileNav({ items, className }: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSelect = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const next = event.target.value;
      if (next && next !== pathname) {
        router.push(next);
      }
    },
    [pathname, router],
  );

  return (
    <div className={className}>
      <label className="sr-only" htmlFor="mobile-nav-select">
        Select a section
      </label>
      <select
        id="mobile-nav-select"
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
        value={pathname ?? items[0]?.href}
        onChange={handleSelect}
      >
        {items.map((item) => (
          <option key={item.href} value={item.href}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}
