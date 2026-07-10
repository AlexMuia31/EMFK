// src/components/AppInitializer.tsx
import React, { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import NetInfo from "@react-native-community/netinfo";
import { AppDispatch, RootState } from "@/store";
import { setNetworkState } from "@/store/slices/connectivitySlice";
import {
  rehydrateQueue,
  addToQueueAsync,
  removeFromQueueAsync,
  updateSubmissionAsync,
  setSyncing,
  setSyncProgress,
  setLastSyncError,
} from "@/store/slices/offlineQueueSlice";
import { triageApi } from "@/Api/triageApi";

const MAX_RETRY_ATTEMPTS = 5;
const SYNC_INTERVAL_MS = 30000;
const BATCH_SIZE = 10;

interface Props {
  children: React.ReactNode;
}

export const AppInitializer: React.FC<Props> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isConnected, isInternetReachable } = useSelector(
    (state: RootState) => state.connectivity
  );
  const { pendingSubmissions, isSyncing, isHydrated } = useSelector(
    (state: RootState) => state.offlineQueue
  );

  const syncInProgress = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [batchSync] = triageApi.useBatchSyncTriageMutation();

  // Rehydrate queue from AsyncStorage on mount
  useEffect(() => {
    dispatch(rehydrateQueue());
  }, [dispatch]);

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      dispatch(
        setNetworkState({
          isConnected: state.isConnected ?? false,
          isInternetReachable: state.isInternetReachable,
          connectionType: state.type,
        })
      );
    });

    NetInfo.fetch().then((state) => {
      dispatch(
        setNetworkState({
          isConnected: state.isConnected ?? false,
          isInternetReachable: state.isInternetReachable,
          connectionType: state.type,
        })
      );
    });

    return () => unsubscribe();
  }, [dispatch]);

  // Background sync engine
  const processQueue = async () => {
    if (
      syncInProgress.current ||
      !isConnected ||
      !isInternetReachable ||
      !isHydrated
    ) {
      return;
    }

    const pending = pendingSubmissions.filter(
      (s) => s.attempts < MAX_RETRY_ATTEMPTS
    );
    if (pending.length === 0) return;

    syncInProgress.current = true;
    dispatch(setSyncing(true));
    dispatch(
      setSyncProgress({ completed: 0, total: pending.length })
    );
    dispatch(setLastSyncError(null));

    try {
      for (let i = 0; i < pending.length; i += BATCH_SIZE) {
        const batch = pending.slice(i, i + BATCH_SIZE);

        try {
          const result = await batchSync(
            batch.map((s) => s.data)
          ).unwrap();

          // Remove successfully synced
          for (const id of result.success) {
            const record = batch.find((b) => b.id === id);
            if (record) {
              await dispatch(removeFromQueueAsync(record.id));
            }
          }

          // Increment attempts for failures
          for (const id of result.failed) {
            const record = batch.find((b) => b.id === id);
            if (record) {
              await dispatch(
                updateSubmissionAsync({
                  ...record,
                  attempts: record.attempts + 1,
                  lastError: "Server rejected submission",
                })
              );
            }
          }

          dispatch(
            setSyncProgress({
              completed: Math.min(i + BATCH_SIZE, pending.length),
              total: pending.length,
            })
          );
        } catch {
          // Batch failed
          for (const record of batch) {
            await dispatch(
              updateSubmissionAsync({
                ...record,
                attempts: record.attempts + 1,
                lastError: "Network error during batch sync",
              })
            );
          }
        }

        if (i + BATCH_SIZE < pending.length) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    } catch (error) {
      dispatch(
        setLastSyncError(
          error instanceof Error ? error.message : "Sync failed"
        )
      );
    } finally {
      syncInProgress.current = false;
      dispatch(setSyncing(false));
    }
  };

  // Trigger sync when connectivity restored
  useEffect(() => {
    if (
      isConnected &&
      isInternetReachable &&
      isHydrated &&
      pendingSubmissions.length > 0 &&
      !isSyncing
    ) {
      processQueue();
    }
  }, [
    isConnected,
    isInternetReachable,
    isHydrated,
    pendingSubmissions.length,
    isSyncing,
  ]);

  // Periodic background sync
  useEffect(() => {
    if (!isConnected || !isHydrated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      if (
        pendingSubmissions.length > 0 &&
        !syncInProgress.current
      ) {
        processQueue();
      }
    }, SYNC_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isConnected, isHydrated, pendingSubmissions.length]);

  // App state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        nextAppState === "active" &&
        isConnected &&
        isHydrated &&
        pendingSubmissions.length > 0 &&
        !syncInProgress.current
      ) {
        processQueue();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => subscription.remove();
  }, [isConnected, isHydrated, pendingSubmissions.length]);

  return <>{children}</>;
};