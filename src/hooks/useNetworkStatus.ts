// src/hooks/useNetworkStatus.ts
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store";
import { setNetworkState } from "../store/slices/connectivitySlice";

export const useNetworkStatus = () => {
  const dispatch = useDispatch<AppDispatch>();

  const handleNetworkChange = useCallback(
    (state: NetInfoState) => {
      dispatch(
        setNetworkState({
          isConnected: state.isConnected ?? false,
          isInternetReachable: state.isInternetReachable,
          connectionType: state.type,
        }),
      );
    },
    [dispatch],
  );

  useEffect(() => {
    // Initial check
    NetInfo.fetch().then(handleNetworkChange);

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);

    return () => {
      unsubscribe();
    };
  }, [handleNetworkChange]);
};
