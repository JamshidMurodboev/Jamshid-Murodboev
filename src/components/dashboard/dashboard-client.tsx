"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { Users, TrendingUp, CreditCard, AlertCircle, Trophy } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";

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

const STATUS_COLORS = { Paid: "#22c55e", Pending: "#f59e0b", Overdue: "#ef4444" };
const PIE_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"];

export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [batchId, setBatchId] = useState("all");

  useEffect(() => {
    const url = batchId === "all" ? "/api/dashboard" : `/api/dashboard?batchId=${batchId}`;
    fetch(url).then((r) => r.json()).then(setData).catch(console.error);
  }, [batchId]);

  if (!data) return <DashboardSkeleton />;

  const paymentChartData = [
    { name: "Paid", value: data.paymentStatusBreakdown.paid },
    { name: "Pending", value: data.paymentStatusBreakdown.pending },
    { name: "Overdue", value: data.paymentStatusBreakdown.overdue },
  ];

  const packageChartData = Object.entries(data.packageBreakdown).map(([name, value]) => ({
    name, value,
  }));

  const collectionPct = data.totalExpected > 0
    ? Math.round((data.totalCollected / data.totalExpected) * 100)
    : 0;

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

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={data.totalStudents.toString()}
          icon={<Users className="h-4 w-4" />}
          color="blue"
        />
        <StatCard
          title="Revenue Collected"
          value={formatCurrency(data.totalCollected)}
          sub={`${collectionPct}% of ${formatCurrency(data.totalExpected)}`}
          icon={<TrendingUp className="h-4 w-4" />}
          color="green"
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(data.outstanding)}
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentChartData.every((d) => d.value === 0) ? (
              <EmptyChart message="No payments recorded yet" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={paymentChartData} barSize={48}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} width={30} />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted))" }}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {paymentChartData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Students by Package</CardTitle>
          </CardHeader>
          <CardContent>
            {packageChartData.length === 0 ? (
              <EmptyChart message="No students enrolled yet" />
            ) : (
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alert */}
      {data.paymentStatusBreakdown.overdue > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            <strong>{data.paymentStatusBreakdown.overdue}</strong> overdue payment{data.paymentStatusBreakdown.overdue !== 1 ? "s" : ""} — check the Payments page.
          </span>
        </div>
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

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-56" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
            <CardContent><Skeleton className="h-[220px] w-full" /></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
