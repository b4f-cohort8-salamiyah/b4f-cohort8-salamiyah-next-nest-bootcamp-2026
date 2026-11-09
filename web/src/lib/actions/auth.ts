"use server";

import { redirect } from "next/navigation";
import { apiFetch } from "../api";
import { setSessionToken } from "../session";

export interface FormState {
  error?: string;
}

export async function loginAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const res = await apiFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    return { error: "Invalid email or password." };
  }

  const { accessToken } = await res.json();
  await setSessionToken(accessToken);

  redirect("/workspaces");
}
