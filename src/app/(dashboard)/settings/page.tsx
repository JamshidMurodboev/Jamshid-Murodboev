import { SettingsClient } from "@/components/settings/settings-client";
import { getSession } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await getSession();
  return <SettingsClient role={session?.role ?? "ASSISTANT"} />;
}
