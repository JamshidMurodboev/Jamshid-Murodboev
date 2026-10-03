export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";
import { AttendanceClient } from "@/components/attendance/attendance-client";

export default async function AttendancePage() {
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";
  return <AttendanceClient isAdmin={isAdmin} />;
}
