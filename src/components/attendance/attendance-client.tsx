"use client";
import { useEffect, useState } from "react";
import { AttendanceTable } from "./attendance-table";
import { UZ } from "@/constants/uz";

interface Batch {
  id: string;
  name: string;
  status: "ACTIVE" | "CLOSED";
  maxMissed: number;
  maxExcused: number;
  noteText: string | null;
}

interface AttendanceClientProps {
  isAdmin: boolean;
  initialBatchId?: string;
}

export function AttendanceClient({ isAdmin, initialBatchId }: AttendanceClientProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedId, setSelectedId] = useState<string>(initialBatchId ?? "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/batches")
      .then((r) => r.json())
      .then((data: Batch[]) => {
        setBatches(data);
        if (!selectedId && data.length > 0) {
          const active = data.find((b) => b.status === "ACTIVE") ?? data[0];
          setSelectedId(active.id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const selected = batches.find((b) => b.id === selectedId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{UZ.attendance.title}</h1>
        {!loading && batches.length > 0 && (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm min-w-[200px]"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.status === "CLOSED" ? "(yopilgan)" : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground">Yuklanmoqda…</div>
      )}

      {!loading && batches.length === 0 && (
        <div className="text-sm text-muted-foreground">Guruhlar topilmadi.</div>
      )}

      {!loading && selected && (
        <AttendanceTable
          key={selected.id}
          batchId={selected.id}
          batchName={selected.name}
          isAdmin={isAdmin}
          maxMissed={selected.maxMissed}
          maxExcused={selected.maxExcused}
          noteText={selected.noteText}
        />
      )}
    </div>
  );
}
