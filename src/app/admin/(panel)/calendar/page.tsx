"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Btn, api, fmtMoney } from "@/components/admin/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Local-timezone YYYY-MM-DD. toISOString() converts to UTC and shifts dates
// back a day in IST (UTC+5:30), which made bookings render on the wrong cell.
function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function startOfMonth(y: number, m: number) { return new Date(y, m, 1); }
function addMonths(y: number, m: number, delta: number) {
  const d = new Date(y, m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() };
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function CalendarPage() {
  const router = useRouter();
  const now = new Date();
  const [y, setY] = useState(now.getFullYear());
  const [m, setM] = useState(now.getMonth());
  const [villa, setVilla] = useState("");
  const [villas, setVillas] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => { api("/api/admin/villas").then((d) => setVillas(d.villas || [])).catch(() => {}); }, []);

  // Build the 6-week grid
  const grid = useMemo(() => {
    const first = startOfMonth(y, m);
    const startDow = first.getDay();
    const gridStart = new Date(y, m, 1 - startDow);
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) { const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); days.push(d); }
    return days;
  }, [y, m]);

  useEffect(() => {
    const from = ymd(grid[0]); const to = ymd(grid[grid.length - 1]);
    const qs = new URLSearchParams({ from, to });
    if (villa) qs.set("villa", villa);
    api(`/api/admin/calendar?${qs}`).then((d) => setBookings(d.bookings || [])).catch(() => {});
  }, [grid, villa]);

  // Map each day → bookings active that day (check_in <= day < check_out)
  function bookingsOn(day: Date) {
    const ds = ymd(day);
    return bookings.filter((b) => b.checkIn.slice(0,10) <= ds && ds < b.checkOut.slice(0,10));
  }

  const todayStr = ymd(now);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Booking calendar</h1>
        <div className="flex items-center gap-2">
          <select value={villa} onChange={(e) => setVilla(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">All villas</option>
            {villas.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
      </div>

      <Card className="p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{MONTHS[m]} {y}</h2>
          <div className="flex items-center gap-1">
            <Btn variant="outline" size="sm" onClick={() => { const n = addMonths(y, m, -1); setY(n.y); setM(n.m); }}><ChevronLeft className="h-4 w-4" /></Btn>
            <Btn variant="outline" size="sm" onClick={() => { setY(now.getFullYear()); setM(now.getMonth()); }}>Today</Btn>
            <Btn variant="outline" size="sm" onClick={() => { const n = addMonths(y, m, 1); setY(n.y); setM(n.m); }}><ChevronRight className="h-4 w-4" /></Btn>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg bg-slate-200 text-sm">
          {DOW.map((d) => (
            <div key={d} className="bg-slate-50 py-2 text-center text-xs font-medium uppercase tracking-wide text-slate-400">{d}</div>
          ))}
          {grid.map((day, i) => {
            const inMonth = day.getMonth() === m;
            const ds = ymd(day);
            const dayBookings = bookingsOn(day);
            return (
              <div key={i} className={`min-h-[92px] bg-white p-1.5 ${inMonth ? "" : "bg-slate-50/60"}`}>
                <div className={`mb-1 text-right text-xs ${ds === todayStr ? "font-bold text-emerald-700" : inMonth ? "text-slate-500" : "text-slate-300"}`}>
                  {ds === todayStr ? <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-700 text-white">{day.getDate()}</span> : day.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayBookings.slice(0, 3).map((b) => (
                    <button key={b.id} onClick={() => router.push(`/admin/bookings/${b.id}`)}
                      title={`${b.guestName} · ${b.villaName} · ${fmtMoney(b.totalAmount)}${b.status === "hold" ? " · On hold" : ""}`}
                      className="flex w-full items-center gap-1 rounded px-1.5 py-0.5 text-left text-[11px] font-medium text-white hover:opacity-90"
                      style={{ background: b.color }}>
                      <span className="truncate flex-1">{b.guestName}</span>
                      {b.status === "hold" && (
                        <span
                          className="shrink-0 rounded-sm bg-white/25 px-1 text-[9px] font-bold leading-tight tracking-wide"
                          aria-label="On hold"
                        >
                          H
                        </span>
                      )}
                    </button>
                  ))}
                  {dayBookings.length > 3 && <div className="px-1 text-[10px] text-slate-400">+{dayBookings.length - 3} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex flex-wrap gap-4">
        {villas.map((v) => (
          <div key={v.id} className="flex items-center gap-1.5 text-sm text-slate-600">
            <span className="h-3 w-3 rounded-full" style={{ background: v.color }} />{v.name}
          </div>
        ))}
      </div>
    </div>
  );
}
