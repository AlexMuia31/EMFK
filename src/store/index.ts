// src/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { triageApi } from "../Api/triageApi";
import connectivityReducer from "./slices/connectivitySlice";
import offlineQueueReducer from "./slices/offlineQueueSlice";

export const store = configureStore({
  reducer: {
    [triageApi.reducerPath]: triageApi.reducer,
    connectivity: connectivityReducer,
    offlineQueue: offlineQueueReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values from MMKV
        ignoredActions: [
          "offlineQueue/addToQueue",
          "offlineQueue/updateSubmission",
        ],
      },
    }).concat(triageApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
