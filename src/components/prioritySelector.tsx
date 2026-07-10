// src/components/PrioritySelector.tsx
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { PRIORITY_COLORS, PriorityLevel } from "../types/triage";

interface Props {
  selectedPriority: PriorityLevel | null;
  onSelect: (priority: PriorityLevel) => void;
  disabled?: boolean;
}

export const PrioritySelector: React.FC<Props> = ({
  selectedPriority,
  onSelect,
  disabled = false,
}) => {
  const priorities: PriorityLevel[] = [1, 2, 3, 4, 5];

  const getPriorityLabel = (p: PriorityLevel): string => {
    switch (p) {
      case 1:
        return "CRITICAL";
      case 2:
        return "EMERGENT";
      case 3:
        return "URGENT";
      case 4:
        return "LESS URGENT";
      case 5:
        return "NON-URGENT";
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>PRIORITY LEVEL *</Text>
      <View style={styles.grid}>
        {priorities.map((priority) => {
          const colors = PRIORITY_COLORS[priority];
          const isSelected = selectedPriority === priority;
          const isCritical = priority <= 2;

          return (
            <TouchableOpacity
              key={priority}
              onPress={() => !disabled && onSelect(priority)}
              disabled={disabled}
              activeOpacity={0.7}
              style={[
                styles.priorityButton,
                {
                  backgroundColor: colors.bg,
                  borderColor: isSelected ? colors.border : "transparent",
                  borderWidth: isSelected ? 3 : 1,
                  opacity: disabled ? 0.5 : 1,
                },
                isCritical && isSelected && styles.criticalGlow,
                isCritical && { borderColor: colors.border },
              ]}
            >
              <Text style={[styles.priorityNumber, { color: colors.text }]}>
                {priority}
              </Text>
              <Text style={[styles.priorityLabel, { color: colors.text }]}>
                {getPriorityLabel(priority)}
              </Text>
              {isCritical && (
                <View
                  style={[
                    styles.criticalIndicator,
                    { backgroundColor: colors.border },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  priorityButton: {
    width: "18%",
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  criticalGlow: {
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  priorityNumber: {
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 28,
  },
  priorityLabel: {
    fontSize: 8,
    fontWeight: "700",
    marginTop: 2,
    textAlign: "center",
    lineHeight: 10,
  },
  criticalIndicator: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
