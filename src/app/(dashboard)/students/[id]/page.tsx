import { StudentDetailClient } from "@/components/students/student-detail-client";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentDetailClient studentId={id} />;
}
