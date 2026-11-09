const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

export async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, init);
  return res;
}
