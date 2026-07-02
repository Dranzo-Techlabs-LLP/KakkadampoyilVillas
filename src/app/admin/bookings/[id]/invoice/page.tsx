import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { getSessionUser } from "@/lib/auth";
import PrintActions from "./PrintActions";
import { BIZ, fmtMoney, fmtDate, loadInvoice, loadInvoiceSettings, todayLocal } from "./_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/admin/login?next=/admin/bookings/${id}/invoice`);
  if (!user.permissions.includes("bookings.view")) {
    return (
      <div className="mx-auto max-w-2xl p-12 text-center text-slate-600">
        You don&rsquo;t have permission to view invoices.
      </div>
    );
  }

  const data = await loadInvoice(id);
  if (!data) notFound();
  const { booking, payments, checkIn, checkOut, nights, total, ratePerNight, paid, balance } = data;

  const settings = await loadInvoiceSettings();
  const hasTerms = settings.terms.trim().length > 0;

  const invoiceNumber = booking.reference;
  const issued = todayLocal();

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <div className="mx-auto max-w-[820px] bg-white shadow-sm print:max-w-none print:shadow-none">
        <PrintActions backHref={`/admin/bookings/${id}`} bookingId={id} />

        {/* A4-ish content area */}
        <article className="px-10 py-10 text-slate-900 print:px-12 print:py-10">
          {/* Header */}
          <header className="flex items-start justify-between gap-6 border-b border-slate-200 pb-6">
            <div className="flex items-start gap-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-emerald-700/30">
                <Image src="/images/logo.jpg" alt="" fill className="object-cover" unoptimized />
              </div>
              <div>
                <div className="text-xl font-semibold text-emerald-800">{BIZ.name}</div>
                <div className="mt-1 text-xs leading-relaxed text-slate-600">
                  {BIZ.address}
                  <br />
                  {BIZ.phone} · {BIZ.email}
                  <br />
                  {BIZ.website}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                Invoice
              </div>
              <div className="mt-1 font-mono text-base font-semibold text-slate-900">
                {invoiceNumber}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Issued: <span className="text-slate-700">{fmtDate(issued)}</span>
              </div>
              {booking.status === "cancelled" && (
                <div className="mt-2 inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                  Cancelled
                </div>
              )}
            </div>
          </header>

          {/* Bill-to / Stay */}
          <section className="mt-6 grid grid-cols-2 gap-6 text-sm">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Bill to
              </div>
              <div className="mt-1.5 font-medium text-slate-900">{booking.guest_name}</div>
              {booking.guest_phone && (
                <div className="text-slate-600">{booking.guest_phone}</div>
              )}
              {booking.guest_phone2 && (
                <div className="text-slate-600">{booking.guest_phone2}</div>
              )}
              {booking.guest_email && (
                <div className="text-slate-600">{booking.guest_email}</div>
              )}
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Stay
              </div>
              <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-slate-700">
                <dt className="text-slate-500">Villa:</dt>
                <dd className="font-medium text-slate-900">{booking.villaName}</dd>
                <dt className="text-slate-500">Check-in:</dt>
                <dd>{fmtDate(checkIn)}</dd>
                <dt className="text-slate-500">Check-out:</dt>
                <dd>{fmtDate(checkOut)}</dd>
                <dt className="text-slate-500">Nights:</dt>
                <dd>{nights}</dd>
                <dt className="text-slate-500">Guests:</dt>
                <dd>
                  {booking.adults} adults
                  {booking.children > 0 ? ` · ${booking.children} children` : ""}
                </dd>
              </dl>
            </div>
          </section>

          {/* Line items */}
          <section className="mt-8">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-y border-slate-300 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  <th className="py-2.5">Description</th>
                  <th className="py-2.5 text-right">Nights</th>
                  <th className="py-2.5 text-right">Rate</th>
                  <th className="py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 align-top">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-slate-900">{booking.villaName} — Stay</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {fmtDate(checkIn)} → {fmtDate(checkOut)}
                    </div>
                  </td>
                  <td className="py-3 text-right tabular-nums">{nights}</td>
                  <td className="py-3 text-right tabular-nums">
                    {nights > 0 ? fmtMoney(ratePerNight) : "—"}
                  </td>
                  <td className="py-3 text-right tabular-nums font-medium">{fmtMoney(total)}</td>
                </tr>
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-4 flex justify-end">
              <dl className="w-72 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-600">Subtotal</dt>
                  <dd className="tabular-nums text-slate-900">{fmtMoney(total)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">Paid</dt>
                  <dd className="tabular-nums text-emerald-700">−{fmtMoney(paid)}</dd>
                </div>
                <div className="mt-2 flex justify-between border-t border-slate-300 pt-2 text-base">
                  <dt className="font-semibold text-slate-900">Balance due</dt>
                  <dd
                    className={`tabular-nums font-semibold ${
                      balance > 0 ? "text-amber-700" : "text-emerald-700"
                    }`}
                  >
                    {fmtMoney(balance)}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Payments received */}
          {payments.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Payments received
              </h2>
              <table className="mt-2 w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    <th className="py-2">Date</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Method</th>
                    <th className="py-2">Reference</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100">
                      <td className="py-2 text-slate-700">{fmtDate(p.paidOn)}</td>
                      <td className="py-2 capitalize text-slate-700">{p.kind}</td>
                      <td className="py-2 capitalize text-slate-700">{p.method}</td>
                      <td className="py-2 text-slate-500">{p.reference || "—"}</td>
                      <td
                        className={`py-2 text-right tabular-nums font-medium ${
                          p.kind === "refund" ? "text-red-600" : "text-emerald-700"
                        }`}
                      >
                        {p.kind === "refund" ? "−" : "+"}
                        {fmtMoney(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Notes */}
          {booking.notes && (
            <section className="mt-8">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Notes
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{booking.notes}</p>
            </section>
          )}

          {/* Footer */}
          <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
            <p className="font-medium text-slate-700">
              Thank you for choosing {BIZ.name}.
            </p>
            <p className="mt-1">
              Questions about this invoice? Reach us at {BIZ.phone} or {BIZ.email}.
            </p>
          </footer>

          {/* Terms & conditions — forced onto a second page for print/PDF */}
          {hasTerms && (
            <section className="mt-12 border-t-4 border-double border-slate-200 pt-8 print:mt-0 print:border-t-0 print:pt-0 print:break-before-page">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                Terms &amp; Conditions
              </h2>
              <div className="mt-3 whitespace-pre-line text-xs leading-relaxed text-slate-700">
                {settings.terms}
              </div>
            </section>
          )}
        </article>
      </div>

      {/* Print sizing: A4 with conservative margins, no body background. */}
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          html, body { background: #ffffff !important; }
        }
      `}</style>
    </div>
  );
}
