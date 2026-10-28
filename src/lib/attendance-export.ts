import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import ExcelJS from "exceljs";
import { TRANSLATIONS } from "@/constants/translations";

export type MarkValue = "done" | "missed" | "excused" | null;

export interface ExportLesson {
  id: string;
  number: number;
  title: string | null;
}

export interface ExportStudent {
  id: string;
  fullName: string;
}

export interface ExportMark {
  lessonId: string;
  studentId: string;
  attendance: MarkValue;
  assignment: MarkValue;
}

export interface ExportData {
  batchName: string;
  lessons: ExportLesson[];
  students: ExportStudent[];
  marks: Map<string, ExportMark>;
  maxMissed: number;
  maxExcused: number;
  noteText?: string | null;
  lang?: "uz" | "ru";
}

const ICON = { done: "✓", missed: "✕", excused: "!" } as const;
const ICON_COLOR = { done: "#3aa655", missed: "#d64545", excused: "#e0a526" } as const;

export function markLabel(v: MarkValue): string {
  if (!v) return "";
  return ICON[v];
}

function lessonTitle(l: ExportLesson, lang: "uz" | "ru" = "uz"): string {
  return l.title ?? TRANSLATIONS[lang].attendance.lessonDefault(l.number);
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ─── CSV ────────────────────────────────────────────────────────────────────

export function exportCsv(data: ExportData) {
  const { lessons, students, marks } = data;
  const lang = data.lang ?? "uz";
  const ta = TRANSLATIONS[lang].attendance;
  const headers = [
    ta.colNum,
    ta.colName,
    ...lessons.flatMap((l) => [
      `${lessonTitle(l, lang)} ${ta.colAttendance}`,
      `${lessonTitle(l, lang)} ${ta.colAssignment}`,
    ]),
  ];

  const rows = students.map((s, i) => [
    String(i + 1),
    s.fullName,
    ...lessons.flatMap((l) => {
      const m = marks.get(`${l.id}-${s.id}`);
      return [markLabel(m?.attendance ?? null), markLabel(m?.assignment ?? null)];
    }),
  ]);

  const lines = [headers, ...rows].map((r) =>
    r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
  );

  const bom = "﻿";
  const csv = bom + lines.join("\n");
  download(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    `davomat-${slugify(data.batchName)}-${todayStr()}.csv`
  );
}

// ─── Excel ───────────────────────────────────────────────────────────────────

const EXCEL_FILL: Record<string, ExcelJS.Fill> = {
  done: { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } },
  missed: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } },
  excused: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } },
};

export async function exportExcel(data: ExportData) {
  const { lessons, students, marks } = data;
  const lang = data.lang ?? "uz";
  const ta = TRANSLATIONS[lang].attendance;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Davomat");

  ws.columns = [
    { width: 5 } as ExcelJS.Column,
    { width: 30 } as ExcelJS.Column,
    ...lessons.flatMap(() => [{ width: 12 } as ExcelJS.Column, { width: 12 } as ExcelJS.Column]),
  ];

  // Row 1: merged lesson headers
  const headerRow1 = ws.addRow(["", "", ...lessons.flatMap((l) => [lessonTitle(l, lang), ""])]);
  headerRow1.height = 20;
  lessons.forEach((_, i) => {
    const col = 3 + i * 2;
    ws.mergeCells(1, col, 1, col + 1);
    const cell = headerRow1.getCell(col);
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F5D3A" } };
  });
  headerRow1.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow1.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F5D3A" } };
  headerRow1.getCell(2).font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow1.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F5D3A" } };

  // Row 2: sub-headers
  const headerRow2 = ws.addRow([
    ta.colNum,
    ta.colName,
    ...lessons.flatMap(() => [ta.colAttendance, ta.colAssignment]),
  ]);
  headerRow2.height = 18;
  headerRow2.eachCell((cell) => {
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F5D3A" } };
  });
  headerRow2.getCell(2).alignment = { horizontal: "left", vertical: "middle" };

  // Data rows
  students.forEach((s, i) => {
    const rowData = [
      i + 1,
      s.fullName,
      ...lessons.flatMap((l) => {
        const m = marks.get(`${l.id}-${s.id}`);
        return [markLabel(m?.attendance ?? null), markLabel(m?.assignment ?? null)];
      }),
    ];
    const row = ws.addRow(rowData);
    row.height = 17;
    if (i % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9FAFB" } };
      });
    }
    // color mark cells
    lessons.forEach((l, li) => {
      const m = marks.get(`${l.id}-${s.id}`);
      const aCol = 3 + li * 2;
      const vCol = 4 + li * 2;
      if (m?.attendance) {
        const cell = row.getCell(aCol);
        cell.fill = EXCEL_FILL[m.attendance];
        cell.font = { color: { argb: "FF000000" } };
        cell.alignment = { horizontal: "center" };
      } else {
        row.getCell(aCol).alignment = { horizontal: "center" };
      }
      if (m?.assignment) {
        const cell = row.getCell(vCol);
        cell.fill = EXCEL_FILL[m.assignment];
        cell.font = { color: { argb: "FF000000" } };
        cell.alignment = { horizontal: "center" };
      } else {
        row.getCell(vCol).alignment = { horizontal: "center" };
      }
    });
    row.getCell(1).alignment = { horizontal: "center" };
  });

  // Freeze panes: freeze first 2 cols + 2 header rows
  ws.views = [{ state: "frozen", xSplit: 2, ySplit: 2 }];

  // Legend
  ws.addRow([]);
  ws.addRow(["", "✓ = " + ta.legendDone]);
  ws.addRow(["", "✕ = " + ta.legendMissed]);
  ws.addRow(["", "! = " + ta.legendExcused]);
  ws.addRow([]);
  const noteText = data.noteText ?? ta.noteDefault(data.maxMissed, data.maxExcused);
  ws.addRow(["", noteText]);

  const buf = await wb.xlsx.writeBuffer();
  download(
    new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `davomat-${slugify(data.batchName)}-${todayStr()}.xlsx`
  );
}

// ─── PNG / PDF ────────────────────────────────────────────────────────────────

export async function exportPng(node: HTMLElement): Promise<void> {
  await waitForFonts();
  const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
  download(dataUrlToBlob(dataUrl), `davomat-${todayStr()}.png`);
}

export async function exportPdf(node: HTMLElement): Promise<void> {
  await waitForFonts();
  const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
  const img = new Image();
  img.src = dataUrl;
  await new Promise((r) => { img.onload = r; });

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const pdfRatio = pdfW / pdfH;

  let drawW = pdfW;
  let drawH = pdfH;
  if (imgRatio > pdfRatio) {
    drawH = pdfW / imgRatio;
  } else {
    drawW = pdfH * imgRatio;
  }
  const x = (pdfW - drawW) / 2;
  const y = (pdfH - drawH) / 2;

  pdf.addImage(dataUrl, "PNG", x, y, drawW, drawH);
  pdf.save(`davomat-${slugify("")}${todayStr()}.pdf`);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const bin = atob(data);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function waitForFonts(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  return document.fonts.ready.then(() => undefined);
}

export { ICON, ICON_COLOR, lessonTitle };
