"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Plus, Pencil, Trash2, GraduationCap, Phone, Calendar } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

interface Payment {
  id: string; amountDue: number; amountPaid: number; dueDate: string;
  paidDate?: string; status: "PAID" | "PENDING" | "OVERDUE"; notes?: string;
}
interface Student {
  id: string; fullName: string; phone?: string; dob?: string;
  major?: string; degree?: string; priceCharged?: number; notes?: string;
  finalResult: string; documentLinks: string[];
  batch: { id: string; name: string };
  package?: { id: string; name: string };
  progressStage?: { id: string; name: string };
  discountType?: { id: string; name: string };
  scholarships: { scholarship: { id: string; shortCode: string; name: string } }[];
  payments: Payment[];
  createdBy?: { name: string };
  updatedBy?: { name: string };
}
interface ProgressStage { id: string; name: string }
interface Scholarship { id: string; name: string; shortCode: string }

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  PAID: "success", PENDING: "warning", OVERDUE: "destructive",
};

export function StudentDetailClient({ studentId }: { studentId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [student, setStudent] = useState<Student | null>(null);
  const [stages, setStages] = useState<ProgressStage[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  async function loadStudent() {
    const res = await fetch(`/api/students/${studentId}`);
    if (res.ok) setStudent(await res.json());
  }

  useEffect(() => {
    Promise.all([
      loadStudent(),
      fetch("/api/progress-stages").then((r) => r.json()),
      fetch("/api/scholarships").then((r) => r.json()),
    ]).then(([, s, sc]) => {
      setStages(s);
      setScholarships(sc);
    }).finally(() => setLoading(false));
  }, [studentId]);

  async function updateStage(stageId: string) {
    await fetch(`/api/students/${studentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progressStageId: stageId }),
    });
    await loadStudent();
    toast({ title: "Stage updated" });
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const scholarshipIds = Array.from(fd.getAll("scholarshipIds")) as string[];
    const docLinks = (fd.get("documentLinks") as string).split("\n").map((l) => l.trim()).filter(Boolean);
    try {
      await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fd.get("fullName"),
          phone: fd.get("phone") || null,
          dob: fd.get("dob") || null,
          major: fd.get("major") || null,
          degree: fd.get("degree") || null,
          priceCharged: fd.get("priceCharged") || null,
          finalResult: fd.get("finalResult"),
          notes: fd.get("notes") || null,
          documentLinks: docLinks,
          scholarshipIds,
        }),
      });
      await loadStudent();
      setEditOpen(false);
      toast({ title: "Student updated" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function addPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          amountDue: fd.get("amountDue"),
          dueDate: fd.get("dueDate"),
          amountPaid: fd.get("amountPaid") || 0,
          paidDate: fd.get("paidDate") || null,
          notes: fd.get("notes") || null,
        }),
      });
      await loadStudent();
      setPayOpen(false);
      setEditingPayment(null);
      toast({ title: "Payment added" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function updatePayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingPayment) return;
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      await fetch(`/api/payments/${editingPayment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountDue: fd.get("amountDue"),
          amountPaid: fd.get("amountPaid"),
          dueDate: fd.get("dueDate"),
          paidDate: fd.get("paidDate") || null,
          notes: fd.get("notes") || null,
        }),
      });
      await loadStudent();
      setEditingPayment(null);
      setPayOpen(false);
      toast({ title: "Payment updated" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function deletePayment(id: string) {
    await fetch(`/api/payments/${id}`, { method: "DELETE" });
    await loadStudent();
    toast({ title: "Payment deleted" });
  }

  async function archiveStudent() {
    await fetch(`/api/students/${studentId}`, { method: "DELETE" });
    toast({ title: "Student archived" });
    router.push("/students");
  }

  if (loading) return <StudentDetailSkeleton />;
  if (!student) return <div className="text-muted-foreground">Student not found.</div>;

  const totalDue = student.payments.reduce((sum, p) => sum + p.amountDue, 0);
  const totalPaid = student.payments.reduce((sum, p) => sum + p.amountPaid, 0);

  const initials = student.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => router.back()}>
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to Students
      </Button>

      {/* Profile Card */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
              {initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{student.fullName}</h1>
                <Badge variant={student.finalResult === "WON" ? "success" : student.finalResult === "REJECTED" ? "destructive" : "secondary"}>
                  {student.finalResult}
                </Badge>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-3 text-sm text-muted-foreground">
                {student.degree && (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {student.degree}{student.major ? ` · ${student.major}` : ""}
                  </span>
                )}
                {student.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> {student.phone}
                  </span>
                )}
                {student.dob && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> {formatDate(student.dob)}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-xs">{student.batch.name}</Badge>
                {student.package && <Badge variant="outline" className="text-xs">{student.package.name}</Badge>}
                {student.scholarships.map(({ scholarship: s }) => (
                  <Badge key={s.id} variant="secondary" className="text-xs">{s.shortCode}</Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1 h-4 w-4" /> Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm"><Trash2 className="mr-1 h-4 w-4" />Archive</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Archive Student</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will hide the student from active lists. Payment history is preserved.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={archiveStudent}>Archive</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Quick Stage Selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">Stage:</span>
        <div className="flex flex-wrap gap-2">
          {stages.map((s) => (
            <button
              key={s.id}
              onClick={() => updateStage(s.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                student.progressStage?.id === s.id
                  ? "bg-primary text-primary-foreground"
                  : "border hover:bg-accent"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Batch" value={student.batch.name} />
            <Row label="Package" value={student.package?.name} />
            <Row label="Degree" value={student.degree} />
            <Row label="Major" value={student.major} />
            <Row label="DOB" value={formatDate(student.dob)} />
            <Row label="Phone" value={student.phone} />
            <Row label="Scholarships">
              <div className="flex flex-wrap gap-1">
                {student.scholarships.map(({ scholarship: s }) => (
                  <Badge key={s.id} variant="outline">{s.shortCode}</Badge>
                ))}
              </div>
            </Row>
            <Row label="Discount" value={student.discountType?.name} />
            <Row label="Price Charged" value={student.priceCharged ? formatCurrency(student.priceCharged) : undefined} />
            {student.notes && <Row label="Notes" value={student.notes} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Documents</CardTitle></CardHeader>
          <CardContent>
            {student.documentLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents linked.</p>
            ) : (
              <ul className="space-y-1">
                {student.documentLinks.map((link, i) => (
                  <li key={i}>
                    <a href={link} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-primary underline truncate block max-w-xs"
                    >{link}</a>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Payments</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Paid {formatCurrency(totalPaid)} of {formatCurrency(totalDue)}
            </p>
          </div>
          <Button size="sm" onClick={() => { setEditingPayment(null); setPayOpen(true); }}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add Payment
          </Button>
        </CardHeader>
        <CardContent>
          {student.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No installments scheduled.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount Due</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Paid On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.dueDate)}</TableCell>
                    <TableCell>{formatCurrency(p.amountDue)}</TableCell>
                    <TableCell>{formatCurrency(p.amountPaid)}</TableCell>
                    <TableCell>{p.paidDate ? formatDate(p.paidDate) : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7"
                          onClick={() => { setEditingPayment(p); setPayOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Payment</AlertDialogTitle>
                              <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deletePayment(p.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={payOpen} onOpenChange={(o) => { setPayOpen(o); if (!o) setEditingPayment(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPayment ? "Edit Payment" : "Add Payment"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={editingPayment ? updatePayment : addPayment} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amountDue">Amount Due (UZS)</Label>
                <Input id="amountDue" name="amountDue" type="number" min={0} required
                  defaultValue={editingPayment?.amountDue} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input id="dueDate" name="dueDate" type="date" required
                  defaultValue={editingPayment?.dueDate?.slice(0, 10)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amountPaid">Amount Paid (UZS)</Label>
                <Input id="amountPaid" name="amountPaid" type="number" min={0}
                  defaultValue={editingPayment?.amountPaid ?? 0} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paidDate">Paid Date</Label>
                <Input id="paidDate" name="paidDate" type="date"
                  defaultValue={editingPayment?.paidDate?.slice(0, 10)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-notes">Notes</Label>
              <Input id="pay-notes" name="notes" defaultValue={editingPayment?.notes ?? ""} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setPayOpen(false); setEditingPayment(null); }}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Student</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-fullName">Full Name</Label>
              <Input id="edit-fullName" name="fullName" defaultValue={student.fullName} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input id="edit-phone" name="phone" defaultValue={student.phone ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dob">DOB</Label>
                <Input id="edit-dob" name="dob" type="date" defaultValue={student.dob?.slice(0, 10) ?? ""} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-major">Major</Label>
                <Input id="edit-major" name="major" defaultValue={student.major ?? ""} />
              </div>
              <div className="space-y-2">
                <Label>Degree</Label>
                <Select name="degree" defaultValue={student.degree ?? ""}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["BACHELOR","MASTER","PHD","EXCHANGE"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price Charged</Label>
                <Input id="edit-price" name="priceCharged" type="number" min={0} defaultValue={student.priceCharged ?? ""} />
              </div>
              <div className="space-y-2">
                <Label>Final Result</Label>
                <Select name="finalResult" defaultValue={student.finalResult}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["PENDING","WON","REJECTED"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Scholarships</Label>
              <div className="flex flex-wrap gap-2">
                {scholarships.map((s) => (
                  <label key={s.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      name="scholarshipIds"
                      value={s.id}
                      defaultChecked={student.scholarships.some((ss) => ss.scholarship.id === s.id)}
                      className="rounded"
                    />
                    {s.shortCode}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-docs">Document Links (one per line)</Label>
              <Textarea
                id="edit-docs"
                name="documentLinks"
                rows={3}
                defaultValue={student.documentLinks.join("\n")}
                placeholder="https://drive.google.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea id="edit-notes" name="notes" rows={3} defaultValue={student.notes ?? ""} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StudentDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
            <div className="flex gap-2 mt-1">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4 space-y-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
        </div>
        <div className="rounded-lg border p-4 space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, children }: { label: string; value?: string | null; children?: React.ReactNode }) {
  if (!value && !children) return null;
  return (
    <div className="flex items-start gap-2">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span className="text-foreground">{children ?? value}</span>
    </div>
  );
}
