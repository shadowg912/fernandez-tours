import { NextResponse } from "next/server";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { query } from "@/lib/db";
import { formatDateWithYear, formatMonthYear, formatMoney } from "@/lib/format";
import { LOGO_RECEIPT_PNG_BASE64 } from "@/lib/logo-receipt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const methodLabel: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
};

const frequencyLabel: Record<string, string> = {
  mensual: "Mensual",
  quincenal: "Quincenal",
  semanal: "Semanal",
};

const PAGE_WIDTH = 419.53;
const PAGE_HEIGHT = 595.28;

type StudentRow = {
  id: string;
  name: string;
  school: string | null;
  frequency: string;
  monthly_fee: number;
  route_name: string | null;
};

type PaymentRow = {
  id: string;
  date: Date | string;
  concept: string;
  amount: number;
  method: string;
  period: string | null;
};

/** WinAnsi (fuente estándar de PDF) no soporta emojis ni signos raros. */
function safeText(value: string): string {
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/\u2192/g, "->")
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return new NextResponse("Recibo no encontrado", { status: 404 });
  }

  const searchParams = new URL(request.url).searchParams;
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  if (!DATE_RE.test(from) || !DATE_RE.test(to) || from > to) {
    return new NextResponse("Periodo inválido", { status: 400 });
  }

  let students: StudentRow[];
  let payments: PaymentRow[];
  try {
    [students, payments] = await Promise.all([
      query<StudentRow>(
        `select s.id, s.name, s.school,
                s.frequency::text as frequency, s.monthly_fee,
                r.name as route_name
           from students s
           left join routes r on r.id = s.route_id
          where s.id = $1`,
        [id]
      ),
      query<PaymentRow>(
        `select id, date, concept, amount, method, period
           from payments
          where student_id = $1
            and status = 'completado'
            and date between $2 and $3
          order by date, created_at`,
        [id, from, to]
      ),
    ]);
  } catch {
    return new NextResponse("No se pudo generar el recibo", { status: 500 });
  }

  const student = students[0];
  if (!student) {
    return new NextResponse("Estudiante no encontrado", { status: 404 });
  }
  if (payments.length === 0) {
    return new NextResponse("No hay pagos completados en el periodo", { status: 404 });
  }

  const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const lastPaymentDate = toDateString(payments[payments.length - 1].date);
  const shortId = student.id.replace(/-/g, "").slice(0, 8).toUpperCase();
  const receiptNo = `REC-E-${shortId}-${from.replace(/-/g, "")}`;

  const doc = await PDFDocument.create();
  doc.setTitle(`${receiptNo} · Fernández Tours`);
  doc.setAuthor("Fernández Tours");
  doc.setSubject("Recibo de transporte estudiantil");

  // A5 vertical: mismo formato que los demás recibos.
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
  const right = PAGE_WIDTH - margin;
  const contentWidth = PAGE_WIDTH - margin * 2;
  const footerLine = 92;

  const drawHeader = (page: PDFPage) => {
    const logoSize = 56;
    page.drawImage(logo, {
      x: right - logoSize,
      y: PAGE_HEIGHT - margin - logoSize,
      width: logoSize,
      height: logoSize,
    });

    page.drawText(safeText("FERNÁNDEZ TOURS"), {
      x: margin,
      y: PAGE_HEIGHT - margin - 2,
      size: 10,
      font: bold,
      color: teal,
    });
    page.drawText(safeText("Recibo de transporte estudiantil"), {
      x: margin,
      y: PAGE_HEIGHT - margin - 26,
      size: 16,
      font: bold,
      color: dark,
    });
    page.drawText(receiptNo, {
      x: margin,
      y: PAGE_HEIGHT - margin - 44,
      size: 8,
      font,
      color: gray,
    });

    page.drawLine({
      start: { x: margin, y: PAGE_HEIGHT - margin - 68 },
      end: { x: right, y: PAGE_HEIGHT - margin - 68 },
      thickness: 0.7,
      color: line,
      dashArray: [2, 3],
    });
  };

  const pages: PDFPage[] = [];
  const addPage = () => {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawHeader(page);
    pages.push(page);
    return page;
  };

  let page = addPage();
  let y = PAGE_HEIGHT - margin - 88;

  const drawRow = (target: PDFPage, label: string, value: string, rowY: number) => {
    target.drawText(label, { x: margin, y: rowY, size: 9.5, font, color: gray });
    const fitted = fitText(value, bold, 9.5, contentWidth * 0.62);
    const valueWidth = bold.widthOfTextAtSize(fitted.text, fitted.size);
    target.drawText(fitted.text, {
      x: right - valueWidth,
      y: rowY,
      size: fitted.size,
      font: bold,
      color: dark,
    });
  };

  const divider = (target: PDFPage, rowY: number) => {
    target.drawLine({
      start: { x: margin, y: rowY },
      end: { x: right, y: rowY },
      thickness: 0.7,
      color: line,
      dashArray: [2, 3],
    });
  };

  // Datos del estudiante y del periodo.
  const rows: [string, string][] = [
    ["Emitido", safeText(formatMonthYear(lastPaymentDate))],
    ["Estudiante", safeText(student.name)],
  ];
  if (student.school) rows.push(["Colegio", safeText(student.school)]);
  if (student.route_name) rows.push(["Ruta", safeText(student.route_name)]);
  rows.push(["Frecuencia", frequencyLabel[student.frequency] ?? safeText(student.frequency)]);
  rows.push(["Tarifa", safeText(formatMoney(Number(student.monthly_fee)))]);
  rows.push([
    "Periodo",
    safeText(`${formatDateWithYear(from)} - ${formatDateWithYear(to)}`),
  ]);

  rows.forEach(([label, value], index) => {
    drawRow(page, label, value, y);
    if (index < rows.length - 1) y -= 16;
  });

  divider(page, y - 18);
  y -= 38;

  page.drawText("PAGOS REGISTRADOS", {
    x: margin,
    y,
    size: 9,
    font: bold,
    color: gray,
  });
  y -= 18;

  // Un bloque compacto por pago: fecha/método, concepto y periodo.
  payments.forEach((payment, index) => {
    const rowHeight = 38;
    if (y - rowHeight < footerLine + 24) {
      page = addPage();
      y = PAGE_HEIGHT - margin - 88;
      page.drawText("PAGOS REGISTRADOS (continuación)", {
        x: margin,
        y,
        size: 9,
        font: bold,
        color: gray,
      });
      y -= 18;
    }

    const paymentDate = safeText(formatDateWithYear(toDateString(payment.date)));
    const method = methodLabel[payment.method] ?? safeText(payment.method);

    page.drawText(paymentDate, { x: margin, y, size: 8, font, color: gray });

    const amountText = safeText(formatMoney(Number(payment.amount)));
    const amountWidth = bold.widthOfTextAtSize(amountText, 9);
    page.drawText(amountText, {
      x: right - amountWidth,
      y: y - 1,
      size: 9,
      font: bold,
      color: dark,
    });

    const fitted = fitText(safeText(payment.concept), font, 8.5, contentWidth);
    page.drawText(fitted.text, {
      x: margin,
      y: y - 12,
      size: fitted.size,
      font,
      color: dark,
    });

    const meta = payment.period
      ? `${method} · Periodo ${payment.period}`
      : method;
    page.drawText(safeText(meta), {
      x: margin,
      y: y - 23,
      size: 7.5,
      font,
      color: gray,
    });

    y -= rowHeight;
    if (index < payments.length - 1) {
      page.drawLine({
        start: { x: margin, y: y + 7 },
        end: { x: right, y: y + 7 },
        thickness: 0.5,
        color: line,
        dashArray: [2, 3],
      });
    }
  });

  // Resumen.
  const summaryHeight = 56;
  if (y - summaryHeight < footerLine + 16) {
    page = addPage();
    y = PAGE_HEIGHT - margin - 88;
  }

  const boxTop = y - 8;
  const boxBottom = boxTop - summaryHeight;
  page.drawRectangle({
    x: margin,
    y: boxBottom,
    width: contentWidth,
    height: summaryHeight,
    color: lightTeal,
  });

  page.drawText("Total pagado", {
    x: margin + 14,
    y: boxBottom + 34,
    size: 11,
    font: bold,
    color: gray,
  });
  const totalText = safeText(formatMoney(total));
  const totalWidth = bold.widthOfTextAtSize(totalText, 18);
  page.drawText(totalText, {
    x: right - 14 - totalWidth,
    y: boxBottom + 32,
    size: 18,
    font: bold,
    color: darkTeal,
  });

  page.drawText("Pagos registrados", {
    x: margin + 14,
    y: boxBottom + 14,
    size: 8.5,
    font,
    color: gray,
  });
  const countText = String(payments.length);
  const countWidth = bold.widthOfTextAtSize(countText, 9);
  page.drawText(countText, {
    x: right - 14 - countWidth,
    y: boxBottom + 14,
    size: 9,
    font: bold,
    color: dark,
  });

  // Pie en todas las páginas.
  pages.forEach((p, index) => {
    p.drawLine({
      start: { x: margin, y: footerLine },
      end: { x: right, y: footerLine },
      thickness: 0.7,
      color: line,
    });
    p.drawText(safeText("Incluye solo los pagos completados dentro del periodo seleccionado."), {
      x: margin,
      y: footerLine - 16,
      size: 8,
      font,
      color: gray,
    });
    p.drawText("Gracias por su pago.", {
      x: margin,
      y: footerLine - 29,
      size: 8,
      font,
      color: gray,
    });
    p.drawText(safeText("Fernández Tours · Recibo generado electrónicamente"), {
      x: margin,
      y: 40,
      size: 7.5,
      font,
      color: line,
    });

    if (pages.length > 1) {
      const pageText = `Página ${index + 1} de ${pages.length}`;
      const pageTextWidth = font.widthOfTextAtSize(pageText, 7.5);
      p.drawText(pageText, {
        x: right - pageTextWidth,
        y: 40,
        size: 7.5,
        font,
        color: line,
      });
    }
  });

  const bytes = await doc.save();

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="recibo-estudiante-${shortId}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
