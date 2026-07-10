// src/components/StatusBadge.tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { TriageStatus } from "../types/triage";

interface Props {
  status: TriageStatus;
  size?: "sm" | "md" | "lg";
}

export const StatusBadge: React.FC<Props> = ({ status, size = "md" }) => {
  const getColors = () => {
    switch (status) {
      case TriageStatus.PENDING:
        return { bg: "#FEF3C7", text: "#92400E", border: "#F59E0B" };
      case TriageStatus.IN_TRANSIT:
        return { bg: "#DBEAFE", text: "#1E40AF", border: "#3B82F6" };
    }
  };

  const colors = getColors();

  const sizeStyles = {
    sm: { paddingHorizontal: 8, paddingVertical: 2, fontSize: 10 },
    md: { paddingHorizontal: 12, paddingVertical: 4, fontSize: 12 },
    lg: { paddingHorizontal: 16, paddingVertical: 6, fontSize: 14 },
  };

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.bg, borderColor: colors.border },
        sizeStyles[size],
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: colors.text, fontSize: sizeStyles[size].fontSize },
        ]}
      >
        {status.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: {
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
