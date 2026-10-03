"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Search, Users, LayoutGrid, List, Download,
  FileSpreadsheet, FileText, Printer, X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { downloadCSV, downloadExcel, openPrintWindow } from "@/lib/export";

interface Batch { id: string; name: string }
interface Package { id: string; name: string; listPrice: number }
interface Scholarship { id: string; name: string; shortCode: string }
interface ProgressStage { id: string; name: string }
interface DiscountType { id: string; name: string }
interface Payment { amountDue: number; amountPaid: number; status: string }
interface Student {
  id: string; fullName: string; phone?: string; dob?: string; degree?: string;
  major?: string; priceCharged?: number; priceCurrency?: string;
  priceOriginalAmount?: number; notes?: string;
  joiningDate: string;
  finalResult?: string;
  batch: { id: string; name: string };
  package?: Package;
  progressStage?: ProgressStage;
  discountType?: DiscountType;
  scholarships: { scholarship: Scholarship }[];
  payments: Payment[];
}

const DEGREES = ["BACHELOR", "MASTER", "PHD", "EXCHANGE"];

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
  const [view, setView] = useState<"table" | "kanban">("table");
  const [formBatchId, setFormBatchId] = useState("");
  const [priceCurrency, setPriceCurrency] = useState("UZS");
  const [paidInFull, setPaidInFull] = useState(false);

  // Bulk action state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<"stage" | "batch" | "scholarship">("stage");
  const [bulkValue, setBulkValue] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);

  const loadStudents = useCallback(async () => {
    const params = new URLSearchParams();
    if (selectedBatch !== "all") params.set("batchId", selectedBatch);
    if (search) params.set("search", search);
    const res = await fetch(`/api/students?${params}`);
    const data = await res.json();
    setStudents(data);
    setSelectedIds(new Set());
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
    if (open) {
      setFormBatchId(selectedBatch !== "all" ? selectedBatch : "");
      setPriceCurrency("UZS");
      setPaidInFull(false);
    }
  }, [open, selectedBatch]);

  useEffect(() => {
    if (formBatchId) {
      fetch(`/api/batches/${formBatchId}`)
        .then((r) => r.json())
        .then((b) => setPackages(b.packages ?? []));
    } else {
      setPackages([]);
    }
  }, [formBatchId]);

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
          priceCharged: priceCurrency === "TL" ? (fd.get("priceChargedUZS") || null) : (fd.get("priceCharged") || null),
          priceCurrency,
          priceOriginalAmount: priceCurrency === "TL" ? (fd.get("priceCharged") || null) : null,
          discountTypeId: fd.get("discountTypeId") || null,
          progressStageId: fd.get("progressStageId") || null,
          notes: fd.get("notes") || null,
          scholarshipIds,
          paidInFull,
          paymentDate: paidInFull ? (fd.get("paymentDate") || null) : null,
          paymentNotes: paidInFull ? (fd.get("paymentNotes") || null) : null,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      await loadStudents();
      setOpen(false);
      toast({ title: "Student added successfully" });
    } catch {
      toast({ title: "Error", description: "Failed to add student", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleBulkApply() {
    if (!bulkValue || !selectedIds.size) return;
    setBulkSaving(true);
    try {
      const res = await fetch("/api/students/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: Array.from(selectedIds), action: bulkAction, value: bulkValue }),
      });
      if (!res.ok) throw new Error("Failed");
      const { count } = await res.json();
      await loadStudents();
      setBulkOpen(false);
      setBulkValue("");
      toast({ title: `Updated ${count} student${count !== 1 ? "s" : ""}` });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setBulkSaving(false);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map((s) => s.id)));
    }
  }

  // Export helpers
  function studentsToRows(list: Student[]) {
    return list.map((s) => ({
      "Full Name": s.fullName,
      "Phone": s.phone ?? "",
      "Date of Birth": s.dob ? s.dob.slice(0, 10) : "",
      "Batch": s.batch.name,
      "Package": s.package?.name ?? "",
      "Degree": s.degree ?? "",
      "Major": s.major ?? "",
      "Price (UZS)": s.priceCharged ?? "",
      "Currency": s.priceCurrency ?? "UZS",
      "TL Amount": s.priceOriginalAmount ?? "",
      "Discount": s.discountType?.name ?? "",
      "Stage": s.progressStage?.name ?? "",
      "Result": s.finalResult ?? "",
      "Scholarships": s.scholarships.map(({ scholarship: sc }) => sc.shortCode).join(", "),
      "Notes": s.notes ?? "",
    }));
  }

  function handleExportCSV() {
    const exportList = selectedIds.size > 0 ? students.filter((s) => selectedIds.has(s.id)) : students;
    downloadCSV(studentsToRows(exportList), "students");
  }

  function handleExportExcel() {
    const exportList = selectedIds.size > 0 ? students.filter((s) => selectedIds.has(s.id)) : students;
    downloadExcel(studentsToRows(exportList), "Students", "students");
  }

  function handleExportPDF() {
    const exportList = selectedIds.size > 0 ? students.filter((s) => selectedIds.has(s.id)) : students;
    const rows = exportList.map((s) => `
      <tr>
        <td>${s.fullName}</td>
        <td>${s.phone ?? ""}</td>
        <td>${s.batch.name}</td>
        <td>${s.package?.name ?? ""}</td>
        <td>${s.degree ?? ""}</td>
        <td>${s.progressStage?.name ?? ""}</td>
        <td>${s.finalResult ?? ""}</td>
        <td>${s.priceCharged ? s.priceCharged.toLocaleString() : ""} ${s.priceCurrency ?? "UZS"}</td>
        <td>${s.scholarships.map(({ scholarship: sc }) => sc.shortCode).join(", ")}</td>
      </tr>`).join("");
    openPrintWindow("Students Report", `
      <table>
        <thead><tr>
          <th>Name</th><th>Phone</th><th>Batch</th><th>Package</th><th>Degree</th>
          <th>Stage</th><th>Result</th><th>Price</th><th>Scholarships</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`);
  }

  const balance = (s: Student) => s.payments.reduce((sum, p) => sum + (p.amountDue - p.amountPaid), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Students</h1>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Export {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileText className="mr-2 h-4 w-4" /> Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <Printer className="mr-2 h-4 w-4" /> Print / Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Student
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
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
        <div className="flex rounded-md border overflow-hidden">
          <button
            onClick={() => setView("table")}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${
              view === "table" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <List className="h-3.5 w-3.5" /> Table
          </button>
          <button
            onClick={() => setView("kanban")}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${
              view === "kanban" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Kanban
          </button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : students.length === 0 ? (
        <EmptyState onAdd={() => setOpen(true)} />
      ) : view === "kanban" ? (
        <KanbanView students={students} stages={stages} balance={balance} onNavigate={(id) => router.push(`/students/${id}`)} />
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={students.length > 0 && selectedIds.size === students.length}
                    onChange={toggleSelectAll}
                  />
                </TableHead>
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
                  className={`cursor-pointer hover:bg-muted/30 transition-colors ${selectedIds.has(s.id) ? "bg-primary/5" : ""}`}
                  onClick={() => router.push(`/students/${s.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedIds.has(s.id)}
                      onChange={() => toggleSelect(s.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{s.fullName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.batch.name}</TableCell>
                  <TableCell>{s.package?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {s.scholarships.map(({ scholarship: sc }) => (
                        <Badge key={sc.id} variant="outline" className="text-xs">{sc.shortCode}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {s.progressStage ? (
                      <Badge variant="secondary" className="text-xs">{s.progressStage.name}</Badge>
                    ) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {s.payments.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className={`font-medium ${balance(s) > 0 ? "text-destructive" : "text-green-600 dark:text-green-400"}`}>
                        {balance(s) > 0 ? formatCurrency(balance(s)) : "Paid"}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Floating bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-4 inset-x-0 z-50 flex justify-center pointer-events-none px-4">
          <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-full border bg-background px-5 py-2.5 shadow-xl">
            <span className="text-sm font-semibold">{selectedIds.size} selected</span>
            <div className="h-4 w-px bg-border mx-1" />
            <Button size="sm" variant="outline" className="rounded-full h-7 text-xs"
              onClick={() => { setBulkAction("stage"); setBulkValue(""); setBulkOpen(true); }}>
              Assign Stage
            </Button>
            <Button size="sm" variant="outline" className="rounded-full h-7 text-xs"
              onClick={() => { setBulkAction("batch"); setBulkValue(""); setBulkOpen(true); }}>
              Move to Batch
            </Button>
            <Button size="sm" variant="outline" className="rounded-full h-7 text-xs"
              onClick={() => { setBulkAction("scholarship"); setBulkValue(""); setBulkOpen(true); }}>
              Add Scholarship
            </Button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-1 rounded-full p-1 hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Bulk action dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {bulkAction === "stage" ? "Assign Progress Stage" :
               bulkAction === "batch" ? "Move to Batch" : "Add Scholarship"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Apply to <strong>{selectedIds.size}</strong> selected student{selectedIds.size !== 1 ? "s" : ""}.
            </p>
            {bulkAction === "stage" && (
              <Select value={bulkValue} onValueChange={setBulkValue}>
                <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                <SelectContent>
                  {stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {bulkAction === "batch" && (
              <Select value={bulkValue} onValueChange={setBulkValue}>
                <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>
                  {batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {bulkAction === "scholarship" && (
              <Select value={bulkValue} onValueChange={setBulkValue}>
                <SelectTrigger><SelectValue placeholder="Select scholarship" /></SelectTrigger>
                <SelectContent>
                  {scholarships.map((s) => <SelectItem key={s.id} value={s.id}>{s.shortCode} — {s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button disabled={!bulkValue || bulkSaving} onClick={handleBulkApply}>
              {bulkSaving ? "Applying…" : "Apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Student Dialog */}
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
                <Select name="batchId" required value={formBatchId} onValueChange={setFormBatchId}>
                  <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                  <SelectContent>
                    {batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Package</Label>
                <Select name="packageId" disabled={packages.length === 0}>
                  <SelectTrigger><SelectValue placeholder={packages.length === 0 ? "Select batch first" : "Select package"} /></SelectTrigger>
                  <SelectContent>
                    {packages.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} — {p.listPrice.toLocaleString()} UZS</SelectItem>)}
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
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={priceCurrency} onValueChange={setPriceCurrency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UZS">UZS (Uzbek Sum)</SelectItem>
                      <SelectItem value="TL">TL (Turkish Lira)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priceCharged">{priceCurrency === "TL" ? "Amount in TL" : "Price Charged (UZS)"}</Label>
                  <Input id="priceCharged" name="priceCharged" type="number" min={0} />
                </div>
              </div>
              {priceCurrency === "TL" && (
                <div className="space-y-2">
                  <Label htmlFor="priceChargedUZS">UZS Equivalent (conversion)</Label>
                  <Input id="priceChargedUZS" name="priceChargedUZS" type="number" min={0} placeholder="Enter the UZS equivalent amount" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <Select name="discountTypeId">
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {discounts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
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
                {scholarships.map((s) => (
                  <label key={s.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="checkbox" name="scholarshipIds" value={s.id} className="rounded" />
                    {s.shortCode} — {s.name}
                  </label>
                ))}
              </div>
            </div>
            {/* Upfront payment */}
            <div className="rounded-md border p-4 space-y-3 bg-muted/30">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded h-4 w-4"
                  checked={paidInFull}
                  onChange={(e) => setPaidInFull(e.target.checked)}
                />
                <span className="text-sm font-medium">Paid in full (upfront payment before enrolling)</span>
              </label>
              {paidInFull && (
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="space-y-2">
                    <Label htmlFor="paymentDate">Payment Date *</Label>
                    <Input id="paymentDate" name="paymentDate" type="date" required={paidInFull} defaultValue={new Date().toISOString().slice(0, 10)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentNotes">Payment Notes</Label>
                    <Input id="paymentNotes" name="paymentNotes" placeholder="Receipt #, bank, etc." />
                  </div>
                </div>
              )}
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

function KanbanView({ students, stages, balance, onNavigate }: {
  students: Student[];
  stages: ProgressStage[];
  balance: (s: Student) => number;
  onNavigate: (id: string) => void;
}) {
  const unstaged = students.filter((s) => !s.progressStage);
  const columns = [
    ...stages.map((stage) => ({
      id: stage.id,
      name: stage.name,
      students: students.filter((s) => s.progressStage?.id === stage.id),
    })),
    ...(unstaged.length > 0 ? [{ id: "none", name: "No Stage", students: unstaged }] : []),
  ];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => (
        <div key={col.id} className="w-64 shrink-0">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{col.name}</h3>
            <Badge variant="secondary" className="text-xs">{col.students.length}</Badge>
          </div>
          <div className="space-y-2">
            {col.students.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                No students
              </div>
            ) : (
              col.students.map((s) => (
                <Card
                  key={s.id}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => onNavigate(s.id)}
                >
                  <CardContent className="p-3">
                    <p className="font-medium text-sm leading-tight">{s.fullName}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.batch.name}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex gap-1 flex-wrap">
                        {s.scholarships.map(({ scholarship: sc }) => (
                          <Badge key={sc.id} variant="outline" className="text-[10px] px-1 py-0">{sc.shortCode}</Badge>
                        ))}
                      </div>
                      {s.payments.length > 0 && (
                        <span className={`text-xs font-medium ${balance(s) > 0 ? "text-destructive" : "text-green-600 dark:text-green-400"}`}>
                          {balance(s) > 0 ? formatCurrency(balance(s)) : "Paid"}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Users className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-base font-semibold">No students yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">Add your first student to get started.</p>
      <Button className="mt-4" size="sm" onClick={onAdd}>
        <Plus className="mr-2 h-4 w-4" /> Add Student
      </Button>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-md border overflow-hidden">
      <div className="bg-muted/40 p-3">
        <div className="grid grid-cols-7 gap-4">
          {["", "Name", "Batch", "Package", "Scholarships", "Stage", "Balance"].map((h, i) => (
            <Skeleton key={i} className="h-4 w-16" />
          ))}
        </div>
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="border-t p-4">
          <div className="grid grid-cols-7 gap-4">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
