"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, DollarSign, AlertTriangle, Users, Percent } from "lucide-react";

interface AnalyticsData {
  totalDue: number;
  totalPaid: number;
  totalOutstanding: number;
  collectionRate: number;
  overdueCount: number;
  totalStudents: number;
  revenueByBatch: { name: string; due: number; paid: number }[];
  revenueByMonth: { month: string; due: number; paid: number }[];
  revenueByPackage: { name: string; value: number }[];
  studentsByStage: { name: string; count: number }[];
  paymentStatus: { name: string; value: number }[];
}

const PIE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#06b6d4", "#ef4444"];
const STATUS_COLORS: Record<string, string> = {
  PAID: "#22c55e",
  PENDING: "#f59e0b",
  OVERDUE: "#ef4444",
};

function fmtCompact(n: number) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

function fmtMonth(ym: string) {
  const [y, m] = ym.split("-");
  const labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${labels[parseInt(m) - 1]} '${y.slice(2)}`;
}

const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color?: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg text-sm">
      {label && <p className="font-medium mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="text-xs">
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

const CountTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg text-sm">
      {label && <p className="font-medium mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-xs">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

function KPICard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub?: string;
  color: "blue" | "green" | "amber" | "red" | "purple";
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    green: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
    red: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
    purple: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  }[color];
  return (
    <Card>
      <CardContent className="pt-5 pb-4 px-5">
        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${colorMap} mb-3`}>
          {icon}
        </div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-sm font-medium text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AnalyticsSkeleton />;
  if (!data) return <div className="text-muted-foreground">Failed to load analytics.</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KPICard
          icon={<DollarSign className="h-4 w-4" />}
          label="Total Collected"
          value={formatCurrency(data.totalPaid)}
          sub={`of ${formatCurrency(data.totalDue)} due`}
          color="green"
        />
        <KPICard
          icon={<Percent className="h-4 w-4" />}
          label="Collection Rate"
          value={`${data.collectionRate}%`}
          sub="payments collected"
          color="blue"
        />
        <KPICard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Outstanding"
          value={formatCurrency(data.totalOutstanding)}
          sub="yet to be paid"
          color="amber"
        />
        <KPICard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Overdue Payments"
          value={data.overdueCount.toString()}
          sub="require attention"
          color="red"
        />
        <KPICard
          icon={<Users className="h-4 w-4" />}
          label="Active Students"
          value={data.totalStudents.toString()}
          sub="not archived"
          color="purple"
        />
      </div>

      {/* Revenue by Batch + Students by Stage */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue by Batch</CardTitle>
          </CardHeader>
          <CardContent>
            {data.revenueByBatch.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No payment data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.revenueByBatch} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={fmtCompact} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <RechartTooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="paid" name="Paid" fill="#22c55e" radius={[0, 3, 3, 0]} maxBarSize={18} />
                  <Bar dataKey="due" name="Total Due" fill="#3b82f6" radius={[0, 3, 3, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Students by Progress Stage</CardTitle>
          </CardHeader>
          <CardContent>
            {data.studentsByStage.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No stage data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.studentsByStage} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <RechartTooltip content={<CountTooltip />} />
                  <Bar dataKey="count" name="Students" fill="#a855f7" radius={[0, 3, 3, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Monthly Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {data.revenueByMonth.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No monthly data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.revenueByMonth} margin={{ left: 0, right: 8, top: 8, bottom: 4 }}>
                <defs>
                  <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <RechartTooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="due" name="Due" stroke="#3b82f6" fill="url(#colorDue)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="paid" name="Paid" stroke="#22c55e" fill="url(#colorPaid)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Revenue by Package + Payment Status */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue by Package</CardTitle>
          </CardHeader>
          <CardContent>
            {data.revenueByPackage.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No package data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.revenueByPackage}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {data.revenueByPackage.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartTooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Legend
                    formatter={(v) => <span className="text-xs">{v}</span>}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Payment Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {data.paymentStatus.every((d) => d.value === 0) ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No payments yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.paymentStatus.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {data.paymentStatus.filter((d) => d.value > 0).map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.name] ?? PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <RechartTooltip />
                  <Legend
                    formatter={(v) => <span className="text-xs">{v}</span>}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-lg border p-5 space-y-2">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-lg border p-5">
            <Skeleton className="h-5 w-36 mb-4" />
            <Skeleton className="h-52 w-full" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border p-5">
        <Skeleton className="h-5 w-48 mb-4" />
        <Skeleton className="h-52 w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-lg border p-5">
            <Skeleton className="h-5 w-40 mb-4" />
            <Skeleton className="h-48 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
