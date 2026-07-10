// src/types/triage.ts

export enum TriageStatus {
  PENDING = "Pending",
  IN_TRANSIT = "In-Transit",
}

export interface TriageRecord {
  id: string;
  patientName: string;
  conditionDescription: string;
  priority: number; // 1-5
  status: TriageStatus;
  timestamp: number;
  synced: boolean;
  syncAttempts: number;
}

export interface TriageSubmission {
  patientName: string;
  conditionDescription: string;
  priority: number;
  status: TriageStatus;
}

export interface QueuedSubmission {
  id: string;
  data: TriageSubmission;
  timestamp: number;
  attempts: number;
  lastError?: string;
}

export type PriorityLevel = 1 | 2 | 3 | 4 | 5;

export const PRIORITY_COLORS: Record<
  PriorityLevel,
  { bg: string; border: string; text: string; glow: string }
> = {
  1: {
    bg: "#7F1D1D", // deep red
    border: "#DC2626", // red-600
    text: "#FEE2E2", // red-100
    glow: "rgba(220, 38, 38, 0.4)",
  },
  2: {
    bg: "#7C2D12", // deep orange
    border: "#EA580C", // orange-600
    text: "#FFEDD5", // orange-100
    glow: "rgba(234, 88, 12, 0.4)",
  },
  3: {
    bg: "#713F12", // deep yellow
    border: "#CA8A04", // yellow-600
    text: "#FEF9C3", // yellow-100
    glow: "rgba(202, 138, 4, 0.3)",
  },
  4: {
    bg: "#064E3B", // deep green
    border: "#059669", // green-600
    text: "#D1FAE5", // green-100
    glow: "rgba(5, 150, 105, 0.3)",
  },
  5: {
    bg: "#1E3A5F", // deep blue
    border: "#3B82F6", // blue-500
    text: "#DBEAFE", // blue-100
    glow: "rgba(59, 130, 246, 0.3)",
  },
};
