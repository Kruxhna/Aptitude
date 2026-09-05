import AsyncStorage from '@react-native-async-storage/async-storage';
import { Question } from '../api';

const QUESTION_CACHE_KEY = '@gate_aptitude_question_cache_buffer_v1';
const QUESTION_SCHEMA_VERSION = 'v1.2.0';
const CACHE_CAPACITY = 50;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedQuestionEntry {
  question: Question;
  cachedAt: number;
  schemaVersion: string;
}

interface QuestionCacheState {
  version: string;
  questions: Record<string, CachedQuestionEntry>; // Keyed by question ID
  lastRefreshedAt: number;
}

/**
 * Loads the local question cache from persistent storage.
 * Automatically invalidates on schema version changes.
 */
export async function loadQuestionCache(): Promise<QuestionCacheState> {
  try {
    const raw = await AsyncStorage.getItem(QUESTION_CACHE_KEY);
    if (!raw) {
      return { version: QUESTION_SCHEMA_VERSION, questions: {}, lastRefreshedAt: 0 };
    }

    const state: QuestionCacheState = JSON.parse(raw);

    // Invalidate stale or out-of-version cache
    if (state.version !== QUESTION_SCHEMA_VERSION) {
      console.log('[QuestionCache] Cache schema version changed. Invalidating stale cache.');
      await clearQuestionCache();
      return { version: QUESTION_SCHEMA_VERSION, questions: {}, lastRefreshedAt: 0 };
    }

    return state;
  } catch (err) {
    console.warn('[QuestionCache] Error loading question cache:', err);
    return { version: QUESTION_SCHEMA_VERSION, questions: {}, lastRefreshedAt: 0 };
  }
}

/**
 * Stores a batch of questions into the local prefetch buffer (Stale-While-Revalidate).
 * Maintains a maximum buffer size of 50 questions.
 */
export async function cacheQuestions(newQuestions: Question[]): Promise<void> {
  try {
    const state = await loadQuestionCache();
    const now = Date.now();

    for (const q of newQuestions) {
      const qId = q.id || q._id;
      if (qId) {
        state.questions[qId] = {
          question: q,
          cachedAt: now,
          schemaVersion: QUESTION_SCHEMA_VERSION,
        };
      }
    }

    // Evict oldest entries if capacity exceeded
    const entries = Object.entries(state.questions);
    if (entries.length > CACHE_CAPACITY) {
      entries.sort((a, b) => b[1].cachedAt - a[1].cachedAt);
      state.questions = Object.fromEntries(entries.slice(0, CACHE_CAPACITY));
    }

    state.lastRefreshedAt = now;
    await AsyncStorage.setItem(QUESTION_CACHE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('[QuestionCache] Error saving questions to cache:', err);
  }
}

/**
 * Retrieve cached questions for a given skill or general practice.
 */
export async function getCachedQuestions(skill?: string, count: number = 5): Promise<Question[]> {
  try {
    const state = await loadQuestionCache();
    const all = Object.values(state.questions).map((e) => e.question);

    let filtered = all;
    if (skill) {
      filtered = all.filter((q) => q.skill?.toLowerCase() === skill.toLowerCase());
    }

    if (filtered.length === 0) {
      filtered = all; // Fallback if no matching skill found
    }

    return filtered.slice(0, count);
  } catch {
    return [];
  }
}

/**
 * Clear the local question cache buffer.
 */
export async function clearQuestionCache(): Promise<void> {
  await AsyncStorage.removeItem(QUESTION_CACHE_KEY);
}
