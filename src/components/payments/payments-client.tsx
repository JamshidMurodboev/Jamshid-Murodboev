"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/utils";
import { CreditCard, AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface Payment {
  id: string; amountDue: number; amountPaid: number;
  dueDate: string; paidDate?: string;
  status: "PAID" | "PENDING" | "OVERDUE"; notes?: string;
  student: { id: string; fullName: string; batch: { id: string; name: string } };
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  PAID: "success", PENDING: "warning", OVERDUE: "destructive",
};

export function PaymentsClient() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");

  useEffect(() => {
    setLoading(true);
    const url = status === "all" ? "/api/payments" : `/api/payments?status=${status}`;
    fetch(url)
      .then((r) => r.json())
      .then(setPayments)
      .finally(() => setLoading(false));
  }, [status]);

  const overdue = payments.filter((p) => p.status === "OVERDUE");
  const paid = payments.filter((p) => p.status === "PAID");
  const pending = payments.filter((p) => p.status === "PENDING");
  const totalDue = payments.reduce((s, p) => s + p.amountDue, 0);
  const totalPaid = payments.reduce((s, p) => s + p.amountPaid, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payments</h1>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary bar */}
      {!loading && payments.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
      ) : payments.length === 0 ? (
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
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Student</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount Due</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Paid On</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => {
                const balance = p.amountDue - p.amountPaid;
                return (
                  <TableRow key={p.id} className={p.status === "OVERDUE" ? "bg-destructive/5" : ""}>
                    <TableCell>
                      <Link href={`/students/${p.student.id}`} className="font-medium hover:underline">
                        {p.student.fullName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.student.batch.name}</TableCell>
                    <TableCell>{formatDate(p.dueDate)}</TableCell>
                    <TableCell>{formatCurrency(p.amountDue)}</TableCell>
                    <TableCell>{formatCurrency(p.amountPaid)}</TableCell>
                    <TableCell className={balance > 0 ? "text-destructive font-medium" : "text-green-600 dark:text-green-400"}>
                      {balance > 0 ? formatCurrency(balance) : "—"}
                    </TableCell>
                    <TableCell>{p.paidDate ? formatDate(p.paidDate) : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge>
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
  color: "blue" | "green" | "amber" | "red";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    green: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
    red: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
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
        <div className="grid grid-cols-8 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-4 w-16" />)}
        </div>
      </div>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="border-t p-4">
          <div className="grid grid-cols-8 gap-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
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
