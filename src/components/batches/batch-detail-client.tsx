"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ChevronLeft } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

interface Package { id: string; name: string; listPrice: number; earlyBirdPrice?: number }
interface Student {
  id: string; fullName: string; phone?: string; package?: Package;
  progressStage?: { name: string };
  payments: { amountDue: number; amountPaid: number; status: string }[];
}
interface Batch {
  id: string; name: string; startDate: string; endDate?: string;
  status: "ACTIVE" | "CLOSED"; notes?: string;
  scholarships: { scholarship: { id: string; name: string; shortCode: string } }[];
  packages: Package[];
  students: Student[];
}

export function BatchDetailClient({ batchId }: { batchId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [pkgOpen, setPkgOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/batches/${batchId}`)
      .then((r) => r.json())
      .then(setBatch)
      .finally(() => setLoading(false));
  }, [batchId]);

  async function addPackage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
          name: fd.get("name"),
          listPrice: fd.get("listPrice"),
          earlyBirdPrice: fd.get("earlyBirdPrice") || null,
          description: fd.get("description") || null,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const pkg = await res.json();
      setBatch((prev) => prev ? { ...prev, packages: [...prev.packages, pkg] } : prev);
      setPkgOpen(false);
      toast({ title: "Package added" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function closeBatch() {
    await fetch(`/api/batches/${batchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CLOSED" }),
    });
    setBatch((prev) => prev ? { ...prev, status: "CLOSED" } : prev);
    toast({ title: "Batch closed" });
  }

  async function deleteBatch() {
    await fetch(`/api/batches/${batchId}`, { method: "DELETE" });
    toast({ title: "Batch deleted" });
    router.push("/batches");
  }

  if (loading) return <div className="text-muted-foreground">Loading…</div>;
  if (!batch) return <div className="text-muted-foreground">Batch not found.</div>;

  const totalExpected = batch.students.flatMap((s) => s.payments).reduce((sum, p) => sum + p.amountDue, 0);
  const totalPaid = batch.students.flatMap((s) => s.payments).reduce((sum, p) => sum + p.amountPaid, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-bold">{batch.name}</h1>
        <Badge variant={batch.status === "ACTIVE" ? "default" : "secondary"}>{batch.status}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">Period</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm">{formatDate(batch.startDate)}{batch.endDate && ` → ${formatDate(batch.endDate)}`}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Revenue</CardTitle></CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{formatCurrency(totalPaid)}</p>
            <p className="text-xs text-muted-foreground">of {formatCurrency(totalExpected)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Students</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{batch.students.length}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Packages / Tiers</CardTitle>
          <Button size="sm" onClick={() => setPkgOpen(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add
          </Button>
        </CardHeader>
        <CardContent>
          {batch.packages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No packages yet.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {batch.packages.map((p) => (
                <div key={p.id} className="rounded-md border p-3 text-sm">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-muted-foreground">{formatCurrency(p.listPrice)}</p>
                  {p.earlyBirdPrice && (
                    <p className="text-xs text-green-600">EB: {formatCurrency(p.earlyBirdPrice)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Students ({batch.students.length})</CardTitle>
          <Link href={`/students?batchId=${batchId}`}>
            <Button size="sm" variant="outline">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {batch.students.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students in this batch.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batch.students.map((s) => {
                  const balance = s.payments.reduce((sum, p) => sum + (p.amountDue - p.amountPaid), 0);
                  return (
                    <TableRow key={s.id} className="cursor-pointer" onClick={() => router.push(`/students/${s.id}`)}>
                      <TableCell className="font-medium">{s.fullName}</TableCell>
                      <TableCell>{s.package?.name ?? "—"}</TableCell>
                      <TableCell>{s.progressStage?.name ?? "—"}</TableCell>
                      <TableCell className={balance > 0 ? "text-destructive font-medium" : "text-green-600"}>
                        {balance > 0 ? formatCurrency(balance) : "Paid"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        {batch.status === "ACTIVE" && (
          <Button variant="outline" onClick={closeBatch}>Close Batch</Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm"><Trash2 className="mr-1 h-4 w-4" />Delete Batch</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Batch</AlertDialogTitle>
              <AlertDialogDescription>This will permanently delete the batch and all associated packages. Students will be unlinked. This cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={deleteBatch} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Dialog open={pkgOpen} onOpenChange={setPkgOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Package</DialogTitle></DialogHeader>
          <form onSubmit={addPackage} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pkg-name">Name</Label>
              <Input id="pkg-name" name="name" placeholder="Basic / Standart / VIP" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pkg-price">List Price (UZS)</Label>
                <Input id="pkg-price" name="listPrice" type="number" min={0} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pkg-eb">Early Bird (UZS)</Label>
                <Input id="pkg-eb" name="earlyBirdPrice" type="number" min={0} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-desc">Description</Label>
              <Input id="pkg-desc" name="description" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPkgOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Adding…" : "Add Package"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
