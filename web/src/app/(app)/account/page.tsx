import { requireSessionToken } from "@/lib/session";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import type { CurrentUser } from "@/store/currentUserSlice";

export default async function AccountPage() {
  const token = await requireSessionToken();
  const res = await apiFetch("/auth/me", { token });
  const user: CurrentUser = await res.json();

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 p-6">
      <Card>
        <h1 className="mb-4 text-xl font-semibold">My Account</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
        <p className="mb-3">{user.name}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
        <p>{user.email}</p>
      </Card>
    </main>
  );
}
