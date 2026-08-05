"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api, fmtMoney } from "@/components/admin/ui";
import { ArrowLeft, Printer } from "lucide-react";

type Totals = { cashIn: number; cashOut: number; balance: number; entries: number };
type Row = {
  Date: string;
  Stay: string;
  Villa: string;
  Remark: string;
  "Entry by": string;
  Mode: string;
  "Cash in": number;
  "Cash out": number;
  Balance: number;
};

function fmtShort(d?: string) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
}

function fmtLong(d?: string) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function CombinedReportPrint() {
  const sp = useSearchParams();
  const from = sp.get("from") || "";
  const to = sp.get("to") || "";
  const villaId = sp.get("villa") || "";

  const [rows, setRows] = useState<Row[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [villaName, setVillaName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const p = new URLSearchParams({ type: "combined", from, to });
        if (villaId) p.set("villa", villaId);
        const [d, villas] = await Promise.all([
          api(`/api/admin/reports?${p}`),
          api("/api/admin/villas").catch(() => ({ villas: [] })),
        ]);
        setRows(d.rows || []);
        setTotals(d.totals || null);
        if (villaId) {
          const v = (villas.villas || []).find((x: any) => String(x.id) === String(villaId));
          if (v) setVillaName(v.name);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [from, to, villaId]);

  const title = villaName ? `${villaName} · Combined Report` : "Combined Report";

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <div className="mx-auto max-w-[820px] bg-white shadow-sm print:max-w-none print:shadow-none">
        {/* Toolbar (hidden on print) */}
        <div className="print:hidden flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-3">
          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to reports
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            <Printer className="h-4 w-4" />
            Download PDF / Print
          </button>
        </div>

        <article className="px-10 py-10 text-slate-900 print:px-12 print:py-10">
          {/* Header */}
          <header className="rounded-xl bg-indigo-50 px-5 py-4">
            <div className="flex items-start gap-4">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-emerald-700/30">
                <Image src="/images/logo.jpg" alt="" fill className="object-cover" unoptimized />
              </div>
              <div>
                <div className="text-lg font-semibold text-slate-900">Businesses Report</div>
                <div className="mt-0.5 text-xs text-slate-600">
                  Generated On - {new Date().toLocaleString("en-GB", {
                    day: "2-digit", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit", hour12: true,
                  })}
                </div>
              </div>
            </div>
          </header>

          <h1 className="mt-6 text-xl font-semibold text-slate-900">{title}</h1>

          {/* Duration */}
          <div className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700">
            <span className="font-medium">Duration: </span>
            {fmtLong(from)} - {fmtLong(to)}
          </div>

          {/* Totals */}
          {totals && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-200 px-4 py-3">
                <div className="text-xs text-slate-500">Total Cash in</div>
                <div className="mt-1 text-lg font-semibold text-emerald-700 tabular-nums">{fmtMoney(totals.cashIn)}</div>
              </div>
              <div className="rounded-lg border border-slate-200 px-4 py-3">
                <div className="text-xs text-slate-500">Total Cash out</div>
                <div className="mt-1 text-lg font-semibold text-red-600 tabular-nums">{fmtMoney(totals.cashOut)}</div>
              </div>
              <div className="rounded-lg border border-slate-200 px-4 py-3">
                <div className="text-xs text-slate-500">Final Balance</div>
                <div className={`mt-1 text-lg font-semibold tabular-nums ${totals.balance >= 0 ? "text-slate-900" : "text-red-600"}`}>
                  {fmtMoney(totals.balance)}
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <p className="mt-8 text-sm text-slate-500">Loading…</p>
          ) : (
            <>
              <p className="mt-6 text-sm text-slate-700">Total No. of entries: {totals?.entries ?? rows.length}</p>

              {rows.length === 0 ? (
                <p className="mt-6 rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  No entries in this period.
                </p>
              ) : (
                <table className="mt-3 w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-indigo-50 text-left text-slate-700">
                      <th className="border border-slate-200 px-2 py-2">Date</th>
                      <th className="border border-slate-200 px-2 py-2">Stay</th>
                      <th className="border border-slate-200 px-2 py-2">Villa</th>
                      <th className="border border-slate-200 px-2 py-2">Remark</th>
                      <th className="border border-slate-200 px-2 py-2">Entry by</th>
                      <th className="border border-slate-200 px-2 py-2">Mode</th>
                      <th className="border border-slate-200 px-2 py-2 text-right">Cash in</th>
                      <th className="border border-slate-200 px-2 py-2 text-right">Cash out</th>
                      <th className="border border-slate-200 px-2 py-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="align-top">
                        <td className="border border-slate-200 px-2 py-2 whitespace-nowrap">{fmtShort(r.Date)}</td>
                        <td className="border border-slate-200 px-2 py-2 whitespace-nowrap">{fmtShort(r.Stay)}</td>
                        <td className="border border-slate-200 px-2 py-2 whitespace-nowrap">{r.Villa}</td>
                        <td className="border border-slate-200 px-2 py-2">{r.Remark}</td>
                        <td className="border border-slate-200 px-2 py-2 whitespace-nowrap">{r["Entry by"]}</td>
                        <td className="border border-slate-200 px-2 py-2 capitalize">{r.Mode}</td>
                        <td className={`border border-slate-200 px-2 py-2 text-right tabular-nums ${r["Cash in"] > 0 ? "font-semibold text-emerald-700" : ""}`}>
                          {r["Cash in"] > 0 ? fmtMoney(r["Cash in"]) : ""}
                        </td>
                        <td className={`border border-slate-200 px-2 py-2 text-right tabular-nums ${r["Cash out"] > 0 ? "font-semibold text-red-600" : ""}`}>
                          {r["Cash out"] > 0 ? fmtMoney(r["Cash out"]) : ""}
                        </td>
                        <td className="border border-slate-200 px-2 py-2 text-right tabular-nums">{fmtMoney(r.Balance)}</td>
                      </tr>
                    ))}
                    {totals && (
                      <tr className="bg-indigo-50 font-semibold">
                        <td className="border border-slate-200 px-2 py-2 whitespace-nowrap">{fmtShort(to)}</td>
                        <td className="border border-slate-200 px-2 py-2" />
                        <td className="border border-slate-200 px-2 py-2" />
                        <td className="border border-slate-200 px-2 py-2">Final Balance</td>
                        <td className="border border-slate-200 px-2 py-2" />
                        <td className="border border-slate-200 px-2 py-2" />
                        <td className="border border-slate-200 px-2 py-2" />
                        <td className="border border-slate-200 px-2 py-2" />
                        <td className="border border-slate-200 px-2 py-2 text-right tabular-nums">{fmtMoney(totals.balance)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </>
          )}
        </article>
      </div>

      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          html, body { background: #fff; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
        }
      `}</style>
    </div>
  );
}
