"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  MobileNav,
  SidebarNav,
  type NavItem,
} from "@/components/navigation";
import {
  PageHeaderActions,
  PageHeaderProvider,
  PageHeaderText,
} from "@/components/page-header";
import { SignOutButton } from "@/components/sign-out-button";
import type { User } from "next-auth";

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard/approvals",
    label: "Approvals",
    description: "Monitor request statuses by domain.",
  },
  {
    href: "/dashboard/rules",
    label: "Rules",
    description: "Manage JSON-based approval logic.",
  },
  {
    href: "/dashboard/domains",
    label: "Domains",
    description: "Curate business domains and owners.",
  },
  {
    href: "/dashboard/users",
    label: "Users",
    description: "Assign roles and responsibilities.",
  },
  {
    href: "/dashboard/logs",
    label: "Logs",
    description: "Audit important workflow events.",
  },
];

export default function DashboardLayoutClient({
  children,
  user,
}: {
  children: ReactNode;
  user: User;
}) {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  
  // Generate user initials
  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };
  
  const initials = getInitials(user.name);
  const userName = user.name || "User";
  const userEmail = user.email || "";

  return (
    <PageHeaderProvider>
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-[#f4f7fb] via-white to-white text-slate-900">
        {isSidebarVisible ? (
          <aside className="hidden w-72 shrink-0 flex-col overflow-y-auto border-r border-slate-200/60 bg-gradient-to-b from-white via-[#f5f8fd] to-[#ecf2ff] px-6 py-8 text-slate-700 shadow-[8px_0_24px_-16px_rgba(15,23,42,0.24)] lg:flex">
            <div className="flex items-center justify-between gap-3 pb-6">
              <div className="flex items-center gap-3">
                <Link href="/dashboard/approvals" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-semibold tracking-tight text-[#0d1d3b] shadow-sm">
                  AA
                </Link>
                <div className="leading-tight">
                  <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">
                    Agnostic
                  </p>
                  <p className="text-lg font-semibold text-[#0d1d3b]">Approval Hub</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarVisible(false)}
                className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-100"
                title="Hide sidebar"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </div>
            <SidebarNav items={NAV_ITEMS} className="flex-1" />
            <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500 shadow-sm">
              SDE 2 PLATFORM<br />© 2025 Approval System<br />All rights reserved.
            </div>
          </aside>
        ) : null}
        {!isSidebarVisible ? (
          <button
            type="button"
            onClick={() => setIsSidebarVisible(true)}
            className="fixed left-4 top-4 z-40 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-lg transition hover:bg-slate-100 lg:inline-flex"
            title="Show sidebar"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Menu
          </button>
        ) : null}
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="border-b border-slate-200/70 bg-white/95 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-12">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <PageHeaderText />
                  </div>
                  <PageHeaderActions className="flex flex-wrap items-center gap-3" />
                </div>
                <div className="flex items-center gap-4 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
                  <div className="flex flex-col text-right">
                    <span className="text-sm font-semibold text-slate-900">
                      {userName}
                    </span>
                    <span className="text-xs text-slate-500">
                      {userEmail}
                    </span>
                  </div>
                  {user.image ? (
                    <img 
                      src={user.image} 
                      alt={userName}
                      className="h-9 w-9 rounded-full"
                    />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f97316] text-sm font-semibold text-white">
                      {initials}
                    </span>
                  )}
                  <SignOutButton />
                </div>
              </div>
              <MobileNav items={NAV_ITEMS} className="lg:hidden" />
            </div>
          </header>
          <main className="flex flex-1 flex-col overflow-hidden">
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </PageHeaderProvider>
  );
}
