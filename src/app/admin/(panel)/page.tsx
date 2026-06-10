"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Stat, Badge, fmtMoney, fmtDate, api } from "@/components/admin/ui";
import { useAdmin } from "@/components/admin/AdminShell";
import { CalendarDays, LogIn, LogOut, TrendingUp } from "lucide-react";

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
function monthStartISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
function plusDays(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function Dashboard() {
  const user = useAdmin();
  const [bookings, setBookings] = useState<any[]>([]);
  const [acct, setAcct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const today = todayISO();

  useEffect(() => {
    (async () => {
      try {
        const horizon = plusDays(today, 30);
        const b = await api(`/api/admin/bookings?from=${today}&to=${horizon}`);
        setBookings(b.bookings || []);
        if (user?.permissions.includes("accounting.view")) {
          const a = await api(`/api/admin/accounting?from=${monthStartISO()}&to=${today}`);
          setAcct(a);
        }
      } catch { /* */ } finally { setLoading(false); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkinsToday = bookings.filter((b) => b.checkIn?.slice(0, 10) === today && b.status !== "cancelled");
  const checkoutsToday = bookings.filter((b) => b.checkOut?.slice(0, 10) === today && b.status !== "cancelled");
  const upcoming = bookings
    .filter((b) => b.checkIn >= today && b.status !== "cancelled")
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back, {user?.name?.split(" ")[0]}</h1>
        <p className="text-sm text-slate-500">{fmtDate(today)} · here's what's happening</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Check-ins today" value={checkinsToday.length} sub="arriving guests" />
        <Stat label="Check-outs today" value={checkoutsToday.length} sub="departing guests" />
        {acct && <Stat label="Revenue (MTD)" value={fmtMoney(acct.summary.netRevenue)} tone="green" sub="collected this month" />}
        {acct && <Stat label="Profit (MTD)" value={fmtMoney(acct.summary.profit)} tone={acct.summary.profit >= 0 ? "green" : "red"} sub="after expenses" />}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <LogIn className="h-4 w-4 text-emerald-600" /> Arrivals today
          </div>
          {loading ? <Skel /> : checkinsToday.length === 0 ? (
            <Empty text="No arrivals scheduled today." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {checkinsToday.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <Link href={`/admin/bookings/${b.id}`} className="font-medium hover:text-emerald-700">{b.guestName}</Link>
                    <div className="text-xs text-slate-400">{b.villaName} · {b.reference}</div>
                  </div>
                  <Badge status={b.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <LogOut className="h-4 w-4 text-amber-600" /> Departures today
          </div>
          {loading ? <Skel /> : checkoutsToday.length === 0 ? (
            <Empty text="No departures scheduled today." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {checkoutsToday.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <Link href={`/admin/bookings/${b.id}`} className="font-medium hover:text-emerald-700">{b.guestName}</Link>
                    <div className="text-xs text-slate-400">{b.villaName} · {b.reference}</div>
                  </div>
                  <Badge status={b.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <CalendarDays className="h-4 w-4 text-emerald-600" /> Upcoming (next 30 days)
        </div>
        {loading ? <Skel /> : upcoming.length === 0 ? (
          <Empty text="No upcoming bookings." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2">Guest</th><th className="pb-2">Villa</th>
                  <th className="pb-2">Check-in</th><th className="pb-2">Check-out</th>
                  <th className="pb-2">Status</th><th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcoming.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="py-2.5">
                      <Link href={`/admin/bookings/${b.id}`} className="font-medium hover:text-emerald-700">{b.guestName}</Link>
                    </td>
                    <td className="py-2.5"><span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} />{b.villaName}</span></td>
                    <td className="py-2.5">{fmtDate(b.checkIn)}</td>
                    <td className="py-2.5">{fmtDate(b.checkOut)}</td>
                    <td className="py-2.5"><Badge status={b.status} /></td>
                    <td className="py-2.5 text-right tabular-nums">{fmtMoney(b.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {acct && (
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <TrendingUp className="h-4 w-4 text-emerald-600" /> Per-villa (this month)
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {acct.perVilla.map((v: any) => (
              <div key={v.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="h-3 w-3 rounded-full" style={{ background: v.color }} />{v.name}
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  <Row k="Revenue" v={fmtMoney(v.revenue)} green />
                  <Row k="Expenses" v={fmtMoney(v.expenses)} />
                  <Row k="Bookings" v={v.bookings} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Row({ k, v, green }: { k: string; v: any; green?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{k}</span>
      <span className={`tabular-nums font-medium ${green ? "text-emerald-700" : "text-slate-800"}`}>{v}</span>
    </div>
  );
}
function Skel() { return <div className="h-24 animate-pulse rounded-lg bg-slate-100" />; }
function Empty({ text }: { text: string }) { return <p className="py-6 text-center text-sm text-slate-400">{text}</p>; }
