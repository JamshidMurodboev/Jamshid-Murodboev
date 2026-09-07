"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Batch {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  status: "ACTIVE" | "CLOSED";
  notes?: string;
  _count?: { students: number };
  scholarships: { scholarship: { id: string; name: string; shortCode: string } }[];
  packages: { id: string; name: string; listPrice: number }[];
}

export function BatchesClient() {
  const { toast } = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/batches")
      .then((r) => r.json())
      .then(setBatches)
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          startDate: fd.get("startDate"),
          endDate: fd.get("endDate") || null,
          notes: fd.get("notes") || null,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const batch = await res.json();
      setBatches((prev) => [batch, ...prev]);
      setOpen(false);
      toast({ title: "Batch created" });
    } catch {
      toast({ title: "Error", description: "Failed to create batch", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Batches</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Batch
        </Button>
      </div>

      {batches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No batches yet. Create your first batch to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {batches.map((batch) => (
            <Link key={batch.id} href={`/batches/${batch.id}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{batch.name}</CardTitle>
                    <Badge variant={batch.status === "ACTIVE" ? "default" : "secondary"}>
                      {batch.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {formatDate(batch.startDate)}
                    {batch.endDate && ` → ${formatDate(batch.endDate)}`}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {batch.scholarships.map(({ scholarship: s }) => (
                      <Badge key={s.id} variant="outline" className="text-xs">
                        {s.shortCode}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {batch._count?.students ?? 0} students
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Batch</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="e.g. September 2026 SH+TB" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" name="startDate" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" name="endDate" type="date" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={3} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
