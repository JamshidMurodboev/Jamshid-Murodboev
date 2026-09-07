"use client";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";

interface Scholarship { id: string; name: string; shortCode: string; active: boolean }
interface DiscountType { id: string; name: string; discountValue: number; isPercentage: boolean; active: boolean }
interface ProgressStage { id: string; name: string; order: number }
interface AppUser { id: string; name: string; email: string; role: string; telegramChatId?: string }

export function SettingsClient({ role }: { role: string }) {
  const isAdmin = role === "ADMIN";
  const { toast } = useToast();

  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [discounts, setDiscounts] = useState<DiscountType[]>([]);
  const [stages, setStages] = useState<ProgressStage[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [alertDays, setAlertDays] = useState("3");

  const [scholarshipOpen, setScholarshipOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [stageOpen, setStageOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const [editingScholarship, setEditingScholarship] = useState<Scholarship | null>(null);
  const [editingDiscount, setEditingDiscount] = useState<DiscountType | null>(null);
  const [editingStage, setEditingStage] = useState<ProgressStage | null>(null);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([
      fetch("/api/scholarships").then((r) => r.json()),
      fetch("/api/discount-types").then((r) => r.json()),
      fetch("/api/progress-stages").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([s, d, st, u, settings]) => {
      setScholarships(s);
      setDiscounts(d);
      setStages(st);
      setUsers(u);
      setAlertDays(settings.telegram_alert_days_before ?? "3");
    });
  }, [isAdmin]);

  async function saveAlertDays() {
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegram_alert_days_before: alertDays }),
    });
    toast({ title: "Settings saved" });
  }

  async function handleScholarship(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body = { name: fd.get("name"), shortCode: fd.get("shortCode") };
    const url = editingScholarship ? `/api/scholarships/${editingScholarship.id}` : "/api/scholarships";
    const method = editingScholarship ? "PATCH" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const updated = await fetch("/api/scholarships").then((r) => r.json());
    setScholarships(updated);
    setScholarshipOpen(false);
    setEditingScholarship(null);
    setSaving(false);
    toast({ title: editingScholarship ? "Scholarship updated" : "Scholarship added" });
  }

  async function deactivateScholarship(id: string) {
    await fetch(`/api/scholarships/${id}`, { method: "DELETE" });
    setScholarships((prev) => prev.map((s) => s.id === id ? { ...s, active: false } : s));
    toast({ title: "Scholarship deactivated" });
  }

  async function handleDiscount(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name"),
      description: fd.get("description") || null,
      discountValue: fd.get("discountValue"),
      isPercentage: fd.get("isPercentage") === "true",
    };
    const url = editingDiscount ? `/api/discount-types/${editingDiscount.id}` : "/api/discount-types";
    const method = editingDiscount ? "PATCH" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const updated = await fetch("/api/discount-types").then((r) => r.json());
    setDiscounts(updated);
    setDiscountOpen(false);
    setEditingDiscount(null);
    setSaving(false);
    toast({ title: "Discount type saved" });
  }

  async function deactivateDiscount(id: string) {
    await fetch(`/api/discount-types/${id}`, { method: "DELETE" });
    setDiscounts((prev) => prev.map((d) => d.id === id ? { ...d, active: false } : d));
    toast({ title: "Discount type deactivated" });
  }

  async function handleStage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body = { name: fd.get("name") };
    const url = editingStage ? `/api/progress-stages/${editingStage.id}` : "/api/progress-stages";
    const method = editingStage ? "PATCH" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const updated = await fetch("/api/progress-stages").then((r) => r.json());
    setStages(updated);
    setStageOpen(false);
    setEditingStage(null);
    setSaving(false);
    toast({ title: "Stage saved" });
  }

  async function deleteStage(id: string) {
    await fetch(`/api/progress-stages/${id}`, { method: "DELETE" });
    setStages((prev) => prev.filter((s) => s.id !== id));
    toast({ title: "Stage deleted" });
  }

  async function handleUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      name: fd.get("name"), email: fd.get("email"),
      role: fd.get("role"), telegramChatId: fd.get("telegramChatId") || null,
    };
    if (fd.get("password")) body.password = fd.get("password");
    const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
    const method = editingUser ? "PATCH" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const updated = await fetch("/api/users").then((r) => r.json());
    setUsers(updated);
    setUserOpen(false);
    setEditingUser(null);
    setSaving(false);
    toast({ title: editingUser ? "User updated" : "User created" });
  }

  async function deleteUser(id: string) {
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u.id !== id));
    toast({ title: "User deleted" });
  }

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Settings are available to admins only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Tabs defaultValue="scholarships">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="scholarships">Scholarships</TabsTrigger>
          <TabsTrigger value="discounts">Discount Types</TabsTrigger>
          <TabsTrigger value="stages">Progress Stages</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="telegram">Telegram</TabsTrigger>
        </TabsList>

        {/* Scholarships Tab */}
        <TabsContent value="scholarships">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Scholarships</CardTitle>
              <Button size="sm" onClick={() => { setEditingScholarship(null); setScholarshipOpen(true); }}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {scholarships.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{s.shortCode}</Badge>
                      <span className="text-sm">{s.name}</span>
                      {!s.active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7"
                        onClick={() => { setEditingScholarship(s); setScholarshipOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {s.active && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                          onClick={() => deactivateScholarship(s.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discount Types Tab */}
        <TabsContent value="discounts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Discount Types</CardTitle>
              <Button size="sm" onClick={() => { setEditingDiscount(null); setDiscountOpen(true); }}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {discounts.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.discountValue}{d.isPercentage ? "%" : " UZS"} discount
                      </p>
                      {!d.active && <Badge variant="secondary" className="text-xs mt-1">Inactive</Badge>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7"
                        onClick={() => { setEditingDiscount(d); setDiscountOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {d.active && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                          onClick={() => deactivateDiscount(d.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Stages Tab */}
        <TabsContent value="stages">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Progress Stages</CardTitle>
              <Button size="sm" onClick={() => { setEditingStage(null); setStageOpen(true); }}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stages.map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline">{i + 1}</Badge>
                      <span className="text-sm">{s.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7"
                        onClick={() => { setEditingStage(s); setStageOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                        onClick={() => deleteStage(s.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Users</CardTitle>
              <Button size="sm" onClick={() => { setEditingUser(null); setUserOpen(true); }}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add User
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                      {u.telegramChatId && (
                        <p className="text-xs text-muted-foreground">TG: {u.telegramChatId}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>{u.role}</Badge>
                      <Button size="icon" variant="ghost" className="h-7 w-7"
                        onClick={() => { setEditingUser(u); setUserOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                        onClick={() => deleteUser(u.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Telegram Tab */}
        <TabsContent value="telegram">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Telegram Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The bot sends payment due reminders and overdue alerts once daily via a Vercel Cron job.
                Each user&apos;s Telegram chat ID must be set in the Users tab for them to receive alerts.
              </p>
              <div className="flex items-center gap-3">
                <Label htmlFor="alertDays">Alert days before due date</Label>
                <Input
                  id="alertDays"
                  className="w-20"
                  type="number"
                  min={1}
                  max={30}
                  value={alertDays}
                  onChange={(e) => setAlertDays(e.target.value)}
                />
              </div>
              <Button onClick={saveAlertDays}>Save</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Scholarship Dialog */}
      <Dialog open={scholarshipOpen} onOpenChange={(o) => { setScholarshipOpen(o); if (!o) setEditingScholarship(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingScholarship ? "Edit Scholarship" : "Add Scholarship"}</DialogTitle></DialogHeader>
          <form onSubmit={handleScholarship} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="s-name">Name</Label>
              <Input id="s-name" name="name" defaultValue={editingScholarship?.name ?? ""} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-code">Short Code</Label>
              <Input id="s-code" name="shortCode" maxLength={6} defaultValue={editingScholarship?.shortCode ?? ""} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setScholarshipOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Discount Dialog */}
      <Dialog open={discountOpen} onOpenChange={(o) => { setDiscountOpen(o); if (!o) setEditingDiscount(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingDiscount ? "Edit Discount Type" : "Add Discount Type"}</DialogTitle></DialogHeader>
          <form onSubmit={handleDiscount} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="d-name">Name</Label>
              <Input id="d-name" name="name" defaultValue={editingDiscount?.name ?? ""} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="d-value">Value</Label>
                <Input id="d-value" name="discountValue" type="number" min={0} defaultValue={editingDiscount?.discountValue ?? ""} required />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select name="isPercentage" defaultValue={editingDiscount ? (editingDiscount.isPercentage ? "true" : "false") : "true"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Percentage (%)</SelectItem>
                    <SelectItem value="false">Fixed (UZS)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="d-desc">Description</Label>
              <Input id="d-desc" name="description" defaultValue={""} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDiscountOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stage Dialog */}
      <Dialog open={stageOpen} onOpenChange={(o) => { setStageOpen(o); if (!o) setEditingStage(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingStage ? "Edit Stage" : "Add Stage"}</DialogTitle></DialogHeader>
          <form onSubmit={handleStage} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="st-name">Stage Name</Label>
              <Input id="st-name" name="name" defaultValue={editingStage?.name ?? ""} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStageOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* User Dialog */}
      <Dialog open={userOpen} onOpenChange={(o) => { setUserOpen(o); if (!o) setEditingUser(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingUser ? "Edit User" : "Add User"}</DialogTitle></DialogHeader>
          <form onSubmit={handleUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="u-name">Name</Label>
              <Input id="u-name" name="name" defaultValue={editingUser?.name ?? ""} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-email">Email</Label>
              <Input id="u-email" name="email" type="email" defaultValue={editingUser?.email ?? ""} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-pass">{editingUser ? "New Password (leave blank to keep)" : "Password"}</Label>
              <Input id="u-pass" name="password" type="password" required={!editingUser} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select name="role" defaultValue={editingUser?.role ?? "ASSISTANT"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="ASSISTANT">Assistant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-tg">Telegram Chat ID</Label>
              <Input id="u-tg" name="telegramChatId" defaultValue={editingUser?.telegramChatId ?? ""} placeholder="123456789" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUserOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
