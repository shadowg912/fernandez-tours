import { NextResponse } from "next/server";
import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatDateWithYear, formatMonthYear, formatMoney } from "@/lib/format";
import { LOGO_RECEIPT_PNG_BASE64 } from "@/lib/logo-receipt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const methodLabel: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
};

type Row = {
  id: string;
  route_name: string;
  days_paid: number;
  fee_per_day: number;
  amount: number;
  payment_date: Date | string;
  method: string;
  observation: string | null;
};

/** WinAnsi (fuente estándar de PDF) no soporta emojis ni signos raros. */
function safeText(value: string): string {
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[^\x20-\x7E\u00A1-\u00FF]/g, " ")
    .trim();
}

function toDateString(value: Date | string): string {
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(value).slice(0, 10);
}

function fitText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): { text: string; size: number } {
  let current = size;
  while (current > 8 && font.widthOfTextAtSize(text, current) > maxWidth) {
    current -= 0.5;
  }
  if (font.widthOfTextAtSize(text, current) <= maxWidth) return { text, size: current };
  let trimmed = text;
  while (trimmed.length > 1 && font.widthOfTextAtSize(`${trimmed}...`, current) > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return { text: `${trimmed}...`, size: current };
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(" ").filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return new NextResponse("Recibo no encontrado", { status: 404 });
  }

  let rows: Row[];
  try {
    rows = await query<Row>(
      `select rp.id, rp.days_paid, rp.fee_per_day, rp.amount, rp.payment_date,
              rp.method, rp.observation, dr.name as route_name
         from route_payments rp
         join daily_routes dr on dr.id = rp.route_id
        where rp.id = $1`,
      [id]
    );
  } catch {
    return new NextResponse("No se pudo generar el recibo", { status: 500 });
  }

  const payment = rows[0];
  if (!payment) {
    return new NextResponse("Recibo no encontrado", { status: 404 });
  }

  const paymentDate = toDateString(payment.payment_date);
  const receiptNo = `REC-${payment.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;

  const doc = await PDFDocument.create();
  doc.setTitle(`${receiptNo} · Fernández Tours`);
  doc.setAuthor("Fernández Tours");
  doc.setSubject("Recibo de pago de ruta");

  // A5 vertical: formato pequeño, cómodo para imprimir o guardar.
  const page = doc.addPage([419.53, 595.28]);
  const { width, height } = page.getSize();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const logo = await doc.embedPng(Buffer.from(LOGO_RECEIPT_PNG_BASE64, "base64"));

  const dark = rgb(0.039, 0.114, 0.157);
  const teal = rgb(0.157, 0.612, 0.62);
  const darkTeal = rgb(0.118, 0.369, 0.396);
  const gray = rgb(0.42, 0.447, 0.502);
  const line = rgb(0.82, 0.84, 0.86);
  const lightTeal = rgb(0.902, 0.957, 0.957);

  const margin = 40;
  const right = width - margin;
  const contentWidth = width - margin * 2;

  const drawRow = (label: string, value: string, y: number) => {
    page.drawText(label, { x: margin, y, size: 10, font, color: gray });
    const fitted = fitText(value, bold, 10, contentWidth * 0.64);
    const valueWidth = bold.widthOfTextAtSize(fitted.text, fitted.size);
    page.drawText(fitted.text, {
      x: right - valueWidth,
      y,
      size: fitted.size,
      font: bold,
      color: dark,
    });
  };

  const divider = (y: number) => {
    page.drawLine({
      start: { x: margin, y },
      end: { x: right, y },
      thickness: 0.7,
      color: line,
      dashArray: [2, 3],
    });
  };

  // Encabezado con logo arriba a la derecha.
  const logoSize = 56;
  page.drawImage(logo, {
    x: right - logoSize,
    y: height - margin - logoSize,
    width: logoSize,
    height: logoSize,
  });

  page.drawText(safeText("FERNÁNDEZ TOURS"), {
    x: margin,
    y: height - margin - 2,
    size: 10,
    font: bold,
    color: teal,
  });
  page.drawText(safeText("Recibo de pago de ruta"), {
    x: margin,
    y: height - margin - 26,
    size: 18,
    font: bold,
    color: dark,
  });
  page.drawText(receiptNo, {
    x: margin,
    y: height - margin - 44,
    size: 9,
    font,
    color: gray,
  });

  divider(height - margin - 68);

  // Datos del recibo.
  let y = height - margin - 88;
  drawRow("Emitido", safeText(formatMonthYear(paymentDate)), y);
  y -= 17;
  drawRow("Fecha de pago", safeText(formatDateWithYear(paymentDate)), y);
  y -= 17;
  drawRow("Ruta", safeText(payment.route_name), y);

  divider(y - 16);

  // Detalle del pago.
  y -= 36;
  drawRow("Días pagados", String(payment.days_paid), y);
  y -= 17;
  drawRow("Tarifa por día", safeText(formatMoney(Number(payment.fee_per_day))), y);
  y -= 17;
  drawRow("Método", methodLabel[payment.method] ?? safeText(payment.method), y);

  // Total.
  const boxTop = y - 14;
  const boxHeight = 44;
  const boxBottom = boxTop - boxHeight;
  page.drawRectangle({
    x: margin,
    y: boxBottom,
    width: contentWidth,
    height: boxHeight,
    color: lightTeal,
  });
  page.drawText("Total", {
    x: margin + 14,
    y: boxBottom + 15,
    size: 11,
    font: bold,
    color: gray,
  });
  const totalText = safeText(formatMoney(Number(payment.amount)));
  const totalWidth = bold.widthOfTextAtSize(totalText, 18);
  page.drawText(totalText, {
    x: right - 14 - totalWidth,
    y: boxBottom + 13,
    size: 18,
    font: bold,
    color: darkTeal,
  });

  // Observación (si existe), con un máximo de 4 líneas.
  let cursor = boxBottom - 22;
  if (payment.observation) {
    const observation = safeText(payment.observation);
    if (observation) {
      page.drawText("Observación", {
        x: margin,
        y: cursor,
        size: 8.5,
        font: bold,
        color: gray,
      });
      cursor -= 13;
      const lines = wrapText(observation, font, 9, contentWidth).slice(0, 4);
      for (const text of lines) {
        page.drawText(text, { x: margin, y: cursor, size: 9, font, color: dark });
        cursor -= 12;
      }
    }
  }

  // Pie.
  const footerLine = 92;
  page.drawLine({
    start: { x: margin, y: footerLine },
    end: { x: right, y: footerLine },
    thickness: 0.7,
    color: line,
  });
  page.drawText(safeText("Los pagos se aplican a las fechas más antiguas primero."), {
    x: margin,
    y: footerLine - 16,
    size: 8,
    font,
    color: gray,
  });
  page.drawText("Gracias por su pago.", {
    x: margin,
    y: footerLine - 29,
    size: 8,
    font,
    color: gray,
  });
  page.drawText(safeText("Fernández Tours · Recibo generado electrónicamente"), {
    x: margin,
    y: 40,
    size: 7.5,
    font,
    color: line,
  });

  const bytes = await doc.save();
  const shortId = payment.id.replace(/-/g, "").slice(0, 8).toUpperCase();

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="recibo-ruta-${shortId}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
