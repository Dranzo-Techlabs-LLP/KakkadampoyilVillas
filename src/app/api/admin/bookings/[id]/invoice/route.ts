import { NextRequest } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  HeightRule,
} from "docx";
import { guard, err } from "@/lib/api";
import {
  BIZ,
  fmtDate,
  fmtMoney,
  loadInvoice,
  todayLocal,
  type InvoiceData,
} from "@/app/admin/bookings/[id]/invoice/_lib";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const SLATE_900 = "0F172A";
const SLATE_600 = "475569";
const SLATE_400 = "94A3B8";
const SLATE_200 = "E2E8F0";
const EMERALD = "047857";
const AMBER = "B45309";
const RED = "DC2626";

function txt(text: string, opts: Partial<{ bold: boolean; color: string; size: number; italics: boolean }> = {}) {
  return new TextRun({
    text,
    bold: opts.bold,
    italics: opts.italics,
    color: opts.color,
    size: opts.size, // half-points; 22 = 11pt
  });
}

function p(children: TextRun[], opts: Partial<{ align: typeof AlignmentType[keyof typeof AlignmentType]; spacingAfter: number; spacingBefore: number; heading: typeof HeadingLevel[keyof typeof HeadingLevel] }> = {}) {
  return new Paragraph({
    alignment: opts.align,
    spacing: { before: opts.spacingBefore, after: opts.spacingAfter },
    heading: opts.heading,
    children,
  });
}

type BorderSide = { style: (typeof BorderStyle)[keyof typeof BorderStyle]; size: number; color: string };
type CellBorders = { top: BorderSide; bottom: BorderSide; left: BorderSide; right: BorderSide };

const noBorder: CellBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

const lightBottom: CellBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: SLATE_200 },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

function cell(children: Paragraph[], opts: Partial<{ widthPct: number; borders: CellBorders; align: "left" | "right" | "center" }> = {}) {
  return new TableCell({
    width: opts.widthPct ? { size: opts.widthPct, type: WidthType.PERCENTAGE } : undefined,
    borders: opts.borders ?? noBorder,
    children,
  });
}

