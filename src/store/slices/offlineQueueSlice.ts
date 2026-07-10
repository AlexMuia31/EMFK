// src/store/slices/offlineQueueSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueuedSubmission } from "@/types/triage";
import { queueStorage } from "@/utils/storage";

interface OfflineQueueState {
  pendingSubmissions: QueuedSubmission[];
  isSyncing: boolean;
  lastSyncError: string | null;
  syncProgress: { completed: number; total: number } | null;
  isHydrated: boolean;
}

const initialState: OfflineQueueState = {
  pendingSubmissions: [],
  isSyncing: false,
  lastSyncError: null,
  syncProgress: null,
  isHydrated: false,
};

// Async thunks for storage operations
export const rehydrateQueue = createAsyncThunk(
  "offlineQueue/rehydrate",
  async () => {
    const records = await queueStorage.getAllPendingRecords();
    return records;
  }
);

export const addToQueueAsync = createAsyncThunk(
  "offlineQueue/addAsync",
  async (record: QueuedSubmission) => {
    await queueStorage.addToQueue(record.id);
    await queueStorage.saveRecord(record);
    return record;
  }
);

export const removeFromQueueAsync = createAsyncThunk(
  "offlineQueue/removeAsync",
  async (recordId: string) => {
    await queueStorage.removeFromQueue(recordId);
    await queueStorage.deleteRecord(recordId);
    return recordId;
  }
);

export const updateSubmissionAsync = createAsyncThunk(
  "offlineQueue/updateAsync",
  async (record: QueuedSubmission) => {
    await queueStorage.saveRecord(record);
    return record;
  }
);

const offlineQueueSlice = createSlice({
  name: "offlineQueue",
  initialState,
  reducers: {
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
      if (!action.payload) {
        state.syncProgress = null;
      }
    },
    setSyncProgress: (
      state,
      action: PayloadAction<{ completed: number; total: number }>
    ) => {
      state.syncProgress = action.payload;
    },
    setLastSyncError: (
      state,
      action: PayloadAction<string | null>
    ) => {
      state.lastSyncError = action.payload;
    },
    clearQueue: (state) => {
      state.pendingSubmissions = [];
      AsyncStorage.removeItem("offline_queue");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(rehydrateQueue.fulfilled, (state, action) => {
        state.pendingSubmissions = action.payload;
        state.isHydrated = true;
      })
      .addCase(addToQueueAsync.fulfilled, (state, action) => {
        state.pendingSubmissions.push(action.payload);
      })
      .addCase(removeFromQueueAsync.fulfilled, (state, action) => {
        state.pendingSubmissions = state.pendingSubmissions.filter(
          (s) => s.id !== action.payload
        );
      })
      .addCase(updateSubmissionAsync.fulfilled, (state, action) => {
        const index = state.pendingSubmissions.findIndex(
          (s) => s.id === action.payload.id
        );
        if (index !== -1) {
          state.pendingSubmissions[index] = action.payload;
        }
      });
  },
});

export const {
  setSyncing,
  setSyncProgress,
  setLastSyncError,
  clearQueue,
} = offlineQueueSlice.actions;

export default offlineQueueSlice.reducer;