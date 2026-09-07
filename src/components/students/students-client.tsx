"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

interface Batch { id: string; name: string }
interface Package { id: string; name: string; listPrice: number }
interface Scholarship { id: string; name: string; shortCode: string }
interface ProgressStage { id: string; name: string }
interface DiscountType { id: string; name: string }
interface Payment { amountDue: number; amountPaid: number; status: string }
interface Student {
  id: string; fullName: string; phone?: string; degree?: string;
  joiningDate: string;
  batch: { id: string; name: string };
  package?: Package;
  progressStage?: ProgressStage;
  scholarships: { scholarship: Scholarship }[];
  payments: Payment[];
}

const DEGREES = ["BACHELOR", "MASTER", "PHD", "EXCHANGE"];
const RESULTS = ["PENDING", "WON", "REJECTED"];

export function StudentsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [stages, setStages] = useState<ProgressStage[]>([]);
  const [discounts, setDiscounts] = useState<DiscountType[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedBatch, setSelectedBatch] = useState(searchParams.get("batchId") ?? "all");

  const loadStudents = useCallback(async () => {
    const params = new URLSearchParams();
    if (selectedBatch !== "all") params.set("batchId", selectedBatch);
    if (search) params.set("search", search);
    const res = await fetch(`/api/students?${params}`);
    const data = await res.json();
    setStudents(data);
  }, [selectedBatch, search]);

  useEffect(() => {
    Promise.all([
      fetch("/api/batches").then((r) => r.json()),
      fetch("/api/scholarships").then((r) => r.json()),
      fetch("/api/progress-stages").then((r) => r.json()),
      fetch("/api/discount-types").then((r) => r.json()),
    ]).then(([bs, ss, st, dt]) => {
      setBatches(bs);
      setScholarships(ss);
      setStages(st);
      setDiscounts(dt);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    loadStudents().finally(() => setLoading(false));
  }, [loadStudents]);

  useEffect(() => {
    if (open && selectedBatch !== "all") {
      fetch(`/api/batches/${selectedBatch}`)
        .then((r) => r.json())
        .then((b) => setPackages(b.packages ?? []));
    }
  }, [open, selectedBatch]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const scholarshipIds = Array.from(fd.getAll("scholarshipIds")) as string[];
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fd.get("fullName"),
          phone: fd.get("phone") || null,
          dob: fd.get("dob") || null,
          batchId: fd.get("batchId"),
          packageId: fd.get("packageId") || null,
          major: fd.get("major") || null,
          degree: fd.get("degree") || null,
          priceCharged: fd.get("priceCharged") || null,
          discountTypeId: fd.get("discountTypeId") || null,
          progressStageId: fd.get("progressStageId") || null,
          notes: fd.get("notes") || null,
          scholarshipIds,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      await loadStudents();
      setOpen(false);
      toast({ title: "Student added" });
    } catch {
      toast({ title: "Error", description: "Failed to add student", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const balance = (s: Student) => s.payments.reduce((sum, p) => sum + (p.amountDue - p.amountPaid), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Students</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Student
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={selectedBatch} onValueChange={setSelectedBatch}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All batches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {batches.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : students.length === 0 ? (
        <div className="rounded-md border py-12 text-center text-sm text-muted-foreground">
          No students found.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Scholarships</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => (
              <TableRow
                key={s.id}
                className="cursor-pointer"
                onClick={() => router.push(`/students/${s.id}`)}
              >
                <TableCell className="font-medium">{s.fullName}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{s.batch.name}</TableCell>
                <TableCell>{s.package?.name ?? "—"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {s.scholarships.map(({ scholarship: sc }) => (
                      <Badge key={sc.id} variant="outline" className="text-xs">{sc.shortCode}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{s.progressStage?.name ?? "—"}</TableCell>
                <TableCell>
                  {s.payments.length === 0 ? "—" : (
                    <span className={balance(s) > 0 ? "text-destructive font-medium" : "text-green-600"}>
                      {balance(s) > 0 ? formatCurrency(balance(s)) : "Paid"}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Student</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input id="fullName" name="fullName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone / Telegram</Label>
                <Input id="phone" name="phone" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" name="dob" type="date" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Batch *</Label>
                <Select name="batchId" required defaultValue={selectedBatch !== "all" ? selectedBatch : undefined}>
                  <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                  <SelectContent>
                    {batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Package</Label>
                <Select name="packageId">
                  <SelectTrigger><SelectValue placeholder="Select package" /></SelectTrigger>
                  <SelectContent>
                    {packages.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Degree</Label>
                <Select name="degree">
                  <SelectTrigger><SelectValue placeholder="Select degree" /></SelectTrigger>
                  <SelectContent>
                    {DEGREES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="major">Major</Label>
                <Input id="major" name="major" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceCharged">Price Charged (UZS)</Label>
                <Input id="priceCharged" name="priceCharged" type="number" min={0} />
              </div>
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select name="discountTypeId">
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    {discounts.filter((d) => d).map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Progress Stage</Label>
              <Select name="progressStageId">
                <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                <SelectContent>
                  {stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Scholarships Applying For</Label>
              <div className="flex flex-wrap gap-2">
                {scholarships.filter((s) => s).map((s) => (
                  <label key={s.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="checkbox" name="scholarshipIds" value={s.id} className="rounded" />
                    {s.shortCode} — {s.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={3} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Adding…" : "Add Student"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
