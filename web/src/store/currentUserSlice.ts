import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
};

interface CurrentUserState {
  user: CurrentUser | null;
}

const initialState: CurrentUserState = { user: null };

// The ONE real justified Redux use case this app needs -- the real signed-in user, read by
// Client Components (e.g. a navbar) that cannot themselves `await` the real backend. Never the
// raw JWT (it never reaches the client at all -- see lib/session.ts); never workspace/issue
// data, which stays real server data, fetched fresh, never duplicated here.
const currentUserSlice = createSlice({
  name: "currentUser",
  initialState,
  reducers: {
    setCurrentUser(state, action: PayloadAction<CurrentUser | null>) {
      state.user = action.payload;
    },
  },
});

export const { setCurrentUser } = currentUserSlice.actions;
export default currentUserSlice.reducer;
