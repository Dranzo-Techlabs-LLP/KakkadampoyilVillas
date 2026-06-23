"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

export default function PrintActions({ backHref }: { backHref: string }) {
  return (
    <div className="print:hidden flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-3">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to booking
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
  );
}