function buildDocument(data: InvoiceData) {
  const { booking, payments, checkIn, checkOut, nights, total, ratePerNight, paid, balance } = data;
  const invoiceNumber = booking.reference;
  const issued = todayLocal();

  const sectionChildren: (Paragraph | Table)[] = [];

  // Header — two-column table: business identity (left) + invoice meta (right)
  sectionChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            cell(
              [
                p([txt(BIZ.name, { bold: true, color: EMERALD, size: 32 })]),
                p([txt(BIZ.address, { color: SLATE_600, size: 18 })], { spacingBefore: 40 }),
                p([txt(`${BIZ.phone} · ${BIZ.email}`, { color: SLATE_600, size: 18 })]),
                p([txt(BIZ.website, { color: SLATE_600, size: 18 })]),
              ],
              { widthPct: 65 }
            ),
            cell(
              [
                p([txt("INVOICE", { bold: true, color: SLATE_400, size: 20 })], { align: AlignmentType.RIGHT }),
                p([txt(invoiceNumber, { bold: true, color: SLATE_900, size: 24 })], { align: AlignmentType.RIGHT, spacingBefore: 40 }),
                p(
                  [
                    txt("Issued: ", { color: SLATE_600, size: 18 }),
                    txt(fmtDate(issued), { color: SLATE_900, size: 18 }),
                  ],
                  { align: AlignmentType.RIGHT, spacingBefore: 80 }
                ),
                ...(booking.status === "cancelled"
                  ? [p([txt("CANCELLED", { bold: true, color: RED, size: 20 })], { align: AlignmentType.RIGHT, spacingBefore: 80 })]
                  : []),
              ],
              { widthPct: 35 }
            ),
          ],
        }),
      ],
    })
  );

  // Separator
  sectionChildren.push(
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: SLATE_200 } },
      spacing: { after: 200 },
      children: [],
    })
  );

  // Bill to + Stay — two columns
  sectionChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            cell(
              [
                p([txt("BILL TO", { bold: true, color: SLATE_400, size: 16 })]),
                p([txt(booking.guest_name, { bold: true, color: SLATE_900, size: 22 })], { spacingBefore: 60 }),
                ...(booking.guest_phone ? [p([txt(booking.guest_phone, { color: SLATE_600, size: 20 })])] : []),
                ...(booking.guest_phone2 ? [p([txt(booking.guest_phone2, { color: SLATE_600, size: 20 })])] : []),
                ...(booking.guest_email ? [p([txt(booking.guest_email, { color: SLATE_600, size: 20 })])] : []),
              ],
              { widthPct: 50 }
            ),
            cell(
              [
                p([txt("STAY", { bold: true, color: SLATE_400, size: 16 })]),
                p(
                  [
                    txt("Villa: ", { color: SLATE_600, size: 20 }),
                    txt(booking.villaName, { bold: true, color: SLATE_900, size: 20 }),
                  ],
                  { spacingBefore: 60 }
                ),
                p([txt(`Check-in: ${fmtDate(checkIn)}`, { color: SLATE_900, size: 20 })]),
                p([txt(`Check-out: ${fmtDate(checkOut)}`, { color: SLATE_900, size: 20 })]),
                p([txt(`Nights: ${nights}`, { color: SLATE_900, size: 20 })]),
                p([
                  txt(
                    `Guests: ${booking.adults} adults${booking.children > 0 ? ` · ${booking.children} children` : ""}`,
                    { color: SLATE_900, size: 20 }
                  ),
                ]),
              ],
              { widthPct: 50 }
            ),
          ],
        }),
      ],
    })
  );

  sectionChildren.push(new Paragraph({ text: "", spacing: { after: 300 } }));

  // Line items
  const lineItemHeader = new TableRow({
    tableHeader: true,
    height: { value: 360, rule: HeightRule.ATLEAST },
    children: [
      cell([p([txt("DESCRIPTION", { bold: true, color: SLATE_400, size: 16 })])], { widthPct: 55, borders: lightBottom }),
      cell([p([txt("NIGHTS", { bold: true, color: SLATE_400, size: 16 })], { align: AlignmentType.RIGHT })], { widthPct: 12, borders: lightBottom }),
      cell([p([txt("RATE", { bold: true, color: SLATE_400, size: 16 })], { align: AlignmentType.RIGHT })], { widthPct: 16, borders: lightBottom }),
      cell([p([txt("AMOUNT", { bold: true, color: SLATE_400, size: 16 })], { align: AlignmentType.RIGHT })], { widthPct: 17, borders: lightBottom }),
    ],
  });

  const lineItemRow = new TableRow({
    children: [
      cell(
        [
          p([txt(`${booking.villaName} — Stay`, { bold: true, color: SLATE_900, size: 20 })]),
          p([txt(`${fmtDate(checkIn)} → ${fmtDate(checkOut)}`, { color: SLATE_600, size: 18 })]),
        ],
        { borders: lightBottom }
      ),
      cell([p([txt(String(nights), { color: SLATE_900, size: 20 })], { align: AlignmentType.RIGHT })], { borders: lightBottom }),
      cell(
        [p([txt(nights > 0 ? fmtMoney(ratePerNight) : "—", { color: SLATE_900, size: 20 })], { align: AlignmentType.RIGHT })],
        { borders: lightBottom }
      ),
      cell(
        [p([txt(fmtMoney(total), { bold: true, color: SLATE_900, size: 20 })], { align: AlignmentType.RIGHT })],
        { borders: lightBottom }
      ),
    ],
  });

  sectionChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [lineItemHeader, lineItemRow],
    })
  );

  // Totals — right-aligned mini-table
  sectionChildren.push(new Paragraph({ text: "", spacing: { after: 200 } }));
  sectionChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            cell([p([txt("", { size: 4 })])], { widthPct: 60 }),
            cell([p([txt("Subtotal", { color: SLATE_600, size: 20 })])], { widthPct: 22 }),
            cell([p([txt(fmtMoney(total), { color: SLATE_900, size: 20 })], { align: AlignmentType.RIGHT })], { widthPct: 18 }),
          ],
        }),
        new TableRow({
          children: [
            cell([p([txt("", { size: 4 })])], { widthPct: 60 }),
            cell([p([txt("Paid", { color: SLATE_600, size: 20 })])], { widthPct: 22 }),
            cell(
              [p([txt(`−${fmtMoney(paid)}`, { color: EMERALD, size: 20 })], { align: AlignmentType.RIGHT })],
              { widthPct: 18 }
            ),
          ],
        }),
        new TableRow({
          children: [
            cell([p([txt("", { size: 4 })])], { widthPct: 60, borders: { ...noBorder, top: { style: BorderStyle.SINGLE, size: 8, color: SLATE_200 } } }),
            cell(
              [p([txt("Balance due", { bold: true, color: SLATE_900, size: 22 })])],
              { widthPct: 22, borders: { ...noBorder, top: { style: BorderStyle.SINGLE, size: 8, color: SLATE_200 } } }
            ),
            cell(
              [
                p(
                  [txt(fmtMoney(balance), { bold: true, color: balance > 0 ? AMBER : EMERALD, size: 22 })],
                  { align: AlignmentType.RIGHT }
                ),
              ],
              { widthPct: 18, borders: { ...noBorder, top: { style: BorderStyle.SINGLE, size: 8, color: SLATE_200 } } }
            ),
          ],
        }),
      ],
    })
  );

  // Payments received
  if (payments.length > 0) {
    sectionChildren.push(
      new Paragraph({
        spacing: { before: 400, after: 100 },
        children: [txt("PAYMENTS RECEIVED", { bold: true, color: SLATE_400, size: 16 })],
      })
    );

    const paymentRows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          cell([p([txt("Date", { bold: true, color: SLATE_400, size: 16 })])], { widthPct: 20, borders: lightBottom }),
          cell([p([txt("Type", { bold: true, color: SLATE_400, size: 16 })])], { widthPct: 15, borders: lightBottom }),
          cell([p([txt("Method", { bold: true, color: SLATE_400, size: 16 })])], { widthPct: 15, borders: lightBottom }),
          cell([p([txt("Reference", { bold: true, color: SLATE_400, size: 16 })])], { widthPct: 30, borders: lightBottom }),
          cell([p([txt("Amount", { bold: true, color: SLATE_400, size: 16 })], { align: AlignmentType.RIGHT })], { widthPct: 20, borders: lightBottom }),
        ],
      }),
      ...payments.map(
        (pmt) =>
          new TableRow({
            children: [
              cell([p([txt(fmtDate(pmt.paidOn), { color: SLATE_900, size: 18 })])], { borders: lightBottom }),
              cell(
                [p([txt(pmt.kind.charAt(0).toUpperCase() + pmt.kind.slice(1), { color: SLATE_900, size: 18 })])],
                { borders: lightBottom }
              ),
              cell(
                [p([txt(pmt.method.charAt(0).toUpperCase() + pmt.method.slice(1), { color: SLATE_900, size: 18 })])],
                { borders: lightBottom }
              ),
              cell([p([txt(pmt.reference || "—", { color: SLATE_600, size: 18 })])], { borders: lightBottom }),
              cell(
                [
                  p(
                    [
                      txt(
                        `${pmt.kind === "refund" ? "−" : "+"}${fmtMoney(pmt.amount)}`,
                        { bold: true, color: pmt.kind === "refund" ? RED : EMERALD, size: 18 }
                      ),
                    ],
                    { align: AlignmentType.RIGHT }
                  ),
                ],
                { borders: lightBottom }
              ),
            ],
          })
      ),
    ];

    sectionChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: paymentRows,
      })
    );
  }

  // Notes
  if (booking.notes) {
    sectionChildren.push(
      new Paragraph({
        spacing: { before: 400, after: 100 },
        children: [txt("NOTES", { bold: true, color: SLATE_400, size: 16 })],
      })
    );
    for (const line of booking.notes.split(/\r?\n/)) {
      sectionChildren.push(p([txt(line, { color: SLATE_900, size: 20 })]));
    }
  }

  // Footer
  sectionChildren.push(new Paragraph({ text: "", spacing: { before: 600 } }));
  sectionChildren.push(
    new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: SLATE_200 } },
      spacing: { before: 200, after: 100 },
      alignment: AlignmentType.CENTER,
      children: [txt(`Thank you for choosing ${BIZ.name}.`, { bold: true, color: SLATE_600, size: 20 })],
    })
  );
  sectionChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        txt(`Questions about this invoice? Reach us at ${BIZ.phone} or ${BIZ.email}.`, { color: SLATE_400, size: 18 }),
      ],
    })
  );

  return new Document({
    creator: BIZ.name,
    title: `Invoice ${invoiceNumber}`,
    description: `Invoice for booking ${invoiceNumber} — ${booking.guest_name}`,
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 20 }, // 10pt
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 }, // 0.5 inch
          },
        },
        children: sectionChildren,
      },
    ],
  });
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return guard("bookings.view", async () => {
    const data = await loadInvoice(id);
    if (!data) return err("Not found", 404);

    const doc = buildDocument(data);
    const buffer = await Packer.toBuffer(doc);

    const filename = `invoice-${data.booking.reference}.docx`;
    return new Response(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  });
}
