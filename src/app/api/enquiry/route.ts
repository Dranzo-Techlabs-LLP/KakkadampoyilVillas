import { NextRequest } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";

export const runtime = "nodejs";

const enquirySchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(7),
  email: z.string().email(),
  villa: z.string().min(1),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  guests: z.string().min(1),
  requests: z.string().optional().default(""),
});

const TO_EMAIL = process.env.ENQUIRY_TO_EMAIL || "shinky777@gmail.com";

function buildHtml(d: z.infer<typeof enquirySchema>) {
  return `
  <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:640px;margin:0 auto;background:#FAFDF7;padding:32px;border-radius:16px;color:#0F1F12">
    <div style="background:linear-gradient(135deg,#1F4D2B,#3F7E54);color:#fff;padding:28px;border-radius:12px;margin-bottom:24px">
      <h1 style="margin:0;font-size:24px;font-weight:700">New Villa Enquiry</h1>
      <p style="margin:6px 0 0;opacity:.85;font-size:14px">Kakkadampoyil Villas · Website Form</p>
    </div>

    <table style="width:100%;border-collapse:collapse">
      <tbody>
        ${[
          ["Guest Name", d.name],
          ["Email", `<a href="mailto:${d.email}" style="color:#1F4D2B">${d.email}</a>`],
          ["Phone", `<a href="tel:${d.phone}" style="color:#1F4D2B">${d.phone}</a>`],
          ["Villa", d.villa],
          ["Check-in", d.checkIn],
          ["Check-out", d.checkOut],
          ["Guests", d.guests],
          ["Special Requests", d.requests || "—"],
        ]
          .map(
            ([k, v]) => `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #E8F0E1;width:160px;color:#3A2A1B;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:.05em">${k}</td>
            <td style="padding:10px 0;border-bottom:1px solid #E8F0E1;color:#0F1F12;font-size:14px">${v}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>

    <p style="margin-top:24px;font-size:12px;color:#6B4226">Reply to this email to respond directly to ${d.name}.</p>
  </div>`;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass) {
    console.warn(
      "[enquiry] SMTP credentials missing — logging instead of sending. Set SMTP_HOST/SMTP_USER/SMTP_PASS in .env.local."
    );
    console.log("[enquiry] payload:", data);
    return Response.json({
      ok: true,
      delivered: false,
      message:
        "Enquiry received and logged. Configure SMTP env vars to enable email delivery.",
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"Kakkadampoyil Villas" <${from}>`,
      to: TO_EMAIL,
      replyTo: `${data.name} <${data.email}>`,
      subject: `New Enquiry — ${data.name} · ${data.villa}`,
      text: `New enquiry from ${data.name} (${data.email}, ${data.phone})
Villa: ${data.villa}
Check-in: ${data.checkIn}
Check-out: ${data.checkOut}
Guests: ${data.guests}
Requests: ${data.requests || "—"}`,
      html: buildHtml(data),
    });

    return Response.json({ ok: true, delivered: true });
  } catch (err) {
    console.error("[enquiry] sendMail failed:", err);
    return Response.json(
      { ok: false, error: "Failed to send email. Please try again or contact us directly." },
      { status: 500 }
    );
  }
}
