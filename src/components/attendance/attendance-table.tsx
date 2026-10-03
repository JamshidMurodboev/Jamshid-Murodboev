"use client";
import {
  useEffect, useState, useRef, useCallback, useTransition,
} from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Download, Check, X, AlertTriangle } from "lucide-react";
import { UZ } from "@/constants/uz";
import {
  exportCsv, exportExcel, exportPng, exportPdf,
  MarkValue, ExportLesson, ExportStudent, ExportMark,
  ICON, ICON_COLOR, lessonTitle,
} from "@/lib/attendance-export";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lesson { id: string; number: number; title: string | null; order: number }
interface Student { id: string; fullName: string }
interface MarkRecord {
  id?: string;
  lessonId: string;
  studentId: string;
  attendance: MarkValue;
  assignment: MarkValue;
}

type MarkField = "attendance" | "assignment";

function cycle(v: MarkValue): MarkValue {
  if (v === null) return "done";
  if (v === "done") return "missed";
  if (v === "missed") return "excused";
  return null;
}

function markKey(lessonId: string, studentId: string) {
  return `${lessonId}-${studentId}`;
}

// ─── Cell component ───────────────────────────────────────────────────────────

function MarkCell({
  value,
  isAdmin,
  pending,
  onClick,
  onKeyDown,
  tabIndex,
  dataCell,
}: {
  value: MarkValue;
  isAdmin: boolean;
  pending: boolean;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  tabIndex: number;
  dataCell: string;
}) {
  const icon = value ? ICON[value] : null;
  const color = value ? ICON_COLOR[value] : null;

  const base =
    "inline-flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold select-none transition-all";
  const interactive = isAdmin
    ? "cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-primary/40 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary"
    : "cursor-default";
  const opacityClass = pending ? "opacity-50" : "";

  return (
    <td className="border border-border/40 text-center px-1 py-1" style={{ minWidth: 40 }}>
      <button
        type="button"
        className={`${base} ${interactive} ${opacityClass}`}
        style={
          icon
            ? { background: `${color}20`, color: color!, border: `1.5px solid ${color}50` }
            : { border: "1.5px solid transparent" }
        }
        onClick={isAdmin ? onClick : undefined}
        onKeyDown={isAdmin ? onKeyDown : undefined}
        tabIndex={isAdmin ? tabIndex : -1}
        data-cell={dataCell}
        aria-label={
          value ? UZ.attendance[`mark${value.charAt(0).toUpperCase()}${value.slice(1)}` as "markDone"] : UZ.attendance.markEmpty
        }
      >
        {icon ?? <span className="text-muted-foreground/30 text-xs">·</span>}
      </button>
    </td>
  );
}

// ─── Export layout ────────────────────────────────────────────────────────────

