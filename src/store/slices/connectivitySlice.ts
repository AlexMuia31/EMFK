// src/store/slices/connectivitySlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ConnectivityState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
  lastChecked: number;
}

const initialState: ConnectivityState = {
  isConnected: true, // Optimistic default
  isInternetReachable: null,
  connectionType: null,
  lastChecked: Date.now(),
};

const connectivitySlice = createSlice({
  name: "connectivity",
  initialState,
  reducers: {
    setNetworkState: (
      state,
      action: PayloadAction<Partial<ConnectivityState>>,
    ) => {
      return { ...state, ...action.payload, lastChecked: Date.now() };
    },
  },
});

export const { setNetworkState } = connectivitySlice.actions;
export default connectivitySlice.reducer;
