"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { setCurrentUser, type CurrentUser } from "./currentUserSlice";
import { makeStore, type AppStore } from "./store";

// Hydrates the Redux current-user snapshot from a value the real Server Component root layout
// already fetched (via the session cookie) -- the client never re-fetches or sees the real
// token itself, only the resulting user object.
export function StoreProvider({
  initialUser,
  children,
}: {
  initialUser: CurrentUser | null;
  children: React.ReactNode;
}) {
  const storeRef = useRef<AppStore | undefined>(undefined);
  if (!storeRef.current) {
    storeRef.current = makeStore();
    storeRef.current.dispatch(setCurrentUser(initialUser));
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}
