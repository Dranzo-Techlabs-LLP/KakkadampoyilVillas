"use client";

import { ReactNode } from "react";

export function fmtMoney(n: number | string | null | undefined) {
  const v = Number(n || 0);
  return "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  const s = String(d).slice(0, 10);
  const [y, m, day] = s.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  if (!y || !m || !day) return s;
  return `${day} ${months[Number(m) - 1]} ${y}`;
}

export function nights(checkIn: string, checkOut: string) {
  const a = new Date(checkIn + "T00:00:00");
  const b = new Date(checkOut + "T00:00:00");
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Stat({ label, value, sub, tone = "default" }: {
  label: string; value: ReactNode; sub?: string; tone?: "default" | "green" | "red" | "amber";
}) {
  const tones: Record<string, string> = {
    default: "text-slate-900",
    green: "text-emerald-700",
    red: "text-red-600",
    amber: "text-amber-600",
  };
  return (
    <Card className="p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${tones[tone]}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </Card>
  );
}

export function Btn({
  children, onClick, type = "button", variant = "primary", size = "md", disabled, className = "",
}: {
  children: ReactNode; onClick?: () => void; type?: "button" | "submit";
  variant?: "primary" | "ghost" | "danger" | "outline"; size?: "sm" | "md"; disabled?: boolean; className?: string;
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2.5 text-sm" };
  const variants: Record<string, string> = {
    primary: "bg-emerald-700 text-white hover:bg-emerald-800",
    danger: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-slate-300 text-slate-700 hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Field({ label, children, required }: { label: string; children: ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-600">
        {label}{required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

export function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    enquiry:   "bg-slate-100 text-slate-700",
    hold:      "bg-amber-100 text-amber-800",
    confirmed: "bg-emerald-100 text-emerald-800",
    checked_in:"bg-blue-100 text-blue-800",
    completed: "bg-violet-100 text-violet-800",
    cancelled: "bg-red-100 text-red-700",
  };
  const label = status.replace("_", " ");
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${map[status] || "bg-slate-100 text-slate-700"}`}>
      {label}
    </span>
  );
}

export function Modal({ open, onClose, title, children, wide }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm sm:p-8">
      <div className={`relative w-full ${wide ? "max-w-3xl" : "max-w-lg"} rounded-2xl bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">✕</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export async function api(path: string, opts?: RequestInit) {
  const res = await fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}
