// src/api/triageApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { v4 as uuidv4 } from "uuid";
import { TriageRecord, TriageSubmission } from "../types/triage";

const BASE_URL = "http://localhost:8000/api/v1";

export const triageApi = createApi({
  reducerPath: "triageApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      // Add auth token if available
      return headers;
    },
  }),
  tagTypes: ["Triage"],
  endpoints: (builder) => ({
    // Fetch existing triage records
    getTriageRecords: builder.query<TriageRecord[], void>({
      query: () => "/triange/",
      providesTags: ["Triage"],
    }),

    // Submit new triage record
    submitTriage: builder.mutation<TriageRecord, TriageSubmission>({
      query: (body) => ({
        url: "/triange/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Triage"],

      // Optimistic update
      async onQueryStarted(submission, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          triageApi.util.updateQueryData(
            "getTriageRecords",
            undefined,
            (draft) => {
              draft.unshift({
                id: `temp-${uuidv4()}`,
                ...submission,
                timestamp: Date.now(),
                synced: false,
                syncAttempts: 0,
              } as TriageRecord);
            },
          ),
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    // Batch sync endpoint for offline queue
    batchSyncTriage: builder.mutation<
      { success: string[]; failed: string[] },
      TriageSubmission[]
    >({
      query: (records) => ({
        url: "/triage/batch",
        method: "POST",
        body: { records },
      }),
    }),
  }),
});

export const {
  useGetTriageRecordsQuery,
  useSubmitTriageMutation,
  useBatchSyncTriageMutation,
} = triageApi;
