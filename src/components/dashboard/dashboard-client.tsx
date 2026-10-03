"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Users, TrendingUp, CreditCard, AlertCircle, Trophy } from "lucide-react";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

interface BatchRevenue {
  id: string; name: string; status: string;
  studentCount: number; due: number; collected: number;
  outstanding: number; rate: number | null;
}

interface DashboardData {
  totalStudents: number;
  totalDue: number;
  totalCollected: number;
  outstanding: number;
  paymentStatusBreakdown: { paid: number; pending: number; overdue: number };
  winRate: number | null;
  studentsWithResult: number;
  won: number;
  packageBreakdown: Record<string, number>;
  batchRevenue: BatchRevenue[];
}

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"];

export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData).catch(console.error);
  }, []);

  if (!data) return <DashboardSkeleton />;

  const collectionPct = data.totalDue > 0
    ? Math.round((data.totalCollected / data.totalDue) * 100)
    : 0;

  const packageChartData = Object.entries(data.packageBreakdown).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Summary KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={data.totalStudents.toString()}
          icon={<Users className="h-4 w-4" />}
          color="blue"
        />
        <StatCard
          title="Revenue Collected"
          value={formatCurrency(data.totalCollected)}
          sub={`${collectionPct}% of ${formatCurrency(data.totalDue)} billed`}
          icon={<TrendingUp className="h-4 w-4" />}
          color="green"
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(data.outstanding)}
          sub="payments still due"
          icon={<CreditCard className="h-4 w-4" />}
          color={data.outstanding > 0 ? "red" : "green"}
          highlight={data.outstanding > 0}
        />
        <StatCard
          title="Win Rate"
          value={data.winRate !== null ? `${data.winRate}%` : "—"}
          sub={data.studentsWithResult > 0
            ? `${data.won} of ${data.studentsWithResult} results`
            : "No results yet"}
          icon={<Trophy className="h-4 w-4" />}
          color="purple"
        />
      </div>

      {/* Overdue alert */}
      {data.paymentStatusBreakdown.overdue > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            <strong>{data.paymentStatusBreakdown.overdue}</strong> overdue payment{data.paymentStatusBreakdown.overdue !== 1 ? "s" : ""} — check the Payments page.
          </span>
        </div>
      )}

      {/* Per-batch revenue table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Revenue by Batch</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.batchRevenue.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">No batches yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Batch</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead className="text-right">Billed</TableHead>
                  <TableHead className="text-right">Collected</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.batchRevenue.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{b.name}</span>
                        <Badge variant={b.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">
                          {b.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{b.studentCount}</TableCell>
                    <TableCell className="text-right">{b.due > 0 ? formatCurrency(b.due) : "—"}</TableCell>
                    <TableCell className="text-right text-green-600 dark:text-green-400 font-medium">
                      {b.collected > 0 ? formatCurrency(b.collected) : "—"}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${b.outstanding > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      {b.outstanding > 0 ? formatCurrency(b.outstanding) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {b.rate !== null ? (
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                          b.rate === 100 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                          b.rate >= 75 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                          b.rate >= 50 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}>{b.rate}%</span>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals row */}
                <TableRow className="border-t-2 bg-muted/20 font-semibold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{data.totalStudents}</TableCell>
                  <TableCell className="text-right">{formatCurrency(data.totalDue)}</TableCell>
                  <TableCell className="text-right text-green-600 dark:text-green-400">{formatCurrency(data.totalCollected)}</TableCell>
                  <TableCell className={`text-right ${data.outstanding > 0 ? "text-destructive" : ""}`}>
                    {data.outstanding > 0 ? formatCurrency(data.outstanding) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {data.totalDue > 0 ? (
                      <span className="text-xs font-semibold">{collectionPct}%</span>
                    ) : "—"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Students by Package chart */}
      {packageChartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Students by Package</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={packageChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {packageChartData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ title, value, sub, icon, highlight, color }: {
  title: string; value: string; sub?: string; icon: React.ReactNode;
  highlight?: boolean; color?: "blue" | "green" | "red" | "purple";
}) {
  const iconBg = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    green: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    red: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  }[color ?? "blue"];

  return (
    <Card className={highlight ? "border-destructive/50" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span className={`rounded-lg p-2 ${iconBg}`}>{icon}</span>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold ${highlight ? "text-destructive" : ""}`}>{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
              <Skeleton className="mt-2 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><Skeleton className="h-5 w-36" /></CardHeader>
        <CardContent className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    </div>
  );
}
