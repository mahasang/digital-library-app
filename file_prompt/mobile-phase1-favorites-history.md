# Mobile App — Phase 1: Favorites & Reading History UI

## ขอบเขต
- `app/(tabs)/favorites.tsx` — full replace
- `app/history.tsx` — full replace
- ห้ามแตะไฟล์อื่น

---

## สิ่งที่เพิ่ม/ปรับ

### favorites.tsx
1. **Sort bar** — ปุ่ม 2 ตัว: `ລ່າສຸດ` / `ຊື່` toggle sort
2. **Swipe-to-remove** — ใช้ `Animated` + `PanResponder` ลาก card ซ้ายเพื่อ remove (แสดงพื้นหลังแดง + icon trash)
3. **toAD(year)** — แปลงปี
4. **Empty state** — ปรับให้สวยขึ้น มีปุ่ม ຄົ້ນຫາງານວິໄຈ

### history.tsx
1. **toAD(year)** — แปลงปี (ปัจจุบันยังไม่มี)
2. **Clear all button** — ปุ่ม `ລົບທັງໝົດ` ที่ header (แสดงเมื่อมีข้อมูล) + confirm dialog
3. **Group by date** — group items ตามวันที่อ่าน (วันนี้, เมื่อวาน, ก่อนหน้า)
4. **Swipe-to-remove** — เหมือน favorites

> หมายเหตุ: `clearReadingHistory` และ `removeFromHistory` ยังไม่มีใน `lib/profile.ts`
> ให้สร้าง stub function ใน history.tsx ก่อน แล้วค่อย implement ใน Phase หลัง:
> ```ts
> async function clearAllHistory() { /* TODO */ }
> async function removeHistoryItem(id: string) { /* TODO */ }
> ```

---

## โค้ดเต็ม `app/(tabs)/favorites.tsx`

```tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Image, RefreshControl,
  Animated, PanResponder, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, radius, shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useSession } from '@/hooks/useSession';
import { getFavoriteResearch, toggleFavorite } from '@/lib/profile';
import { ResearchItem } from '@/lib/research';
import { ResearchCardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';

function toAD(year: number) {
  return year > 2500 ? year - 543 : year;
}

type SortKey = 'latest' | 'name';

// Swipeable card component
function SwipeableCard({
  item,
  onPress,
  onRemove,
  styles,
  colors,
}: {
  item: ResearchItem;
  onPress: () => void;
  onRemove: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: any;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const SWIPE_THRESHOLD = -80;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && g.dx < 0,
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) translateX.setValue(Math.max(g.dx, -100));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < SWIPE_THRESHOLD) {
          // snap open then confirm
          Animated.timing(translateX, { toValue: -90, duration: 150, useNativeDriver: true }).start();
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  function handleRemove() {
    Alert.alert('ລຶບອອກ', 'ທ່ານຕ້ອງການລຶບອອກຈາກລາຍການທີ່ມັກບໍ?', [
      { text: 'ຍົກເລີກ', style: 'cancel', onPress: () => Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start() },
      {
        text: 'ລຶບ', style: 'destructive', onPress: () => {
          Animated.timing(translateX, { toValue: -400, duration: 250, useNativeDriver: true }).start(() => onRemove());
        },
      },
    ]);
  }

  return (
    <View style={{ position: 'relative', marginBottom: spacing.sm }}>
      {/* พื้นหลังแดง */}
      <View style={styles.swipeBg}>
        <TouchableOpacity onPress={handleRemove} style={styles.swipeAction}>
          <Ionicons name="trash-outline" size={22} color="#fff" />
          <Text style={styles.swipeText}>ລຶບ</Text>
        </TouchableOpacity>
      </View>
      {/* Card */}
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
          <View style={styles.coverArea}>
            {item.cover_image ? (
              <Image source={{ uri: item.cover_image }} style={styles.cover} resizeMode="cover" />
            ) : (
              <View style={[styles.cover, styles.coverPlaceholder]}>
                <Ionicons name="document-text" size={28} color={colors.primary} />
              </View>
            )}
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.title} numberOfLines={2}>{item.title_th}</Text>
            {item.title_en && (
              <Text style={styles.titleEn} numberOfLines={1}>{item.title_en}</Text>
            )}
            {item.research_categories[0]?.categories?.name_th && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {item.research_categories[0].categories.name_th}
                </Text>
              </View>
            )}
            <View style={styles.meta}>
              <Text style={styles.year}>{toAD(item.year)}</Text>
              <View style={styles.stats}>
                <Ionicons name="eye-outline" size={11} color={colors.text.muted} />
                <Text style={styles.statText}>{item.views}</Text>
                <Ionicons name="download-outline" size={11} color={colors.text.muted} />
                <Text style={styles.statText}>{item.downloads}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function FavoritesScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const session = useSession();
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sort, setSort] = useState<SortKey>('latest');

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getFavoriteResearch();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (session) load();
  }, [session, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  async function handleRemove(item: ResearchItem) {
    await toggleFavorite(item.id);
    setItems(prev => prev.filter(i => i.id !== item.id));
  }

  const sorted = useMemo(() => {
    if (sort === 'name') return [...items].sort((a, b) => a.title_th.localeCompare(b.title_th));
    return items; // latest = order from DB
  }, [items, sort]);

  if (session === undefined) return null;

  if (!session) {
    return (
      <View style={styles.container}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ລາຍການທີ່ມັກ</Text>
        </View>
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="heart-outline" size={40} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>ເຂົ້າສູ່ລະບົບກ່ອນ</Text>
          <Text style={styles.emptyText}>ເຂົ້າສູ່ລະບົບເພື່ອເບິ່ງລາຍການທີ່ມັກຂອງທ່ານ</Text>
          <Button title="ເຂົ້າສູ່ລະບົບ" onPress={() => router.push('/(auth)/login' as any)} style={{ marginTop: spacing.md, minWidth: 200 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>ລາຍການທີ່ມັກ</Text>
        {items.length > 0 && (
          <Text style={styles.headerCount}>{items.length} ລາຍການ</Text>
        )}
      </View>

      {/* Sort bar */}
      {items.length > 1 && (
        <View style={styles.sortBar}>
          <Text style={styles.sortLabel}>ຮຽງຕາມ:</Text>
          {(['latest', 'name'] as SortKey[]).map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.sortBtn, sort === s && styles.sortBtnActive]}
              onPress={() => setSort(s)}
            >
              <Text style={[styles.sortBtnText, sort === s && styles.sortBtnTextActive]}>
                {s === 'latest' ? 'ລ່າສຸດ' : 'ຊື່'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? (
        <View style={styles.list}>
          {[1, 2, 3].map(i => <ResearchCardSkeleton key={i} />)}
        </View>
      ) : sorted.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="heart-outline" size={40} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>ຍັງບໍ່ມີລາຍການທີ່ມັກ</Text>
          <Text style={styles.emptyText}>
            ກົດ ❤️ ໃນໜ້າລາຍລະອຽດງານວິໄຈ ເພື່ອບັນທຶກໄວ້ອ່ານພາຍຫຼັງ
          </Text>
          <Button
            title="ຄົ້ນຫາງານວິໄຈ"
            onPress={() => router.push('/search' as any)}
            style={{ marginTop: spacing.sm, minWidth: 200 }}
          />
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <SwipeableCard
              item={item}
              onPress={() => router.push(`/research/${item.slug}` as any)}
              onRemove={() => handleRemove(item)}
              styles={styles}
              colors={colors}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitle: { ...typography.h3, color: colors.text.primary },
    headerCount: { ...typography.caption, color: colors.text.muted },
    sortBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sortLabel: { ...typography.caption, color: colors.text.secondary },
    sortBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
      borderRadius: radius.full,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sortBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    sortBtnText: { ...typography.caption, color: colors.text.secondary },
    sortBtnTextActive: { color: '#fff' },
    list: { padding: spacing.md },
    swipeBg: {
      position: 'absolute',
      right: 0, top: 0, bottom: 0,
      width: 90,
      backgroundColor: colors.error,
      borderRadius: radius.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    swipeAction: { alignItems: 'center', gap: 4 },
    swipeText: { fontSize: 11, color: '#fff', fontWeight: '600' },
    card: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      ...shadows.sm,
    },
    coverArea: { width: 90 },
    cover: { width: 90, height: 120 },
    coverPlaceholder: {
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardContent: { flex: 1, padding: spacing.md, gap: 4, justifyContent: 'center' },
    title: { ...typography.label, color: colors.text.primary, lineHeight: 20 },
    titleEn: { ...typography.caption, color: colors.text.secondary },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primaryLight,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    badgeText: { ...typography.caption, color: colors.primary },
    meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    year: { ...typography.caption, color: colors.text.muted },
    stats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText: { ...typography.caption, color: colors.text.muted },
    empty: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      gap: spacing.sm, padding: spacing.xl,
    },
    emptyIcon: {
      width: 80, height: 80, borderRadius: radius.full,
      backgroundColor: colors.primaryLight,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    emptyTitle: { ...typography.h3, color: colors.text.primary },
    emptyText: { ...typography.bodySmall, color: colors.text.secondary, textAlign: 'center', marginBottom: spacing.sm },
  });
}
```

