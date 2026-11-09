import { requireSessionToken } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSessionToken();

  return children;
}
