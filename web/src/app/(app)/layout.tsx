import { requireSessionToken } from "@/lib/session";
import { apiFetch } from "@/lib/api";
import { StoreProvider } from "@/store/StoreProvider";
import type { CurrentUser } from "@/store/currentUserSlice";
import { AccountBar } from "@/components/layout/AccountBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await requireSessionToken();

  const meRes = await apiFetch("/auth/me", { token });
  const user: CurrentUser = await meRes.json();

  return (
    <StoreProvider initialUser={user}>
      <AccountBar />
      {children}
    </StoreProvider>
  );
}
