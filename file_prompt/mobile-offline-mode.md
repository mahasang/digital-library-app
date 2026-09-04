# Mobile App — Offline Mode with AsyncStorage Cache

## ขอบเขต
- `lib/cache.ts` — สร้างใหม่: cache utilities
- `hooks/useNetworkStatus.ts` — สร้างใหม่: network status hook
- `components/ui/OfflineBanner.tsx` — สร้างใหม่: offline banner
- `app/_layout.tsx` — เพิ่ม OfflineBanner
- `app/(tabs)/index.tsx` — เพิ่ม cache support
- `app/(tabs)/research.tsx` — เพิ่ม cache support
- `app/(tabs)/favorites.tsx` — เพิ่ม cache support
- `app/research/[slug].tsx` — เพิ่ม cache support
- ห้ามแตะไฟล์อื่น

---

## Part 1: สร้าง `lib/cache.ts`

```ts
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
```

---

## Part 2: สร้าง `hooks/useNetworkStatus.ts`

```ts
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // เช็ค status ครั้งแรก
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected ?? true);
      setIsChecking(false);
    });

    // subscribe การเปลี่ยนแปลง
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
    });

    return () => unsubscribe();
  }, []);

  return { isOnline, isChecking };
}
```

---

## Part 3: สร้าง `components/ui/OfflineBanner.tsx`

```tsx
import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/contexts/LanguageContext';

export function OfflineBanner({ isOnline }: { isOnline: boolean }) {
  const { colors } = useTheme();
  const t = useT();
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOnline ? -50 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOnline]);

  return (
    <Animated.View
      style={[
        styles.banner,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
      <Text style={styles.text}>ບໍ່ມີການເຊື່ອມຕໍ່ອິນເຕີເນັດ — ສະແດງຂໍ້ມູນທີ່ຖືກ cache</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});
```

---

## Part 4: แก้ `app/_layout.tsx`

เพิ่ม imports:
```ts
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
```

แก้ return ใน RootLayout:
```tsx
const { isOnline } = useNetworkStatus();

return (
  <LanguageProvider>
    <ThemeProvider>
      <OfflineBanner isOnline={isOnline} />
      <Stack screenOptions={{ headerShown: false }}>
        ...
      </Stack>
    </ThemeProvider>
  </LanguageProvider>
);
```

---

## Part 5: แก้ `app/(tabs)/index.tsx`

เพิ่ม imports:
```ts
import { setCache, getCache, CACHE_KEYS } from '@/lib/cache';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
```

เพิ่มใน component:
```ts
const { isOnline } = useNetworkStatus();
```

แก้ useEffect หลัก — โหลด cache ถ้า offline:
```ts
useEffect(() => {
  if (isOnline) {
    // online: fetch จริง แล้ว cache
    getResearchStats().then(data => {
      setStats(data);
      setCache(CACHE_KEYS.HOME_STATS, data);
    }).catch(console.error);

    getPublicResearch({ limit: 10, sort: 'views' }).then(({ data, count }) => {
      setPopular(data);
      setPopularTotal(count);
      loadRatings(data);
      setCache(CACHE_KEYS.HOME_POPULAR, { data, count });
    }).catch(console.error);

    getPublicResearch({ limit: 10, sort: 'latest' }).then(({ data, count }) => {
      setLatest(data);
      setLatestTotal(count);
      loadRatings(data);
      setCache(CACHE_KEYS.HOME_LATEST, { data, count });
    }).catch(console.error);
  } else {
    // offline: โหลดจาก cache
    getCache<typeof stats>(CACHE_KEYS.HOME_STATS).then(cached => {
      if (cached) setStats(cached);
    });
    getCache<{ data: ResearchItem[]; count: number }>(CACHE_KEYS.HOME_POPULAR).then(cached => {
      if (cached) { setPopular(cached.data); setPopularTotal(cached.count); }
    });
    getCache<{ data: ResearchItem[]; count: number }>(CACHE_KEYS.HOME_LATEST).then(cached => {
      if (cached) { setLatest(cached.data); setLatestTotal(cached.count); }
    });
  }
}, [isOnline]);
```

---

## Part 6: แก้ `app/(tabs)/research.tsx`

เพิ่ม imports:
```ts
import { setCache, getCache, CACHE_KEYS } from '@/lib/cache';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
```

แก้ useEffect ที่โหลด research list — เพิ่ม cache:
```ts
const { isOnline } = useNetworkStatus();

// ใน useEffect:
if (isOnline) {
  // fetch จริงแล้ว cache
  const result = await getPublicResearch({...});
  setCache(CACHE_KEYS.RESEARCH_LIST, result.data);
} else {
  // โหลดจาก cache
  const cached = await getCache<ResearchItem[]>(CACHE_KEYS.RESEARCH_LIST);
  if (cached) setItems(cached);
}
```

---

## Part 7: แก้ `app/(tabs)/favorites.tsx`

เพิ่ม imports:
```ts
import { setCache, getCache, CACHE_KEYS } from '@/lib/cache';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
```

แก้ useEffect:
```ts
const { isOnline } = useNetworkStatus();

if (isOnline) {
  const data = await getFavoriteResearch();
  setItems(data);
  setCache(CACHE_KEYS.FAVORITES, data);
} else {
  const cached = await getCache<ResearchItem[]>(CACHE_KEYS.FAVORITES);
  if (cached) setItems(cached);
}
```

---

## Part 8: แก้ `app/research/[slug].tsx`

เพิ่ม imports:
```ts
import { setCache, getCache, CACHE_KEYS } from '@/lib/cache';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
```

แก้ useEffect ที่โหลด research detail:
```ts
const { isOnline } = useNetworkStatus();

useEffect(() => {
  if (!slug) return;
  if (isOnline) {
    getResearchBySlug(slug).then((data) => {
      setItem(data);
      setLoading(false);
      if (data) setCache(CACHE_KEYS.RESEARCH_DETAIL(slug), data);
    });
  } else {
    getCache<ResearchItem>(CACHE_KEYS.RESEARCH_DETAIL(slug)).then(cached => {
      setItem(cached);
      setLoading(false);
    });
  }
}, [slug, isOnline]);
```

---

## วิธีใช้ใน Cursor

```
@lib/cache.ts @hooks/useNetworkStatus.ts @components/ui/OfflineBanner.tsx
@app/_layout.tsx @app/(tabs)/index.tsx @app/(tabs)/research.tsx
@app/(tabs)/favorites.tsx @app/research/[slug].tsx

Offline Mode:
1. สร้าง lib/cache.ts — AsyncStorage cache utilities
2. สร้าง hooks/useNetworkStatus.ts — NetInfo hook
3. สร้าง components/ui/OfflineBanner.tsx — animated offline banner
4. _layout.tsx: เพิ่ม OfflineBanner + useNetworkStatus
5. index.tsx: cache home data, load from cache when offline
6. research.tsx: cache research list
7. favorites.tsx: cache favorites
8. [slug].tsx: cache research detail
ห้ามแตะไฟล์อื่น
```

## ตรวจสอบหลังรัน

1. `npx tsc --noEmit` — 0 errors
2. เปิดแอปออนไลน์ → โหลดข้อมูล → ปิด WiFi
3. เปิดแอปออฟไลน์ → เห็น offline banner สีแดงด้านบน
4. ข้อมูลยังแสดงจาก cache
5. เปิด WiFi กลับ → banner หาย → ข้อมูล refresh
