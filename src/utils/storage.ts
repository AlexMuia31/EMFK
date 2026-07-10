// src/utils/storage.ts
import { QueuedSubmission } from "@/types/triage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_KEY = "offline_queue";
const LAST_SYNC_KEY = "last_sync_attempt";

export const queueStorage = {
  getQueue: async (): Promise<string[]> => {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  setQueue: async (queue: string[]) => {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  addToQueue: async (recordId: string) => {
    const queue = await queueStorage.getQueue();
    if (!queue.includes(recordId)) {
      queue.push(recordId);
      await queueStorage.setQueue(queue);
    }
  },

  removeFromQueue: async (recordId: string) => {
    const queue = (await queueStorage.getQueue()).filter(
      (id) => id !== recordId,
    );
    await queueStorage.setQueue(queue);
  },

  saveRecord: async (record: QueuedSubmission) => {
    await AsyncStorage.setItem(`record_${record.id}`, JSON.stringify(record));
  },

  getRecord: async (id: string): Promise<QueuedSubmission | null> => {
    const raw = await AsyncStorage.getItem(`record_${id}`);
    return raw ? JSON.parse(raw) : null;
  },

  deleteRecord: async (id: string) => {
    await AsyncStorage.removeItem(`record_${id}`);
  },

  getAllPendingRecords: async (): Promise<QueuedSubmission[]> => {
    const queue = await queueStorage.getQueue();
    const records = await Promise.all(
      queue.map((id) => queueStorage.getRecord(id)),
    );
    return records.filter((r): r is QueuedSubmission => r !== null);
  },
};
