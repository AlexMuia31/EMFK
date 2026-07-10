// src/hooks/useOfflineSync.ts
import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { triageApi } from "../Api/triageApi";
import { AppDispatch, RootState } from "../store";
import {
  rehydrateQueue,
  removeFromQueueAsync,
  setLastSyncError,
  setSyncing,
  setSyncProgress,
  updateSubmissionAsync,
} from "../store/slices/offlineQueueSlice";

const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 5000;

export const useOfflineSync = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isConnected, isInternetReachable } = useSelector(
    (state: RootState) => state.connectivity,
  );
  const { pendingSubmissions, isSyncing } = useSelector(
    (state: RootState) => state.offlineQueue,
  );

  const syncInProgress = useRef(false);
  const [batchSync] = triageApi.useBatchSyncTriageMutation();

  // Rehydrate queue on mount
  useEffect(() => {
    dispatch(rehydrateQueue());
  }, [dispatch]);

  const processQueue = useCallback(async () => {
    if (syncInProgress.current || !isConnected || !isInternetReachable) return;

    const pending = pendingSubmissions.filter(
      (s) => s.attempts < MAX_RETRY_ATTEMPTS,
    );
    if (pending.length === 0) return;

    syncInProgress.current = true;
    dispatch(setSyncing(true));
    dispatch(setSyncProgress({ completed: 0, total: pending.length }));
    dispatch(setLastSyncError(null));

    try {
      // Process in batches of 10 to avoid overwhelming the server
      const BATCH_SIZE = 10;

      for (let i = 0; i < pending.length; i += BATCH_SIZE) {
        const batch = pending.slice(i, i + BATCH_SIZE);

        try {
          const result = await batchSync(batch.map((s) => s.data)).unwrap();

          // Remove successfully synced records
          result.success.forEach((id) => {
            const record = batch.find((b) => b.id === id);
            if (record) {
              dispatch(removeFromQueueAsync(record.id));
            }
          });

          // Update failed records with incremented attempt count
          result.failed.forEach((id) => {
            const record = batch.find((b) => b.id === id);
            if (record) {
              dispatch(
                updateSubmissionAsync({
                  ...record,
                  attempts: record.attempts + 1,
                  lastError: "Server rejected submission",
                }),
              );
            }
          });

          dispatch(
            setSyncProgress({
              completed: Math.min(i + BATCH_SIZE, pending.length),
              total: pending.length,
            }),
          );
        } catch (error) {
          // Batch failed — mark all as attempted
          batch.forEach((record) => {
            dispatch(
              updateSubmissionAsync({
                ...record,
                attempts: record.attempts + 1,
                lastError:
                  error instanceof Error ? error.message : "Network error",
              }),
            );
          });
        }

        // Small delay between batches to prevent UI freezing
        if (i + BATCH_SIZE < pending.length) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    } catch (error) {
      dispatch(
        setLastSyncError(
          error instanceof Error ? error.message : "Sync failed",
        ),
      );
    } finally {
      syncInProgress.current = false;
      dispatch(setSyncing(false));
    }
  }, [
    isConnected,
    isInternetReachable,
    pendingSubmissions,
    dispatch,
    batchSync,
  ]);

  // Trigger sync when connectivity is restored
  useEffect(() => {
    if (
      isConnected &&
      isInternetReachable &&
      pendingSubmissions.length > 0 &&
      !isSyncing
    ) {
      processQueue();
    }
  }, [
    isConnected,
    isInternetReachable,
    pendingSubmissions.length,
    isSyncing,
    processQueue,
  ]);

  // Background sync interval (every 30 seconds when online)
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      if (pendingSubmissions.length > 0 && !syncInProgress.current) {
        processQueue();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected, pendingSubmissions.length, processQueue]);

  // App state change handler (foreground/background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (
        nextAppState === "active" &&
        isConnected &&
        pendingSubmissions.length > 0
      ) {
        processQueue();
      }
    };

    // Import AppState from react-native in actual implementation
    // AppState.addEventListener('change', handleAppStateChange);

    return () => {
      // cleanup
    };
  }, [isConnected, pendingSubmissions.length, processQueue]);

  return { processQueue };
};
