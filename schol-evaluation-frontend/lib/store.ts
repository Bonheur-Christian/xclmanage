import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "@/lib/api/authApi";
import { schoolsApi } from "@/lib/api/schoolsApi";
import { evaluationApi } from "@/lib/api/evaluationApi";

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [schoolsApi.reducerPath]: schoolsApi.reducer,
    [evaluationApi.reducerPath]: evaluationApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      schoolsApi.middleware,
      evaluationApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
