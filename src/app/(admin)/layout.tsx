import { getSessionUserId } from "@/lib/auth/session";
import { getUserById } from "@/lib/db/store";
import { AdminShell } from "@/components/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const userId = await getSessionUserId();
  const user = userId ? await getUserById(userId) : null;

  return <AdminShell user={user}>{children}</AdminShell>;
}
