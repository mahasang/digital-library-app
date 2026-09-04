import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'dl_cache_';
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 ชั่วโมง

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

export async function setCache<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (e) {
    console.warn('Cache set failed:', e);
  }
}

export async function getCache<T>(key: string, maxAge = CACHE_TTL): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > maxAge) return null;
    return entry.data;
  } catch (e) {
    return null;
  }
}

export async function clearCache(key?: string): Promise<void> {
  try {
    if (key) {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
    } else {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch (e) {
    console.warn('Cache clear failed:', e);
  }
}

// Cache keys
export const CACHE_KEYS = {
  HOME_POPULAR: 'home_popular',
  HOME_LATEST: 'home_latest',
  HOME_STATS: 'home_stats',
  RESEARCH_LIST: 'research_list',
  FAVORITES: 'favorites_list',
  RESEARCH_DETAIL: (slug: string) => `research_detail_${slug}`,
} as const;
