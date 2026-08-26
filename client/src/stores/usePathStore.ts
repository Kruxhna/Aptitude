import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, PathNode, PathTreeResponse, NodeState } from '../api';

export interface PathStats {
  totalNodes: number;
  completedCount: number;
  progressPercent: number;
  currentNodeId: string;
  currentTopic: string;
}

export interface PathState {
  nodes: PathNode[];
  stats: PathStats | null;
  lastFetchedAt: number | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPathTree: (forceRefresh?: boolean) => Promise<void>;
  setPathTreeData: (data: PathTreeResponse) => void;
  optimisticCompleteNode: (nodeId: string, accuracy?: number) => void;
  resetPath: () => void;
}

const PATH_TREE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const usePathStore = create<PathState>()(
  persist(
    (set, get) => ({
      nodes: [],
      stats: null,
      lastFetchedAt: null,
      isLoading: false,
      error: null,

      fetchPathTree: async (forceRefresh = false) => {
        const { lastFetchedAt, nodes, isLoading } = get();
        const now = Date.now();

        // Use cache if fresh and nodes exist
        if (!forceRefresh && nodes.length > 0 && lastFetchedAt && now - lastFetchedAt < PATH_TREE_TTL_MS) {
          return;
        }

        if (isLoading) return;

        try {
          set({ isLoading: true, error: null });
          const response = await api.getPathTree();
          if (response && Array.isArray(response.nodes) && response.nodes.length > 0) {
            get().setPathTreeData(response);
          } else {
            set({ isLoading: false });
          }
        } catch (err: any) {
          console.warn('[usePathStore] fetchPathTree offline fallback:', err);
          set({
            isLoading: false,
            error: err?.message || 'Failed to load path tree',
          });
        }
      },

      setPathTreeData: (data: PathTreeResponse) => {
        set({
          nodes: data.nodes || [],
          stats: data.stats || null,
          lastFetchedAt: Date.now(),
          isLoading: false,
          error: null,
        });
      },

      optimisticCompleteNode: (nodeId: string, accuracy = 1.0) => {
        const { nodes } = get();
        if (!nodes || nodes.length === 0) return;

        const nextState: NodeState = accuracy >= 0.9 ? 'PERFECT' : 'COMPLETED';
        let foundIndex = -1;

        const updatedNodes = nodes.map((node, idx) => {
          if (node.id === nodeId) {
            foundIndex = idx;
            return {
              ...node,
              state: nextState,
              accuracy,
              completedAt: new Date().toISOString(),
            };
          }
          return node;
        });

        // Unlock next sequential trunk node if currently locked
        if (foundIndex !== -1 && foundIndex + 1 < updatedNodes.length) {
          const nextNode = updatedNodes[foundIndex + 1];
          if (nextNode.state === 'LOCKED') {
            updatedNodes[foundIndex + 1] = {
              ...nextNode,
              state: 'CURRENT',
            };
          }
        }

        const completedCount = updatedNodes.filter(
          (n) => n.state === 'COMPLETED' || n.state === 'PERFECT' || n.state === 'REVIEW'
        ).length;
        const progressPercent = Math.round((completedCount / updatedNodes.length) * 100);
        const currentActive = updatedNodes.find((n) => n.state === 'CURRENT') || updatedNodes[0];

        set({
          nodes: updatedNodes,
          stats: {
            totalNodes: updatedNodes.length,
            completedCount,
            progressPercent,
            currentNodeId: currentActive?.id || '',
            currentTopic: currentActive?.topic || 'GATE Aptitude',
          },
        });
      },

      resetPath: () => {
        set({
          nodes: [],
          stats: null,
          lastFetchedAt: null,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: '@gate_aptitude_path_store_v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        nodes: state.nodes,
        stats: state.stats,
        lastFetchedAt: state.lastFetchedAt,
      }),
    }
  )
);
