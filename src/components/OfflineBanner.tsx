// src/components/OfflineBanner.tsx
import React from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../store";

export const OfflineBanner: React.FC = () => {
  const { isConnected, isInternetReachable } = useSelector(
    (state: RootState) => state.connectivity,
  );
  const { pendingSubmissions, isSyncing, syncProgress } = useSelector(
    (state: RootState) => state.offlineQueue,
  );

  const isOffline = !isConnected || !isInternetReachable;
  const hasPending = pendingSubmissions.length > 0;

  if (!isOffline && !hasPending) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        isOffline ? styles.offlineBanner : styles.syncBanner,
      ]}
    >
      <Text style={styles.bannerText}>
        {isOffline
          ? `⚠️ OFFLINE MODE — ${pendingSubmissions.length} record(s) queued for sync`
          : isSyncing
            ? `⬆️ Syncing... ${syncProgress?.completed ?? 0}/${syncProgress?.total ?? 0}`
            : `✓ ${pendingSubmissions.length} record(s) pending sync`}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  offlineBanner: {
    backgroundColor: "#DC2626",
  },
  syncBanner: {
    backgroundColor: "#059669",
  },
  bannerText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