function ExportLayout({
  lessons,
  students,
  marks,
  batchName,
  maxMissed,
  maxExcused,
  noteText,
}: {
  lessons: Lesson[];
  students: Student[];
  marks: Map<string, MarkRecord>;
  batchName: string;
  maxMissed: number;
  maxExcused: number;
  noteText?: string | null;
}) {
  const note = noteText ?? UZ.attendance.noteDefault(maxMissed, maxExcused);
  const HEADER_BG = "#4f5d3a";
  const HEADER_FG = "#ffffff";

  function studentCounts(s: Student) {
    let missed = 0, excused = 0;
    for (const l of lessons) {
      const m = marks.get(markKey(l.id, s.id));
      if (m?.attendance === "missed" || m?.assignment === "missed") missed++;
      if (m?.attendance === "excused" || m?.assignment === "excused") excused++;
    }
    return { missed, excused };
  }

  return (
    <div
      style={{
        width: 1920, height: 1080, background: "#faf7f2",
        fontFamily: "'Segoe UI', Arial, sans-serif",
        display: "flex", flexDirection: "column",
        padding: "40px 48px 32px", boxSizing: "border-box",
      }}
    >
      {/* Title */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a" }}>
          {UZ.attendance.title}
        </div>
        <div style={{ fontSize: 14, color: "#555", marginTop: 4 }}>{batchName}</div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <table
          style={{
            borderCollapse: "collapse", width: "100%",
            background: "#fff", borderRadius: 8,
            boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
            fontSize: 13,
          }}
        >
          <thead>
            {/* Lesson header row */}
            <tr>
              <th
                rowSpan={2}
                style={{
                  background: HEADER_BG, color: HEADER_FG, padding: "8px 10px",
                  textAlign: "center", border: "1px solid rgba(255,255,255,0.15)", width: 36,
                }}
              >№</th>
              <th
                rowSpan={2}
                style={{
                  background: HEADER_BG, color: HEADER_FG, padding: "8px 12px",
                  textAlign: "left", border: "1px solid rgba(255,255,255,0.15)", minWidth: 180,
                }}
              >Ism Familiya</th>
              {lessons.map((l) => (
                <th
                  key={l.id}
                  colSpan={2}
                  style={{
                    background: HEADER_BG, color: HEADER_FG,
                    padding: "8px 4px", textAlign: "center",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                >{lessonTitle(l)}</th>
              ))}
            </tr>
            {/* Sub-header row */}
            <tr>
              {lessons.map((l) => (
                [
                  <th key={`${l.id}-a`} style={{
                    background: HEADER_BG, color: HEADER_FG, padding: "5px 4px",
                    textAlign: "center", fontSize: 11,
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}>Davomat</th>,
                  <th key={`${l.id}-v`} style={{
                    background: HEADER_BG, color: HEADER_FG, padding: "5px 4px",
                    textAlign: "center", fontSize: 11,
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}>Vazifa</th>,
                ]
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => {
              const { missed, excused } = studentCounts(s);
              const expel = missed >= maxMissed || excused >= maxExcused;
              const warn = !expel && (missed === maxMissed - 1 || excused === maxExcused - 1);
              const rowBg = expel ? "#FEF2F2" : warn ? "#FFFBEB" : i % 2 === 0 ? "#fff" : "#f9f9f6";
              return (
                <tr key={s.id} style={{ background: rowBg }}>
                  <td style={{ textAlign: "center", padding: "6px", border: "1px solid #e5e5e5", color: "#666", fontSize: 12 }}>{i + 1}</td>
                  <td style={{ padding: "6px 10px", border: "1px solid #e5e5e5", fontWeight: 500 }}>
                    {s.fullName}
                    {expel && <span style={{ marginLeft: 6, fontSize: 11, color: "#d64545", fontWeight: 700 }}>⚠ Chiqarilishi kerak</span>}
                    {warn && <span style={{ marginLeft: 6, fontSize: 11, color: "#e0a526", fontWeight: 700 }}>! Ogohlantirish</span>}
                  </td>
                  {lessons.map((l) => {
                    const m = marks.get(markKey(l.id, s.id));
                    return (
                      [
                        <td key={`${l.id}-a`} style={{
                          textAlign: "center", padding: "4px 2px",
                          border: "1px solid #e5e5e5",
                          color: m?.attendance ? ICON_COLOR[m.attendance] : "#ccc",
                          fontWeight: 700, fontSize: 14,
                        }}>{m?.attendance ? ICON[m.attendance] : "·"}</td>,
                        <td key={`${l.id}-v`} style={{
                          textAlign: "center", padding: "4px 2px",
                          border: "1px solid #e5e5e5",
                          color: m?.assignment ? ICON_COLOR[m.assignment] : "#ccc",
                          fontWeight: 700, fontSize: 14,
                        }}>{m?.assignment ? ICON[m.assignment] : "·"}</td>,
                      ]
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend + Note + Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 14 }}>
        <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#444" }}>
          {(["done", "missed", "excused"] as const).map((v) => (
            <span key={v} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{
                display: "inline-flex", width: 20, height: 20, alignItems: "center",
                justifyContent: "center", borderRadius: 4,
                background: `${ICON_COLOR[v]}20`, color: ICON_COLOR[v],
                fontWeight: 700, fontSize: 13, border: `1.5px solid ${ICON_COLOR[v]}50`,
              }}>{ICON[v]}</span>
              {v === "done" ? UZ.attendance.legendDone : v === "missed" ? UZ.attendance.legendMissed : UZ.attendance.legendExcused}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "#888", fontStyle: "italic" }}>Jamshid.bilan</div>
      </div>
      <div style={{
        marginTop: 10, background: "#FEF2F2", border: "1.5px solid #d64545",
        borderRadius: 8, padding: "8px 14px", fontSize: 12, color: "#b91c1c", fontWeight: 500,
      }}>
        {note}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  batchId: string;
  batchName: string;
  isAdmin: boolean;
  maxMissed?: number;
  maxExcused?: number;
  noteText?: string | null;
}

export function AttendanceTable({
  batchId, batchName, isAdmin,
  maxMissed = 3, maxExcused = 4, noteText,
}: Props) {
  const { toast } = useToast();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Map<string, MarkRecord>>(new Map());
  const [loading, setLoading] = useState(true);
  const [pendingCells, setPendingCells] = useState<Set<string>>(new Set());

  const [editLesson, setEditLesson] = useState<Lesson | null>(null);
  const [deleteLessonId, setDeleteLessonId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const [, startTransition] = useTransition();

  // ── Load data ──────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [lessonsRes, marksRes, studentsRes] = await Promise.all([
        fetch(`/api/attendance/lessons?batchId=${batchId}`).then((r) => r.json()),
        fetch(`/api/attendance/marks?batchId=${batchId}`).then((r) => r.json()),
        fetch(`/api/students?batchId=${batchId}`).then((r) => r.json()),
      ]);
      setLessons(Array.isArray(lessonsRes) ? lessonsRes : []);
      setStudents(
        Array.isArray(studentsRes)
          ? studentsRes.map((s: { id: string; fullName: string }) => ({ id: s.id, fullName: s.fullName }))
          : []
      );
      const map = new Map<string, MarkRecord>();
      if (Array.isArray(marksRes)) {
        for (const m of marksRes) {
          map.set(markKey(m.lessonId, m.studentId), m);
        }
      }
      setMarks(map);
    } catch {
      toast({ title: UZ.attendance.loadError, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [batchId, toast]);

  useEffect(() => { load(); }, [load]);

  // ── Add lesson ─────────────────────────────────────────────────────────────

  async function addLesson() {
    try {
      const res = await fetch("/api/attendance/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId }),
      });
      if (!res.ok) throw new Error();
      const lesson = await res.json();
      setLessons((prev) => [...prev, lesson]);
    } catch {
      toast({ title: UZ.attendance.saveError, variant: "destructive" });
    }
  }

  // ── Edit lesson ────────────────────────────────────────────────────────────

  async function saveLesson() {
    if (!editLesson) return;
    try {
      const res = await fetch(`/api/attendance/lessons/${editLesson.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle || null }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setLessons((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      setEditLesson(null);
    } catch {
      toast({ title: UZ.attendance.saveError, variant: "destructive" });
    }
  }

  // ── Delete lesson ──────────────────────────────────────────────────────────

  async function deleteLesson(id: string) {
    try {
      await fetch(`/api/attendance/lessons/${id}`, { method: "DELETE" });
      setLessons((prev) => prev.filter((l) => l.id !== id));
      setDeleteLessonId(null);
    } catch {
      toast({ title: UZ.attendance.saveError, variant: "destructive" });
    }
  }

  // ── Cycle mark ─────────────────────────────────────────────────────────────

  function cycleMark(lessonId: string, studentId: string, field: MarkField) {
    if (!isAdmin) return;
    const key = markKey(lessonId, studentId);
    const current = marks.get(key);
    const newValue = cycle(current?.[field] ?? null);

    // Optimistic update
    startTransition(() => {
      setMarks((prev) => {
        const next = new Map(prev);
        const existing = next.get(key);
        next.set(key, {
          lessonId, studentId,
          attendance: existing?.attendance ?? null,
          assignment: existing?.assignment ?? null,
          ...existing,
          [field]: newValue,
        });
        return next;
      });
    });

    const cellKey = `${key}-${field}`;
    setPendingCells((p) => new Set(p).add(cellKey));

    fetch("/api/attendance/marks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId, studentId,
        attendance: field === "attendance" ? newValue : (marks.get(key)?.attendance ?? null),
        assignment: field === "assignment" ? newValue : (marks.get(key)?.assignment ?? null),
      }),
    })
      .then((r) => r.json())
      .then((saved: MarkRecord) => {
        setMarks((prev) => {
          const next = new Map(prev);
          next.set(key, saved);
          return next;
        });
      })
      .catch(() => {
        // Roll back
        startTransition(() => {
          setMarks((prev) => {
            const next = new Map(prev);
            const existing = next.get(key);
            if (existing) {
              next.set(key, { ...existing, [field]: current?.[field] ?? null });
            }
            return next;
          });
        });
        toast({ title: UZ.attendance.saveError, variant: "destructive" });
      })
      .finally(() => {
        setPendingCells((p) => {
          const next = new Set(p);
          next.delete(cellKey);
          return next;
        });
      });
  }

  // ── Keyboard navigation ────────────────────────────────────────────────────

  function handleCellKeyDown(
    e: React.KeyboardEvent,
    lessonId: string, studentId: string, field: MarkField,
    lessonIdx: number, studentIdx: number
  ) {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      cycleMark(lessonId, studentId, field);
      return;
    }
    const totalCols = lessons.length * 2;
    const colIdx = lessonIdx * 2 + (field === "attendance" ? 0 : 1);
    let nextLesson = lessonIdx;
    let nextField: MarkField = field;
    let nextStudent = studentIdx;

    if (e.key === "ArrowRight") {
      const nextCol = colIdx + 1;
      if (nextCol < totalCols) { nextLesson = Math.floor(nextCol / 2); nextField = nextCol % 2 === 0 ? "attendance" : "assignment"; }
    } else if (e.key === "ArrowLeft") {
      const nextCol = colIdx - 1;
      if (nextCol >= 0) { nextLesson = Math.floor(nextCol / 2); nextField = nextCol % 2 === 0 ? "attendance" : "assignment"; }
    } else if (e.key === "ArrowDown") {
      nextStudent = Math.min(studentIdx + 1, students.length - 1);
    } else if (e.key === "ArrowUp") {
      nextStudent = Math.max(studentIdx - 1, 0);
    } else return;

    e.preventDefault();
    const target = document.querySelector(
      `[data-cell="${lessons[nextLesson]?.id}-${students[nextStudent]?.id}-${nextField}"]`
    ) as HTMLElement | null;
    target?.focus();
  }

  // ── Per-student rule counts ────────────────────────────────────────────────

  function studentStatus(s: Student) {
    let missed = 0, excused = 0;
    for (const l of lessons) {
      const m = marks.get(markKey(l.id, s.id));
      if (m?.attendance === "missed" || m?.assignment === "missed") missed++;
      if (m?.attendance === "excused" || m?.assignment === "excused") excused++;
    }
    const expel = missed >= maxMissed || excused >= maxExcused;
    const warn = !expel && (missed === maxMissed - 1 || excused === maxExcused - 1);
    return { expel, warn };
  }

  // ── Export ─────────────────────────────────────────────────────────────────

  function buildExportData() {
    const exportLessons: ExportLesson[] = lessons.map((l) => ({ id: l.id, number: l.number, title: l.title }));
    const exportStudents: ExportStudent[] = students.map((s) => ({ id: s.id, fullName: s.fullName }));
    const exportMarks = new Map<string, ExportMark>();
    marks.forEach((v, k) => { exportMarks.set(k, v); });
    return { batchName, lessons: exportLessons, students: exportStudents, marks: exportMarks, maxMissed, maxExcused, noteText };
  }

  async function handleExport(type: "png" | "pdf" | "excel" | "csv") {
    setExporting(true);
    try {
      if (type === "csv") { exportCsv(buildExportData()); return; }
      if (type === "excel") { await exportExcel(buildExportData()); return; }
      if ((type === "png" || type === "pdf") && exportRef.current) {
        if (type === "png") await exportPng(exportRef.current);
        else await exportPdf(exportRef.current);
      }
    } catch {
      toast({ title: UZ.attendance.saveError, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }

  const note = noteText ?? UZ.attendance.noteDefault(maxMissed, maxExcused);

  // ── Loading / empty ────────────────────────────────────────────────────────

  if (loading) return <AttendanceSkeleton />;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-semibold">{UZ.attendance.title}</h2>
          <p className="text-sm text-muted-foreground">{batchName}</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button size="sm" variant="outline" onClick={addLesson}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />{UZ.attendance.addLesson}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" disabled={exporting || students.length === 0}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                {exporting ? UZ.attendance.exporting : UZ.attendance.exportMenu}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("png")}>{UZ.attendance.exportPng}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>{UZ.attendance.exportPdf}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("excel")}>{UZ.attendance.exportExcel}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv")}>{UZ.attendance.exportCsv}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* No lessons state */}
      {lessons.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">{UZ.attendance.noLessons}</p>
          {isAdmin && (
            <Button size="sm" variant="outline" className="mt-4" onClick={addLesson}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />{UZ.attendance.addLesson}
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Scrollable table */}
          <div className="overflow-auto rounded-lg border">
            <table className="border-collapse text-sm" style={{ minWidth: "100%" }}>
              <thead>
                {/* Lesson grouped headers */}
                <tr>
                  <th
                    rowSpan={2}
                    className="sticky left-0 z-20 bg-[#4f5d3a] text-white border border-white/20 text-center px-2 py-2"
                    style={{ minWidth: 36 }}
                  >{UZ.attendance.colNum}</th>
                  <th
                    rowSpan={2}
                    className="sticky left-9 z-20 bg-[#4f5d3a] text-white border border-white/20 text-left px-3 py-2"
                    style={{ minWidth: 160 }}
                  >{UZ.attendance.colName}</th>
                  {lessons.map((l) => (
                    <th
                      key={l.id}
                      colSpan={2}
                      className="bg-[#4f5d3a] text-white border border-white/20 text-center px-2 py-2 whitespace-nowrap"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>{lessonTitle(l)}</span>
                        {isAdmin && (
                          <div className="flex gap-0.5 ml-1">
                            <button
                              type="button"
                              className="rounded p-0.5 hover:bg-white/20 transition-colors"
                              onClick={() => { setEditLesson(l); setEditTitle(l.title ?? ""); }}
                            ><Pencil className="h-3 w-3" /></button>
                            <button
                              type="button"
                              className="rounded p-0.5 hover:bg-white/20 transition-colors text-red-300"
                              onClick={() => setDeleteLessonId(l.id)}
                            ><Trash2 className="h-3 w-3" /></button>
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
                {/* Sub-headers: Davomat / Vazifa per lesson */}
                <tr>
                  {lessons.map((l) => (
                    [
                      <th key={`${l.id}-a`} className="bg-[#4f5d3a] text-white border border-white/20 text-center px-1 py-1 text-xs font-normal" style={{ minWidth: 40 }}>
                        {UZ.attendance.colAttendance}
                      </th>,
                      <th key={`${l.id}-v`} className="bg-[#4f5d3a] text-white border border-white/20 text-center px-1 py-1 text-xs font-normal" style={{ minWidth: 40 }}>
                        {UZ.attendance.colAssignment}
                      </th>,
                    ]
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s, si) => {
                  const { expel, warn } = studentStatus(s);
                  return (
                    <tr
                      key={s.id}
                      className={
                        expel ? "bg-red-50 dark:bg-red-950/20"
                          : warn ? "bg-amber-50 dark:bg-amber-950/20"
                          : si % 2 === 0 ? "bg-background" : "bg-muted/30"
                      }
                    >
                      <td className="sticky left-0 z-10 border border-border/40 text-center px-2 py-1.5 text-muted-foreground text-xs font-medium bg-inherit">
                        {si + 1}
                      </td>
                      <td className="sticky left-9 z-10 border border-border/40 px-3 py-1.5 font-medium whitespace-nowrap bg-inherit" style={{ minWidth: 160 }}>
                        <div className="flex items-center gap-2">
                          {s.fullName}
                          {expel && (
                            <Badge variant="destructive" className="text-xs px-1.5 py-0 shrink-0">
                              <AlertTriangle className="h-3 w-3 mr-1" />{UZ.attendance.expelBadge}
                            </Badge>
                          )}
                          {warn && (
                            <Badge className="text-xs px-1.5 py-0 shrink-0 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300">
                              <AlertTriangle className="h-3 w-3 mr-1" />{UZ.attendance.warningBadge}
                            </Badge>
                          )}
                        </div>
                      </td>
                      {lessons.map((l, li) => {
                        const m = marks.get(markKey(l.id, s.id));
                        return (
                          [
                            <MarkCell
                              key={`${l.id}-${s.id}-a`}
                              value={m?.attendance ?? null}
                              isAdmin={isAdmin}
                              pending={pendingCells.has(`${markKey(l.id, s.id)}-attendance`)}
                              onClick={() => cycleMark(l.id, s.id, "attendance")}
                              onKeyDown={(e) => handleCellKeyDown(e, l.id, s.id, "attendance", li, si)}
                              tabIndex={si * lessons.length * 2 + li * 2}
                              dataCell={`${l.id}-${s.id}-attendance`}
                            />,
                            <MarkCell
                              key={`${l.id}-${s.id}-v`}
                              value={m?.assignment ?? null}
                              isAdmin={isAdmin}
                              pending={pendingCells.has(`${markKey(l.id, s.id)}-assignment`)}
                              onClick={() => cycleMark(l.id, s.id, "assignment")}
                              onKeyDown={(e) => handleCellKeyDown(e, l.id, s.id, "assignment", li, si)}
                              tabIndex={si * lessons.length * 2 + li * 2 + 1}
                              dataCell={`${l.id}-${s.id}-assignment`}
                            />,
                          ]
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-sm">
            {(["done", "missed", "excused"] as const).map((v) => (
              <span key={v} className="flex items-center gap-1.5">
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded font-bold text-xs"
                  style={{
                    background: `${ICON_COLOR[v]}20`, color: ICON_COLOR[v],
                    border: `1.5px solid ${ICON_COLOR[v]}50`,
                  }}
                >{ICON[v]}</span>
                <span className="text-muted-foreground">
                  {v === "done" ? UZ.attendance.legendDone : v === "missed" ? UZ.attendance.legendMissed : UZ.attendance.legendExcused}
                </span>
              </span>
            ))}
          </div>

          {/* Eslatma */}
          <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{note}</span>
          </div>
        </>
      )}

      {/* Off-screen export layout for PNG/PDF */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed", top: 0, left: "-9999px",
          width: 1920, height: 1080, pointerEvents: "none",
          fontFamily: "'Segoe UI', Arial, sans-serif",
        }}
      >
        <div ref={exportRef}>
          <ExportLayout
            lessons={lessons}
            students={students}
            marks={marks}
            batchName={batchName}
            maxMissed={maxMissed}
            maxExcused={maxExcused}
            noteText={noteText}
          />
        </div>
      </div>

      {/* Edit lesson dialog */}
      <Dialog open={!!editLesson} onOpenChange={(o) => !o && setEditLesson(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{UZ.attendance.editLesson}</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="lesson-title">{UZ.attendance.lessonTitle}</Label>
            <Input
              id="lesson-title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder={editLesson ? UZ.attendance.lessonDefault(editLesson.number) : ""}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLesson(null)}>{UZ.attendance.cancel}</Button>
            <Button onClick={saveLesson}>{UZ.attendance.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete lesson alert */}
      <AlertDialog open={!!deleteLessonId} onOpenChange={(o) => !o && setDeleteLessonId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{UZ.attendance.deleteConfirm}</AlertDialogTitle>
            <AlertDialogDescription>
              Bu darsga tegishli barcha belgilar o&apos;chiriladi. Bu amalni bekor qilib bo&apos;lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{UZ.attendance.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteLessonId && deleteLesson(deleteLessonId)}
              className="bg-destructive text-destructive-foreground"
            >{UZ.attendance.delete}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AttendanceSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="rounded-lg border overflow-hidden">
        <div className="bg-[#4f5d3a] p-3 flex gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-4 w-16 bg-white/20" />)}
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 p-3 border-t">
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-4 w-32" />
            {[...Array(4)].map((_, j) => <Skeleton key={j} className="h-4 w-8" />)}
          </div>
        ))}
      </div>
    </div>
  );
}