---

## โค้ดเต็ม `app/history.tsx`

```tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Image, RefreshControl, Alert,
  Animated, PanResponder, SectionList,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, radius, shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { getReadingHistory } from '@/lib/profile';
import { ResearchItem } from '@/lib/research';
import { ResearchCardSkeleton } from '@/components/ui/Skeleton';

function toAD(year: number) {
  return year > 2500 ? year - 543 : year;
}

// stub — implement ใน Phase หลัง
async function clearAllHistory(): Promise<void> { /* TODO: implement in lib/profile.ts */ }
async function removeHistoryItem(_id: string): Promise<void> { /* TODO: implement in lib/profile.ts */ }

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'ມື້ນີ້';
  if (date.toDateString() === yesterday.toDateString()) return 'ມື້ວານ';
  return date.toLocaleDateString('lo-LA', { day: 'numeric', month: 'long', year: 'numeric' });
}

// group items by date
function groupByDate(items: ResearchItem[]): { title: string; data: ResearchItem[] }[] {
  const groups: Record<string, ResearchItem[]> = {};
  items.forEach(item => {
    const label = item.published_at ? getDateLabel(item.published_at) : 'ກ່ອນໜ້ານີ້';
    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  });
  return Object.entries(groups).map(([title, data]) => ({ title, data }));
}

// Swipeable card
function SwipeableHistoryCard({
  item,
  onPress,
  onRemove,
  styles,
  colors,
}: {
  item: ResearchItem;
  onPress: () => void;
  onRemove: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: any;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const SWIPE_THRESHOLD = -80;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && g.dx < 0,
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) translateX.setValue(Math.max(g.dx, -100));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < SWIPE_THRESHOLD) {
          Animated.timing(translateX, { toValue: -90, duration: 150, useNativeDriver: true }).start();
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  function handleRemove() {
    Alert.alert('ລຶບອອກ', 'ທ່ານຕ້ອງການລຶບອອກຈາກປະຫວັດການອ່ານບໍ?', [
      { text: 'ຍົກເລີກ', style: 'cancel', onPress: () => Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start() },
      {
        text: 'ລຶບ', style: 'destructive', onPress: () => {
          Animated.timing(translateX, { toValue: -400, duration: 250, useNativeDriver: true }).start(() => onRemove());
        },
      },
    ]);
  }

  return (
    <View style={{ position: 'relative', marginBottom: spacing.sm }}>
      <View style={styles.swipeBg}>
        <TouchableOpacity onPress={handleRemove} style={styles.swipeAction}>
          <Ionicons name="trash-outline" size={22} color="#fff" />
          <Text style={styles.swipeText}>ລຶບ</Text>
        </TouchableOpacity>
      </View>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
          <View style={styles.coverArea}>
            {item.cover_image ? (
              <Image source={{ uri: item.cover_image }} style={styles.cover} resizeMode="cover" />
            ) : (
              <View style={[styles.cover, styles.coverPlaceholder]}>
                <Ionicons name="document-text" size={28} color={colors.primary} />
              </View>
            )}
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.title} numberOfLines={2}>{item.title_th}</Text>
            {item.title_en && (
              <Text style={styles.titleEn} numberOfLines={1}>{item.title_en}</Text>
            )}
            {item.research_categories[0]?.categories?.name_th && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {item.research_categories[0].categories.name_th}
                </Text>
              </View>
            )}
            <View style={styles.meta}>
              <Text style={styles.year}>{toAD(item.year)}</Text>
              <View style={styles.stats}>
                <Ionicons name="eye-outline" size={11} color={colors.text.muted} />
                <Text style={styles.statText}>{item.views}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function HistoryScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getReadingHistory();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  function handleRemove(item: ResearchItem) {
    removeHistoryItem(item.id);
    setItems(prev => prev.filter(i => i.id !== item.id));
  }

  function handleClearAll() {
    Alert.alert('ລົບທັງໝົດ', 'ທ່ານຕ້ອງການລົບປະຫວັດການອ່ານທັງໝົດບໍ?', [
      { text: 'ຍົກເລີກ', style: 'cancel' },
      {
        text: 'ລົບທັງໝົດ', style: 'destructive',
        onPress: () => { clearAllHistory(); setItems([]); },
      },
    ]);
  }

  const sections = useMemo(() => groupByDate(items), [items]);

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ປະຫວັດການອ່ານ</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
            <Text style={styles.clearText}>ລົບທັງໝົດ</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.list}>
          {[1, 2, 3].map(i => <ResearchCardSkeleton key={i} />)}
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="time-outline" size={40} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>ຍັງບໍ່ມີປະຫວັດການອ່ານ</Text>
          <Text style={styles.emptyText}>
            ງານວິໄຈທີ່ທ່ານເປີດອ່ານຈະຖືກບັນທຶກໄວ້ທີ່ນີ້
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <SwipeableHistoryCard
              item={item}
              onPress={() => router.push(`/research/${item.slug}` as any)}
              onRemove={() => handleRemove(item)}
              styles={styles}
              colors={colors}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: spacing.md,
    },
    backBtn: { padding: spacing.xs },
    headerTitle: { ...typography.h3, color: colors.text.primary, flex: 1 },
    clearBtn: { padding: spacing.xs },
    clearText: { ...typography.caption, color: colors.error },
    sectionHeader: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.xs,
    },
    sectionTitle: { ...typography.label, color: colors.text.muted, fontSize: 12 },
    list: { padding: spacing.md },
    swipeBg: {
      position: 'absolute',
      right: 0, top: 0, bottom: 0,
      width: 90,
      backgroundColor: colors.error,
      borderRadius: radius.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    swipeAction: { alignItems: 'center', gap: 4 },
    swipeText: { fontSize: 11, color: '#fff', fontWeight: '600' },
    card: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      ...shadows.sm,
    },
    coverArea: { width: 90 },
    cover: { width: 90, height: 120 },
    coverPlaceholder: {
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardContent: { flex: 1, padding: spacing.md, gap: 4, justifyContent: 'center' },
    title: { ...typography.label, color: colors.text.primary, lineHeight: 20 },
    titleEn: { ...typography.caption, color: colors.text.secondary },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primaryLight,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    badgeText: { ...typography.caption, color: colors.primary },
    meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    year: { ...typography.caption, color: colors.text.muted },
    stats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText: { ...typography.caption, color: colors.text.muted },
    empty: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      gap: spacing.sm, padding: spacing.xl,
    },
    emptyIcon: {
      width: 80, height: 80, borderRadius: radius.full,
      backgroundColor: colors.primaryLight,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    emptyTitle: { ...typography.h3, color: colors.text.primary },
    emptyText: { ...typography.bodySmall, color: colors.text.secondary, textAlign: 'center' },
  });
}
```

---

## วิธีใช้ใน Cursor

```
@app/(tabs)/favorites.tsx @app/history.tsx

Phase 1: แทนที่ทั้งสองไฟล์ตาม prompt file นี้
ห้ามแตะไฟล์อื่น
```

## ตรวจสอบหลังรัน

1. `npx tsc --noEmit` — 0 errors
2. Favorites — sort bar ปรากฏเมื่อมี > 1 รายการ
3. Favorites — swipe card ซ้าย → พื้นแดง → confirm → หายไป
4. History — header มีปุ่ม ລົບທັງໝົດ เมื่อมีข้อมูล
5. History — items แบ่งกลุ่มตามวันที่
6. History — swipe card ซ้าย → พื้นแดง → confirm → หายไป
7. ปีแสดงเป็น ค.ศ ทั้งสองหน้า
