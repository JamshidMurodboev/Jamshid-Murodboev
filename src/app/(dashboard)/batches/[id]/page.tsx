import { BatchDetailClient } from "@/components/batches/batch-detail-client";

export default async function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BatchDetailClient batchId={id} />;
}
