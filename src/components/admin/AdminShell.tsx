"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, createContext, useContext, ReactNode } from "react";
import {
  LayoutDashboard, Calendar, BookMarked, Wallet, Receipt, FileBarChart,
  Home, Users, ShieldCheck, LogOut, Menu, X,
} from "lucide-react";
import { NAV } from "@/lib/adminNav";
import { api } from "./ui";

const icons: Record<string, any> = {
  LayoutDashboard, Calendar, BookMarked, Wallet, Receipt, FileBarChart, Home, Users, ShieldCheck,
};

export interface ShellUser {
  id: number; name: string; email: string; roleName: string; permissions: string[];
}

const UserCtx = createContext<ShellUser | null>(null);
export const useAdmin = () => useContext(UserCtx);
export const useCan = (perm: string) => {
  const u = useContext(UserCtx);
  return !!u && u.permissions.includes(perm);
};

export default function AdminShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const items = NAV.filter((n) => user.permissions.includes(n.perm));

  async function logout() {
    await api("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <UserCtx.Provider value={user}>
      <div className="flex min-h-screen bg-slate-50 text-slate-900">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex h-16 items-center gap-2.5 border-b border-slate-200 px-5">
            <div className="relative h-8 w-8 overflow-hidden rounded-full border border-emerald-700/20">
              <Image src="/images/logo.jpg" alt="" fill className="object-contain" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Kakkadampoyil</div>
              <div className="text-[10px] uppercase tracking-wider text-emerald-700">Villas Admin</div>
            </div>
          </div>

          <nav className="flex flex-col gap-1 p-3">
            {items.map((item) => {
              const Icon = icons[item.icon] || LayoutDashboard;
              const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active ? "bg-emerald-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                  <Icon className="h-[18px] w-[18px]" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="absolute inset-x-0 bottom-0 border-t border-slate-200 p-3">
            <div className="mb-2 px-2">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-xs text-slate-400">{user.roleName}</div>
            </div>
            <button onClick={logout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </aside>

        {open && <div className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden" onClick={() => setOpen(false)} />}

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
            <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100">
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-semibold">Kakkadampoyil Villas</span>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </UserCtx.Provider>
  );
}
