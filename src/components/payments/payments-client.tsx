"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/utils";

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

  const overdue = payments.filter((p) => p.status === "OVERDUE").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          {overdue > 0 && (
            <p className="mt-1 text-sm text-destructive font-medium">{overdue} overdue payment{overdue !== 1 ? "s" : ""}</p>
          )}
        </div>
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

      {loading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : payments.length === 0 ? (
        <div className="rounded-md border py-12 text-center text-sm text-muted-foreground">
          No payments found.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
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
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/students/${p.student.id}`} className="font-medium hover:underline">
                      {p.student.fullName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.student.batch.name}</TableCell>
                  <TableCell>{formatDate(p.dueDate)}</TableCell>
                  <TableCell>{formatCurrency(p.amountDue)}</TableCell>
                  <TableCell>{formatCurrency(p.amountPaid)}</TableCell>
                  <TableCell className={balance > 0 ? "text-destructive font-medium" : "text-green-600"}>
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
      )}
    </div>
  );
}
