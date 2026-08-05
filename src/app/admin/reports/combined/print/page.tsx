import { Suspense } from "react";
import PrintView from "./PrintView";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-sm text-slate-500">Loading…</div>}>
      <PrintView />
    </Suspense>
  );
}
