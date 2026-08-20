import { getSessionUserId } from "@/lib/auth/session";
import { listUsers } from "@/lib/db/store";
import { UserTable } from "@/components/admin-users/user-table";

export default async function AdminUsersPage() {
  const currentUserId = await getSessionUserId();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- sengaja dibuang sebelum dikirim ke client
  const users = (await listUsers()).map(({ password: _password, ...rest }) => rest);

  return <UserTable users={users} currentUserId={currentUserId ?? ""} />;
}
