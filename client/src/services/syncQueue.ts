import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { api, SprintSubmissionResponse } from '../api';
import { useUserStore } from '../stores/useUserStore';
import { usePathStore } from '../stores/usePathStore';

const OFFLINE_QUEUE_KEY = '@gate_aptitude_offline_sprint_queue_v1';

export interface OfflineSprintSubmission {
  queueId: string;
  sprintId: string;
  type: string;
  nodeId?: string;
  responses: Array<{
    questionId: string;
    answer: any;
    timeMs: number;
  }>;
  totalQuestions: number;
  totalCorrect: number;
  optimisticXp: number;
  timestamp: number;
  retryCount: number;
}

let isSyncing = false;

/**
 * Checks if the device has active network connectivity and reachability.
 */
export async function isNetworkOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return Boolean(state.isConnected && (state.isInternetReachable ?? true));
  } catch {
    return true; // Default fallback to attempt request
  }
}

/**
 * Retrieves all pending sprint submissions stored offline.
 */
export async function getOfflineQueue(): Promise<OfflineSprintSubmission[]> {
  try {
    const json = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!json) return [];
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[SyncQueue] Failed to load offline queue:', err);
    return [];
  }
}

/**
 * Persists the offline queue array to AsyncStorage.
 */
async function saveOfflineQueue(queue: OfflineSprintSubmission[]): Promise<void> {
  try {
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('[SyncQueue] Failed to save offline queue:', err);
  }
}

/**
 * Enqueues a completed sprint session for deferred background sync.
 */
export async function enqueueOfflineSprint(
  payload: Omit<OfflineSprintSubmission, 'queueId' | 'timestamp' | 'retryCount'>
): Promise<OfflineSprintSubmission> {
  const item: OfflineSprintSubmission = {
    ...payload,
    queueId: `offline_sprint_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    retryCount: 0,
  };

  const queue = await getOfflineQueue();
  queue.push(item);
  await saveOfflineQueue(queue);

  // Apply optimistic state updates locally
  const userStore = useUserStore.getState();
  userStore.optimisticAddXp(item.optimisticXp);
  if (item.totalCorrect > 0) {
    userStore.optimisticIncrementStreak();
  }
  userStore.setPendingSync(true);

  if (item.nodeId) {
    const accuracy = item.totalQuestions > 0 ? item.totalCorrect / item.totalQuestions : 1.0;
    usePathStore.getState().optimisticCompleteNode(item.nodeId, accuracy);
  }

  console.log(`[SyncQueue] Enqueued sprint ${item.sprintId}. Pending queue size: ${queue.length}`);
  return item;
}

/**
 * Removes a successfully synced item from the persistent offline queue.
 */
export async function removeQueuedItem(queueId: string): Promise<void> {
  const queue = await getOfflineQueue();
  const filtered = queue.filter((item) => item.queueId !== queueId);
  await saveOfflineQueue(filtered);
}

/**
 * Flushes all pending offline sprint submissions to the API.
 * Reconciles local user stats with server response when confirmed.
 */
export async function flushOfflineQueue(): Promise<{ syncedCount: number; failedCount: number }> {
  if (isSyncing) {
    return { syncedCount: 0, failedCount: 0 };
  }

  const online = await isNetworkOnline();
  if (!online) {
    console.log('[SyncQueue] Device is offline. Skipping queue flush.');
    return { syncedCount: 0, failedCount: 0 };
  }

  const queue = await getOfflineQueue();
  if (queue.length === 0) {
    useUserStore.getState().setPendingSync(false);
    return { syncedCount: 0, failedCount: 0 };
  }

  isSyncing = true;
  let syncedCount = 0;
  let failedCount = 0;
  const remainingQueue: OfflineSprintSubmission[] = [];

  console.log(`[SyncQueue] Starting flush of ${queue.length} offline sprint(s)...`);

  for (const item of queue) {
    try {
      const response: SprintSubmissionResponse = await api.submitSprint({
        sprintId: item.sprintId,
        responses: item.responses,
      });

      if (response) {
        syncedCount++;
        console.log(`[SyncQueue] Successfully synced sprint ${item.sprintId}. Server accuracy: ${response.accuracy}`);

        // Update user store with verified server state
        const userStore = useUserStore.getState();
        if (response.xpTotal) {
          userStore.setUserFromResponse({
            xpTotal: response.xpTotal,
            streak: response.streak,
            elo: response.eloAfter,
          });
        }

        // Reconcile node completion on server if needed
        if (item.nodeId && response.accuracy !== undefined) {
          api.completePathNode(item.nodeId, response.accuracy).catch(() => {});
        }
      }
    } catch (err: any) {
      console.warn(`[SyncQueue] Failed to sync sprint ${item.sprintId}:`, err?.message || err);
      failedCount++;
      // Increment retry count; keep in queue unless too many failures
      if (item.retryCount < 5) {
        remainingQueue.push({ ...item, retryCount: item.retryCount + 1 });
      } else {
        console.error(`[SyncQueue] Discarding item ${item.queueId} after max retries.`);
      }
    }
  }

  await saveOfflineQueue(remainingQueue);
  useUserStore.getState().setPendingSync(remainingQueue.length > 0);
  isSyncing = false;

  console.log(`[SyncQueue] Flush finished. Synced: ${syncedCount}, Failed: ${failedCount}, Remaining: ${remainingQueue.length}`);
  return { syncedCount, failedCount };
}

/**
 * Initializes automatic network state listener to auto-flush offline queue on reconnect.
 * Returns an unsubscribe teardown function.
 */
export function initSyncQueueListener(): () => void {
  const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const isOnline = Boolean(state.isConnected && (state.isInternetReachable ?? true));
    if (isOnline) {
      console.log('[SyncQueue] Network restored. Triggering background sync...');
      flushOfflineQueue().catch((err) =>
        console.warn('[SyncQueue] Background sync error:', err)
      );
    }
  });

  // Also trigger an initial sync check on app launch
  flushOfflineQueue().catch(() => {});

  return unsubscribe;
}
