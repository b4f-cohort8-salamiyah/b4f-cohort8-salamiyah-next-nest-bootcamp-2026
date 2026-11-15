import { configureStore } from "@reduxjs/toolkit";
import currentUserReducer from "./currentUserSlice";

export function makeStore() {
  return configureStore({
    reducer: {
      currentUser: currentUserReducer,
    },
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
