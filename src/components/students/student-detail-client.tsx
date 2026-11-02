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
import { useLanguage } from "@/context/lang-context";

interface Installment {
  id: string; amount: number; paidDate: string; notes?: string;
}
interface Payment {
  id: string; amountDue: number; amountPaid: number; dueDate: string;
  paidDate?: string; status: "PAID" | "PENDING" | "OVERDUE"; notes?: string;
  installments: Installment[];
}
interface Student {
  id: string; fullName: string; phone?: string; dob?: string;
  major?: string; degree?: string; priceCharged?: number;
  priceCurrency?: string; priceOriginalAmount?: number; notes?: string;
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
interface Package { id: string; name: string; listPrice: number }
interface DiscountType { id: string; name: string }

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  PAID: "success", PENDING: "warning", OVERDUE: "destructive",
};

export function StudentDetailClient({ studentId }: { studentId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [student, setStudent] = useState<Student | null>(null);
  const [stages, setStages] = useState<ProgressStage[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [discounts, setDiscounts] = useState<DiscountType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editPriceCurrency, setEditPriceCurrency] = useState("UZS");
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);
  const [addInstOpen, setAddInstOpen] = useState(false);
  const [addInstPaymentId, setAddInstPaymentId] = useState<string | null>(null);
  const [instAmount, setInstAmount] = useState("");
  const [instDate, setInstDate] = useState("");
  const [instNotes, setInstNotes] = useState("");

  async function loadStudent() {
    const res = await fetch(`/api/students/${studentId}`);
    if (res.ok) setStudent(await res.json());
  }

  useEffect(() => {
    Promise.all([
      loadStudent(),
      fetch("/api/progress-stages").then((r) => r.json()),
      fetch("/api/scholarships").then((r) => r.json()),
      fetch("/api/discount-types").then((r) => r.json()),
    ]).then(([, s, sc, dt]) => {
      setStages(s);
      setScholarships(sc);
      setDiscounts(dt);
    }).finally(() => setLoading(false));
  }, [studentId]);

  async function updateStage(stageId: string) {
    await fetch(`/api/students/${studentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progressStageId: stageId }),
    });
    await loadStudent();
    toast({ title: t.common.updated });
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
          packageId: fd.get("packageId") || null,
          discountTypeId: fd.get("discountTypeId") || null,
          progressStageId: fd.get("progressStageId") || null,
          priceCharged: editPriceCurrency === "TL" ? (fd.get("priceChargedUZS") || null) : (fd.get("priceCharged") || null),
          priceCurrency: editPriceCurrency,
          priceOriginalAmount: editPriceCurrency === "TL" ? (fd.get("priceCharged") || null) : null,
          finalResult: fd.get("finalResult"),
          notes: fd.get("notes") || null,
          documentLinks: docLinks,
          scholarshipIds,
        }),
      });
      await loadStudent();
      setEditOpen(false);
      toast({ title: t.common.updated });
    } catch {
      toast({ title: t.common.error, variant: "destructive" });
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
          notes: fd.get("notes") || null,
        }),
      });
      await loadStudent();
      setPayOpen(false);
      toast({ title: t.common.saved });
    } catch {
      toast({ title: t.common.error, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function addInstallment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!addInstPaymentId) return;
    setSaving(true);
    try {
      await fetch(`/api/payments/${addInstPaymentId}/installments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: instAmount, paidDate: instDate, notes: instNotes || null }),
      });
      await loadStudent();
      setAddInstOpen(false);
      setInstAmount(""); setInstDate(""); setInstNotes("");
      toast({ title: t.common.saved });
    } catch {
      toast({ title: t.common.error, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function deleteInstallment(paymentId: string, instId: string) {
    await fetch(`/api/payments/${paymentId}/installments/${instId}`, { method: "DELETE" });
    await loadStudent();
    toast({ title: t.common.deleted });
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
      toast({ title: t.common.updated });
    } catch {
      toast({ title: t.common.error, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function deletePayment(id: string) {
    await fetch(`/api/payments/${id}`, { method: "DELETE" });
    await loadStudent();
    toast({ title: t.common.deleted });
  }

  async function archiveStudent() {
    await fetch(`/api/students/${studentId}`, { method: "DELETE" });
    toast({ title: t.students.archiveStudent });
    router.push("/students");
  }

  function openEditDialog() {
    if (student) {
      setEditPriceCurrency(student.priceCurrency ?? "UZS");
      fetch(`/api/batches/${student.batch.id}`)
        .then((r) => r.json())
        .then((b) => setPackages(b.packages ?? []));
    }
    setEditOpen(true);
  }

  if (loading) return <StudentDetailSkeleton />;
  if (!student) return <div className="text-muted-foreground">{t.students.studentNotFound}</div>;

  const totalDue = student.payments.reduce((sum, p) => sum + p.amountDue, 0);
  const totalPaid = student.payments.reduce((sum, p) => sum + p.amountPaid, 0);

  const initials = student.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => router.back()}>
        <ChevronLeft className="mr-1 h-4 w-4" /> {t.common.back}
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
            <Button variant="outline" size="sm" onClick={openEditDialog}>
              <Pencil className="mr-1 h-4 w-4" /> {t.common.edit}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm"><Trash2 className="mr-1 h-4 w-4" />{t.students.archiveStudent}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t.students.archiveStudent}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t.common.confirm}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                  <AlertDialogAction onClick={archiveStudent}>{t.common.archive}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Quick Stage Selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">{t.students.progressStage}:</span>
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
          <CardHeader><CardTitle className="text-base">{t.settings.info}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label={t.batches.title} value={student.batch.name} />
            <Row label={t.students.package} value={student.package?.name} />
            <Row label={t.students.degree} value={student.degree} />
            <Row label={t.students.major} value={student.major} />
            <Row label={t.students.dob} value={formatDate(student.dob)} />
            <Row label={t.students.phone} value={student.phone} />
            <Row label={t.students.scholarships}>
              <div className="flex flex-wrap gap-1">
                {student.scholarships.map(({ scholarship: s }) => (
                  <Badge key={s.id} variant="outline">{s.shortCode}</Badge>
                ))}
              </div>
            </Row>
            <Row label={t.students.discountType} value={student.discountType?.name} />
            <Row label={t.students.price} value={
              student.priceCharged
                ? student.priceCurrency === "TL"
                  ? `${student.priceOriginalAmount?.toLocaleString()} TL ≈ ${formatCurrency(student.priceCharged)}`
                  : formatCurrency(student.priceCharged)
                : undefined
            } />
            {student.notes && <Row label={t.common.notes} value={student.notes} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t.batches.documents}</CardTitle></CardHeader>
          <CardContent>
            {student.documentLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.batches.noDocuments}</p>
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
            <CardTitle className="text-base">{t.payments.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {t.payments.paid} {formatCurrency(totalPaid)} of {formatCurrency(totalDue)}
            </p>
          </div>
          <Button size="sm" onClick={() => { setEditingPayment(null); setPayOpen(true); }}>
            <Plus className="mr-1 h-3.5 w-3.5" /> {t.common.add}
          </Button>
        </CardHeader>
        <CardContent>
          {student.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.payments.noInstallments}</p>
          ) : (
            <div className="space-y-3">
              {student.payments.map((p) => {
                const remaining = p.amountDue - p.amountPaid;
                const isExpanded = expandedPaymentId === p.id;
                return (
                  <div key={p.id} className="rounded-lg border overflow-hidden">
                    {/* Payment header row */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-muted/30">
                      <button
                        className="flex-1 flex items-center gap-3 text-left"
                        onClick={() => setExpandedPaymentId(isExpanded ? null : p.id)}
                      >
                        <div className="flex-1 grid grid-cols-4 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">{t.payments.dueDate}</p>
                            <p className="font-medium">{formatDate(p.dueDate)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{t.payments.amountDue}</p>
                            <p className="font-medium">{formatCurrency(p.amountDue)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{t.payments.paid}</p>
                            <p className="font-medium text-green-600 dark:text-green-400">{formatCurrency(p.amountPaid)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{t.payments.remaining ?? "Remaining"}</p>
                            <p className={`font-medium ${remaining > 0 ? "text-destructive" : "text-green-600 dark:text-green-400"}`}>
                              {remaining > 0 ? formatCurrency(remaining) : "✓"}
                            </p>
                          </div>
                        </div>
                        <Badge variant={STATUS_VARIANT[p.status]} className="shrink-0">{p.status}</Badge>
                      </button>
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                          onClick={() => { setAddInstPaymentId(p.id); setAddInstOpen(true); }}>
                          <Plus className="h-3 w-3 mr-1" />{t.payments.addInstallment ?? "Pay"}
                        </Button>
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
                              <AlertDialogTitle>{t.payments.deletePayment}</AlertDialogTitle>
                              <AlertDialogDescription>{t.payments.deleteConfirm}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deletePayment(p.id)}>{t.common.delete}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    {/* Installments (expanded) */}
                    {isExpanded && (
                      <div className="px-4 pb-3 pt-2 space-y-2 border-t bg-background">
                        {p.notes && (
                          <p className="text-xs text-muted-foreground italic">{p.notes}</p>
                        )}
                        {p.installments.length === 0 ? (
                          <p className="text-xs text-muted-foreground">{t.payments.noInstallmentsYet ?? "No partial payments recorded yet."}</p>
                        ) : (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-xs text-muted-foreground border-b">
                                <th className="text-left pb-1">{t.payments.paidOn}</th>
                                <th className="text-left pb-1">{t.payments.amountDue}</th>
                                <th className="text-left pb-1">{t.common.notes}</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {p.installments.map((inst) => (
                                <tr key={inst.id} className="border-b last:border-0">
                                  <td className="py-1.5">{formatDate(inst.paidDate)}</td>
                                  <td className="py-1.5 text-green-600 dark:text-green-400">{formatCurrency(inst.amount)}</td>
                                  <td className="py-1.5 text-muted-foreground">{inst.notes ?? "—"}</td>
                                  <td className="py-1.5">
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive">
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>{t.payments.deletePayment}</AlertDialogTitle>
                                          <AlertDialogDescription>{t.payments.deleteConfirm}</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => deleteInstallment(p.id, inst.id)}>{t.common.delete}</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Payment Plan Dialog */}
      <Dialog open={payOpen} onOpenChange={(o) => { setPayOpen(o); if (!o) setEditingPayment(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPayment ? t.payments.editPayment ?? t.common.edit : t.payments.addInstallments ?? t.common.add}</DialogTitle>
          </DialogHeader>
          <form onSubmit={editingPayment ? updatePayment : addPayment} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amountDue">{t.payments.amountDue}</Label>
                <Input id="amountDue" name="amountDue" type="number" min={0} required
                  defaultValue={editingPayment?.amountDue} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">{t.payments.dueDate}</Label>
                <Input id="dueDate" name="dueDate" type="date" required
                  defaultValue={editingPayment?.dueDate?.slice(0, 10)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-notes">{t.common.notes}</Label>
              <Input id="pay-notes" name="notes" defaultValue={editingPayment?.notes ?? ""} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setPayOpen(false); setEditingPayment(null); }}>{t.common.cancel}</Button>
              <Button type="submit" disabled={saving}>{saving ? t.common.loading : t.common.save}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Installment Dialog */}
      <Dialog open={addInstOpen} onOpenChange={(o) => { setAddInstOpen(o); if (!o) { setInstAmount(""); setInstDate(""); setInstNotes(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.payments.addInstallment ?? "Record Payment"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={addInstallment} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.payments.amountDue}</Label>
                <Input type="number" min={0} required value={instAmount} onChange={(e) => setInstAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t.payments.paidOn}</Label>
                <Input type="date" required value={instDate} onChange={(e) => setInstDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t.common.notes}</Label>
              <Input value={instNotes} onChange={(e) => setInstNotes(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddInstOpen(false)}>{t.common.cancel}</Button>
              <Button type="submit" disabled={saving}>{saving ? t.common.loading : t.common.save}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t.students.editStudent}</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-fullName">{t.students.fullName}</Label>
              <Input id="edit-fullName" name="fullName" defaultValue={student.fullName} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">{t.students.phone}</Label>
                <Input id="edit-phone" name="phone" defaultValue={student.phone ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dob">{t.students.dob}</Label>
                <Input id="edit-dob" name="dob" type="date" defaultValue={student.dob?.slice(0, 10) ?? ""} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-major">{t.students.major}</Label>
                <Input id="edit-major" name="major" defaultValue={student.major ?? ""} />
              </div>
              <div className="space-y-2">
                <Label>{t.students.degree}</Label>
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
                <Label>{t.students.package}</Label>
                <Select name="packageId" defaultValue={student.package?.id ?? ""}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    {packages.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.students.discountType}</Label>
                <Select name="discountTypeId" defaultValue={student.discountType?.id ?? ""}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    {discounts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t.students.progressStage}</Label>
              <Select name="progressStageId" defaultValue={student.progressStage?.id ?? ""}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.students.currency}</Label>
                  <Select value={editPriceCurrency} onValueChange={setEditPriceCurrency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UZS">{t.students.uzs}</SelectItem>
                      <SelectItem value="TL">{t.students.tl}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-price">{editPriceCurrency === "TL" ? t.students.tl : t.students.price}</Label>
                  <Input id="edit-price" name="priceCharged" type="number" min={0}
                    defaultValue={editPriceCurrency === "TL" ? (student.priceOriginalAmount ?? "") : (student.priceCharged ?? "")} />
                </div>
              </div>
              {editPriceCurrency === "TL" && (
                <div className="space-y-2">
                  <Label htmlFor="edit-priceUZS">{t.students.uzsEquivalent}</Label>
                  <Input id="edit-priceUZS" name="priceChargedUZS" type="number" min={0}
                    defaultValue={student.priceCharged ?? ""} />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.students.result}</Label>
                <Select name="finalResult" defaultValue={student.finalResult}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["PENDING","WON","REJECTED"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t.students.scholarships}</Label>
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
              <Label htmlFor="edit-docs">{t.batches.documentLinks}</Label>
              <Textarea
                id="edit-docs"
                name="documentLinks"
                rows={3}
                defaultValue={student.documentLinks.join("\n")}
                placeholder="https://drive.google.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">{t.common.notes}</Label>
              <Textarea id="edit-notes" name="notes" rows={3} defaultValue={student.notes ?? ""} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>{t.common.cancel}</Button>
              <Button type="submit" disabled={saving}>{saving ? t.common.loading : t.common.saveChanges}</Button>
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
