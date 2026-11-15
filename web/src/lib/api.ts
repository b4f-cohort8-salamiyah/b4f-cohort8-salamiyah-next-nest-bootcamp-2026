import { redirect } from "next/navigation";
import { clearSessionToken } from "./session";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export async function apiFetch(
  path: string,
  init?: RequestInit & { token?: string | null },
) {
  const { token, ...rest } = init ?? {};
  const headers = new Headers(rest.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...rest, headers });

  if (res.status === 401 && token) {
    try {
      await clearSessionToken();
    } catch {
      //
    }
    redirect("/login");
  }

  return res;
}
