// src/components/TriageForm.tsx
import { triageApi } from "@/Api/triageApi";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

import { AppDispatch, RootState } from "../store";
import { addToQueueAsync } from "../store/slices/offlineQueueSlice";
import {
    PriorityLevel,
    QueuedSubmission,
    TriageStatus,
    TriageSubmission,
} from "../types/triage";
import { OfflineBanner } from "./OfflineBanner";
import { PrioritySelector } from "./prioritySelector";
import { StatusBadge } from "./StatusBadge";

interface FormErrors {
  patientName?: string;
  conditionDescription?: string;
  priority?: string;
}

export const TriageForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isConnected, isInternetReachable } = useSelector(
    (state: RootState) => state.connectivity,
  );
  const { isSyncing } = useSelector((state: RootState) => state.offlineQueue);
  const generateId = (): string => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const [patientName, setPatientName] = useState("");
  const [conditionDescription, setConditionDescription] = useState("");
  const [priority, setPriority] = useState<PriorityLevel | null>(null);
  const [status, setStatus] = useState<TriageStatus>(TriageStatus.PENDING);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<string | null>(null);

  const [submitTriage] = triageApi.useSubmitTriageMutation();

  const isOnline = isConnected && isInternetReachable;

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!patientName.trim()) {
      newErrors.patientName = "Patient name is required";
    } else if (patientName.trim().length < 2) {
      newErrors.patientName = "Name must be at least 2 characters";
    }

    if (!conditionDescription.trim()) {
      newErrors.conditionDescription = "Condition description is required";
    } else if (conditionDescription.trim().length < 5) {
      newErrors.conditionDescription =
        "Please provide more detail (min 5 chars)";
    }

    if (!priority) {
      newErrors.priority = "Priority level is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setPatientName("");
    setConditionDescription("");
    setPriority(null);
    setStatus(TriageStatus.PENDING);
    setErrors({});
  };

  const handleSubmit = useCallback(async () => {
    if (!validate()) {
      // Haptic feedback for error
      return;
    }

    setIsSubmitting(true);

    const submission: TriageSubmission = {
      patientName: patientName.trim(),
      conditionDescription: conditionDescription.trim(),
      priority: priority!,
      status,
    };

    if (isOnline) {
      // Online: Submit directly
      try {
        await submitTriage(submission).unwrap();
        setLastSubmission("Submitted successfully");
        resetForm();

        // Auto-clear success message
        setTimeout(() => setLastSubmission(null), 3000);
      } catch (error) {
        // Server error — queue for retry
        const queued: QueuedSubmission = {
          id: generateId(),
          data: submission,
          timestamp: Date.now(),
          attempts: 0,
        };
        dispatch(addToQueue(queued));
        Alert.alert(
          "Server Error",
          "Submission queued for automatic sync when connection is restored.",
          [{ text: "OK" }],
        );
      }
    } else {
      // Offline: Queue immediately
      const queued: QueuedSubmission = {
        id: generateId(),
        data: submission,
        timestamp: Date.now(),
        attempts: 0,
      };
      dispatch(addToQueue(queued));

      // Immediate visual feedback — no error screen
      setLastSubmission("Saved offline — will sync automatically");
      resetForm();
      setTimeout(() => setLastSubmission(null), 4000);
    }

    setIsSubmitting(false);
  }, [
    patientName,
    conditionDescription,
    priority,
    status,
    isOnline,
    dispatch,
    submitTriage,
  ]);

  const isCritical = priority === 1 || priority === 2;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <OfflineBanner />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🚨 TRIAGE INTAKE</Text>
          <Text style={styles.headerSubtitle}>Emergency Medical Services</Text>
        </View>

        {/* Critical Alert Banner */}
        {isCritical && (
          <View style={styles.criticalBanner}>
            <Text style={styles.criticalBannerText}>
              ⚠️ CRITICAL PRIORITY — LIFE THREATENING
            </Text>
          </View>
        )}

        {/* Success/Status Message */}
        {lastSubmission && (
          <View
            style={[
              styles.statusMessage,
              lastSubmission.includes("offline")
                ? styles.offlineMessage
                : styles.successMessage,
            ]}
          >
            <Text style={styles.statusMessageText}>{lastSubmission}</Text>
          </View>
        )}

        {/* Patient Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>PATIENT NAME *</Text>
          <TextInput
            style={[
              styles.input,
              errors.patientName && styles.inputError,
              isCritical && styles.criticalField,
            ]}
            value={patientName}
            onChangeText={setPatientName}
            placeholder="Enter patient name"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
            autoCorrect={false}
            editable={!isSubmitting}
            returnKeyType="next"
          />
          {errors.patientName && (
            <Text style={styles.errorText}>{errors.patientName}</Text>
          )}
        </View>

        {/* Condition Description */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>CONDITION DESCRIPTION *</Text>
          <TextInput
            style={[
              styles.textArea,
              errors.conditionDescription && styles.inputError,
              isCritical && styles.criticalField,
            ]}
            value={conditionDescription}
            onChangeText={setConditionDescription}
            placeholder="Describe patient's condition..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!isSubmitting}
          />
          {errors.conditionDescription && (
            <Text style={styles.errorText}>{errors.conditionDescription}</Text>
          )}
        </View>

        {/* Priority Selector */}
        <PrioritySelector
          selectedPriority={priority}
          onSelect={setPriority}
          disabled={isSubmitting}
        />
        {errors.priority && (
          <Text style={styles.errorText}>{errors.priority}</Text>
        )}

        {/* Status Selection */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>STATUS</Text>
          <View style={styles.statusRow}>
            {Object.values(TriageStatus).map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setStatus(s)}
                disabled={isSubmitting}
                style={[
                  styles.statusButton,
                  status === s && styles.statusButtonActive,
                ]}
              >
                <StatusBadge status={s} size="md" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting || isSyncing}
          activeOpacity={0.8}
          style={[
            styles.submitButton,
            isCritical && styles.criticalSubmitButton,
            (isSubmitting || isSyncing) && styles.submitButtonDisabled,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isOnline ? "SUBMIT TRIAGE" : "SAVE OFFLINE"}
            </Text>
          )}
        </TouchableOpacity>

        {/* Offline Indicator */}
        {!isOnline && (
          <Text style={styles.offlineHint}>
            📡 No connection detected. Record will be saved locally and synced
            automatically.
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#111827",
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
    marginTop: 4,
    letterSpacing: 2,
  },
  criticalBanner: {
    backgroundColor: "#DC2626",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  criticalBannerText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  statusMessage: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  successMessage: {
    backgroundColor: "#D1FAE5",
    borderWidth: 1,
    borderColor: "#059669",
  },
  offlineMessage: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  statusMessageText: {
    fontWeight: "700",
    fontSize: 14,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  textArea: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
    minHeight: 100,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  inputError: {
    borderColor: "#DC2626",
    borderWidth: 2,
  },
  criticalField: {
    borderColor: "#DC2626",
    borderWidth: 2,
    backgroundColor: "#FEF2F2",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
    marginLeft: 4,
  },
  statusRow: {
    flexDirection: "row",
    gap: 12,
  },
  statusButton: {
    padding: 4,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  statusButtonActive: {
    borderColor: "#3B82F6",
    backgroundColor: "#EFF6FF",
  },
  submitButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  criticalSubmitButton: {
    backgroundColor: "#DC2626",
    shadowColor: "#DC2626",
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
  offlineHint: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 12,
    marginTop: 16,
    fontStyle: "italic",
  },
});

export function addToQueue(queued: QueuedSubmission) {
  return addToQueueAsync(queued);
}
