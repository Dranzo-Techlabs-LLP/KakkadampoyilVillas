import { q, q1 } from "@/lib/db";

// Business identity that prints at the top of every invoice. Update here.
export const BIZ = {
  name: "Kakkadampoyil Villas",
  address: "Foggy Mountain Park Road, Kakkadampoyil, Kerala",
  phone: "+91 85898 50641",
  email: "contact@kakkadampoyilvillas.com",
  website: "kakkadampoyilvillas.com",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtMoney(n: number | string | null | undefined) {
  const v = Number(n || 0);
  return "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  const s = String(d).slice(0, 10);
  const [y, m, day] = s.split("-");
  if (!y || !m || !day) return s;
  return `${day} ${MONTHS[Number(m) - 1]} ${y}`;
}

export function nightsBetween(checkIn: string, checkOut: string) {
  const a = new Date(checkIn + "T00:00:00");
  const b = new Date(checkOut + "T00:00:00");
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
}

export function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface InvoiceBooking {
  id: number;
  reference: string;
  villa_id: number;
  villaName: string;
  color: string;
  guest_name: string;
  guest_phone: string | null;
  guest_phone2: string | null;
  guest_email: string | null;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  status: string;
  total_amount: string | number;
  source: string | null;
  notes: string | null;
  cancel_reason: string | null;
}

export interface InvoicePayment {
  id: number;
  kind: "payment" | "refund";
  amount: string | number;
  method: string;
  reference: string | null;
  note: string | null;
  paidOn: string;
}

export interface InvoiceData {
  booking: InvoiceBooking;
  payments: InvoicePayment[];
  checkIn: string;
  checkOut: string;
  nights: number;
  total: number;
  ratePerNight: number;
  paid: number;
  balance: number;
}

export async function loadInvoice(id: string | number): Promise<InvoiceData | null> {
  const booking = await q1<InvoiceBooking>(
    `SELECT b.*, v.name AS villaName, v.color
       FROM bookings b
       JOIN villas v ON v.id = b.villa_id
      WHERE b.id = :id`,
    { id }
  );
  if (!booking) return null;

  const payments = await q<InvoicePayment>(
    `SELECT id, kind, amount, method, reference, note,
            paid_on AS paidOn
       FROM payments WHERE booking_id = :id ORDER BY paid_on, id`,
    { id }
  );

  const checkIn = String(booking.check_in).slice(0, 10);
  const checkOut = String(booking.check_out).slice(0, 10);
  const nights = nightsBetween(checkIn, checkOut);
  const total = Number(booking.total_amount) || 0;
  const ratePerNight = nights > 0 ? total / nights : total;
  const paid = payments.reduce(
    (s, p) => s + (p.kind === "payment" ? Number(p.amount) : -Number(p.amount)),
    0
  );
  const balance = total - paid;

  return { booking, payments, checkIn, checkOut, nights, total, ratePerNight, paid, balance };
}
