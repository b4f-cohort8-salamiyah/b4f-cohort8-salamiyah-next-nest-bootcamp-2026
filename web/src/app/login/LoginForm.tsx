"use client";

import { useActionState } from "react";
import { loginAction, type FormState } from "@/lib/actions/auth";
import Link from "next/link";

const initialState: FormState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          name="email"
          type="email"
          required
          className="rounded-md border border-gray-300 px-3 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Password
        <input
          name="password"
          type="password"
          required
          className="rounded-md border border-gray-300 px-3 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
        />
      </label>
      <button type="submit" disabled={pending}>
        {pending ? "Logging in..." : "Log in"}
      </button>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        New here?{" "}
        <Link
          href="/register"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
