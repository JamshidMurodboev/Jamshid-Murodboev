import { BatchDetailClient } from "@/components/batches/batch-detail-client";
import { getSession } from "@/lib/auth";

export default async function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";
  return <BatchDetailClient batchId={id} isAdmin={isAdmin} />;
}
