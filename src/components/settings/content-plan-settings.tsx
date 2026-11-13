"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, ChevronUp, Trash2, Send, Download } from "lucide-react";

interface ContentPost {
  id: string;
  date: string;
  time: string | null;
  title: string;
  type: string;
  format: string;
  note: string | null;
  body: string;
}

const WEEKDAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const MONTHS = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];

function dayLabel(iso: string) {
  const d = new Date(iso); // stored at 00:00 UTC of the Tashkent date
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()}-${MONTHS[d.getUTCMonth()]}`;
}

function todayKeyTashkent() {
  return new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function ContentPlanSettings() {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(true);
  const [day, setDay] = useState("6");
  const [time, setTime] = useState("09:00");
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<"save" | "import" | "test" | null>(null);
  const [showPast, setShowPast] = useState(false);

  async function loadPosts() {
    const res = await fetch("/api/content-posts");
    if (res.ok) setPosts(await res.json());
  }

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        setEnabled((s.content_digest_enabled ?? "true") === "true");
        setDay(s.content_digest_day ?? "6");
        setTime(s.content_digest_time ?? "09:00");
      });
    loadPosts();
  }, []);

  async function save() {
    setBusy("save");
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content_digest_enabled: String(enabled),
        content_digest_day: day,
        content_digest_time: time,
      }),
    });
    setBusy(null);
    toast({ title: "Saqlandi" });
  }

  async function importPlan() {
    setBusy("import");
    const res = await fetch("/api/content-posts/import", { method: "POST" });
    const data = await res.json();
    setBusy(null);
    if (res.ok) {
      toast({ title: `${data.imported} ta post yuklandi` });
      loadPosts();
    } else {
      toast({ title: "Yuklab bo'lmadi", variant: "destructive" });
    }
  }

  async function sendTest() {
    setBusy("test");
    const res = await fetch("/api/content-posts/send-test", { method: "POST" });
    const data = await res.json();
    setBusy(null);
    toast(
      res.ok
        ? { title: `Telegramga yuborildi (${data.messages} ta xabar)` }
        : { title: data.error ?? "Yuborib bo'lmadi", variant: "destructive" }
    );
  }

  async function remove(id: string) {
    await fetch(`/api/content-posts/${id}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "Post o'chirildi" });
  }

  const today = todayKeyTashkent();
  const visible = showPast ? posts : posts.filter((p) => p.date.slice(0, 10) >= today);
  const pastCount = posts.length - posts.filter((p) => p.date.slice(0, 10) >= today).length;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base">Haftalik kontent reja</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Bot tanlangan kuni va vaqtida keyingi 7 kunlik postlarni to&apos;liq matni bilan Telegramga yuboradi.
          Xabar Telegram chat ID kiritilgan barcha adminlarga boradi.
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="digest-enabled">Haftalik yuborish</Label>
            <Switch id="digest-enabled" checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Kun</Label>
              <Select value={day} onValueChange={setDay} disabled={!enabled}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WEEKDAYS.map((w, i) => (
                    <SelectItem key={i} value={String(i)}>{w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="digest-time">Vaqt (Toshkent vaqti)</Label>
              <Input
                id="digest-time"
                type="time"
                step={3600}
                value={time}
                disabled={!enabled}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Tekshiruv har soat boshida ishlaydi, shuning uchun xabar tanlangan vaqtdan keyingi birinchi soatda keladi.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={busy !== null}>Saqlash</Button>
            <Button variant="outline" onClick={sendTest} disabled={busy !== null}>
              <Send className="mr-1 h-3.5 w-3.5" /> Hozir sinab ko&apos;rish
            </Button>
            <Button variant="outline" onClick={importPlan} disabled={busy !== null}>
              <Download className="mr-1 h-3.5 w-3.5" /> Rejani yuklash (14-noy — 13-dek)
            </Button>
          </div>
        </div>

        <div className="space-y-2 border-t pt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Yuboriladigan postlar ({visible.length})</h4>
            {pastCount > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setShowPast(!showPast)}>
                {showPast ? "O'tganlarni yashirish" : `O'tganlarni ko'rsatish (${pastCount})`}
              </Button>
            )}
          </div>

          {visible.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Hali postlar yo&apos;q. Rejani yuklash uchun yuqoridagi tugmani bosing.
            </p>
          )}

          <div className="hidden sm:grid grid-cols-[140px_110px_100px_90px_1fr_32px] gap-2 px-3 text-xs text-muted-foreground">
            <span>Kun</span><span>Vaqt</span><span>Turi</span><span>Format</span><span>Sarlavha</span><span />
          </div>

          {visible.map((p) => (
            <div key={p.id} className="rounded-md border">
              <div className="grid grid-cols-1 sm:grid-cols-[140px_110px_100px_90px_1fr_32px] items-center gap-2 p-3 text-sm">
                <span className="font-medium">{dayLabel(p.date)}</span>
                <span>{p.time ?? "Webinar boshida"}</span>
                <span><Badge variant="outline">{p.type}</Badge></span>
                <span><Badge variant="secondary">{p.format}</Badge></span>
                <button
                  type="button"
                  className="flex items-center gap-1 text-left hover:underline"
                  onClick={() => setOpen(open === p.id ? null : p.id)}
                >
                  {open === p.id ? <ChevronUp className="h-3.5 w-3.5 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
                  {p.title}
                </button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(p.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {open === p.id && (
                <div className="border-t bg-muted/40 p-3 space-y-2">
                  {p.note && <p className="text-xs text-muted-foreground">{p.note}</p>}
                  <pre className="whitespace-pre-wrap font-sans text-sm">{p.body}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
