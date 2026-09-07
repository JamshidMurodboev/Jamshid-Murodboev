"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { Users, TrendingUp, CreditCard, AlertCircle, Trophy } from "lucide-react";

interface DashboardData {
  totalStudents: number;
  totalExpected: number;
  totalCollected: number;
  outstanding: number;
  paymentStatusBreakdown: { paid: number; pending: number; overdue: number };
  winRate: number | null;
  studentsWithResult: number;
  won: number;
  packageBreakdown: Record<string, number>;
  batches: { id: string; name: string }[];
}

export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [batchId, setBatchId] = useState("all");

  useEffect(() => {
    const url = batchId === "all" ? "/api/dashboard" : `/api/dashboard?batchId=${batchId}`;
    fetch(url)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, [batchId]);

  if (!data) return <div className="text-muted-foreground">Loading dashboard…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Select value={batchId} onValueChange={setBatchId}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All batches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {data.batches.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={data.totalStudents.toString()}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Revenue Collected"
          value={formatCurrency(data.totalCollected)}
          sub={`of ${formatCurrency(data.totalExpected)} expected`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(data.outstanding)}
          icon={<CreditCard className="h-4 w-4" />}
          highlight={data.outstanding > 0}
        />
        <StatCard
          title="Win Rate"
          value={data.winRate !== null ? `${data.winRate}%` : "—"}
          sub={data.studentsWithResult > 0 ? `${data.won} of ${data.studentsWithResult} results recorded` : "No results yet"}
          icon={<Trophy className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusRow label="Paid" count={data.paymentStatusBreakdown.paid} variant="success" />
            <StatusRow label="Pending" count={data.paymentStatusBreakdown.pending} variant="warning" />
            <StatusRow
              label="Overdue"
              count={data.paymentStatusBreakdown.overdue}
              variant="destructive"
              icon={<AlertCircle className="h-3 w-3" />}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Students by Package</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.packageBreakdown).length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet</p>
            ) : (
              Object.entries(data.packageBreakdown).map(([name, count]) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-sm">{name}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon, highlight }: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-destructive" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold ${highlight ? "text-destructive" : ""}`}>{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function StatusRow({ label, count, variant, icon }: {
  label: string;
  count: number;
  variant: "success" | "warning" | "destructive";
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-sm">
        {icon}
        {label}
      </span>
      <Badge variant={variant}>{count}</Badge>
    </div>
  );
}
