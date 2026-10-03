"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/utils";
import { downloadCSV, downloadExcel, openPrintWindow } from "@/lib/export";
import { CreditCard, AlertCircle, CheckCircle2, Clock, Download, FileSpreadsheet, FileText, Printer, Gift } from "lucide-react";

interface StudentInfo {
  id: string;
  fullName: string;
  priceCharged?: number | null;
  batch: { id: string; name: string };
  package?: { id: string; name: string } | null;
  discountType?: { id: string; name: string; discountValue: number; isPercentage: boolean } | null;
  scholarships: { scholarship: { id: string; name: string; shortCode: string } }[];
}

interface PaymentRow {
  id: string;
  type: "payment" | "free";
  amountDue: number;
  amountPaid: number;
  dueDate: string | null;
  paidDate?: string | null;
  status: "PAID" | "PENDING" | "OVERDUE" | "FREE";
  notes?: string | null;
  student: StudentInfo;
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  PAID: "success", PENDING: "warning", OVERDUE: "destructive",
};

function discountLabel(student: StudentInfo): string {
  const parts: string[] = [];
  if (student.discountType) {
    const dt = student.discountType;
    const val = dt.isPercentage ? `${dt.discountValue}%` : formatCurrency(dt.discountValue);
    parts.push(`${dt.name} (${val})`);
  }
  if (student.scholarships.length > 0) {
    parts.push(student.scholarships.map((s) => s.scholarship.shortCode).join(", "));
  }
  return parts.join(" · ");
}

export function PaymentsClient() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");

  useEffect(() => {
    setLoading(true);
    const url = status === "all" ? "/api/payments" : `/api/payments?status=${status}`;
    fetch(url)
      .then((r) => r.json())
      .then(setRows)
      .finally(() => setLoading(false));
  }, [status]);

  const paymentRows = rows.filter((r) => r.type === "payment");
  const freeRows = rows.filter((r) => r.type === "free");
  const overdue = paymentRows.filter((p) => p.status === "OVERDUE");
  const paid = paymentRows.filter((p) => p.status === "PAID");
  const pending = paymentRows.filter((p) => p.status === "PENDING");
  const totalDue = paymentRows.reduce((s, p) => s + p.amountDue, 0);
  const totalPaid = paymentRows.reduce((s, p) => s + p.amountPaid, 0);

  function toExportRows() {
    return rows.map((p) => ({
      Student: p.student.fullName,
      Batch: p.student.batch.name,
      Package: p.student.package?.name ?? "",
      Discount: discountLabel(p.student),
      "Due Date": p.dueDate ? formatDate(p.dueDate) : "",
      "Amount Due": p.amountDue,
      Paid: p.amountPaid,
      Balance: p.amountDue - p.amountPaid,
      "Paid On": p.paidDate ? formatDate(p.paidDate) : "",
      Status: p.status,
      Notes: p.notes ?? "",
    }));
  }

  function handleExportCSV() { downloadCSV(toExportRows(), "payments"); }
  function handleExportExcel() { downloadExcel(toExportRows(), "Payments", "payments"); }
  function handleExportPDF() {
    const cols = ["Student", "Batch", "Package", "Discount", "Due Date", "Amount Due", "Paid", "Balance", "Paid On", "Status"];
    const exportRows = toExportRows();
    const tableHtml = `<table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${exportRows.map((r) => `<tr>${cols.map((c) => `<td>${(r as Record<string, unknown>)[c] ?? ""}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    openPrintWindow("Payments", tableHtml);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Payments</h1>
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="FREE">Free seats</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={rows.length === 0}>
                <Download className="mr-1.5 h-4 w-4" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileText className="mr-2 h-4 w-4" /> CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <Printer className="mr-2 h-4 w-4" /> Print / PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Summary tiles */}
      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <SummaryTile
            icon={<CreditCard className="h-4 w-4" />}
            label="Total Due"
            value={formatCurrency(totalDue)}
            color="blue"
          />
          <SummaryTile
            icon={<CheckCircle2 className="h-4 w-4" />}
            label={`Paid (${paid.length})`}
            value={formatCurrency(totalPaid)}
            color="green"
          />
          <SummaryTile
            icon={<Clock className="h-4 w-4" />}
            label={`Pending (${pending.length})`}
            value={formatCurrency(pending.reduce((s, p) => s + (p.amountDue - p.amountPaid), 0))}
            color="amber"
          />
          <SummaryTile
            icon={<AlertCircle className="h-4 w-4" />}
            label={`Overdue (${overdue.length})`}
            value={formatCurrency(overdue.reduce((s, p) => s + (p.amountDue - p.amountPaid), 0))}
            color="red"
          />
          <SummaryTile
            icon={<Gift className="h-4 w-4" />}
            label={`Free (${freeRows.length})`}
            value={`${freeRows.length} student${freeRows.length !== 1 ? "s" : ""}`}
            color="purple"
          />
        </div>
      )}

      {overdue.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            <strong>{overdue.length}</strong> overdue payment{overdue.length !== 1 ? "s" : ""} require attention.
          </span>
        </div>
      )}

      {loading ? (
        <PaymentsSkeleton />
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <CreditCard className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-base font-semibold">No payments found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {status !== "all" ? "Try switching the filter above." : "Add payments from a student's profile page."}
          </p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Student</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount Due</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Paid On</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => {
                const balance = p.amountDue - p.amountPaid;
                const discount = discountLabel(p.student);
                const isFree = p.type === "free";
                return (
                  <TableRow key={p.id} className={p.status === "OVERDUE" ? "bg-destructive/5" : isFree ? "bg-emerald-50/40 dark:bg-emerald-900/10" : ""}>
                    <TableCell>
                      <Link href={`/students/${p.student.id}`} className="font-medium hover:underline">
                        {p.student.fullName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.student.batch.name}</TableCell>
                    <TableCell className="text-sm">{p.student.package?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-sm">
                      {discount
                        ? <span className="text-violet-700 dark:text-violet-400">{discount}</span>
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>{p.dueDate ? formatDate(p.dueDate) : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>{formatCurrency(p.amountDue)}</TableCell>
                    <TableCell>{formatCurrency(p.amountPaid)}</TableCell>
                    <TableCell className={balance > 0 ? "text-destructive font-medium" : "text-green-600 dark:text-green-400"}>
                      {balance > 0 ? formatCurrency(balance) : "—"}
                    </TableCell>
                    <TableCell>{p.paidDate ? formatDate(p.paidDate) : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>
                      {isFree
                        ? <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400">FREE</Badge>
                        : <Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function SummaryTile({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string;
  color: "blue" | "green" | "amber" | "red" | "purple";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    green: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
    red: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
    purple: "bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400",
  }[color];
  return (
    <div className={`rounded-lg p-3 ${colors}`}>
      <div className="flex items-center gap-2 mb-1 opacity-80">{icon}<span className="text-xs font-medium">{label}</span></div>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}

function PaymentsSkeleton() {
  return (
    <div className="rounded-md border overflow-hidden">
      <div className="bg-muted/40 p-3">
        <div className="grid grid-cols-10 gap-4">
          {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-4 w-16" />)}
        </div>
      </div>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="border-t p-4">
          <div className="grid grid-cols-10 gap-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
