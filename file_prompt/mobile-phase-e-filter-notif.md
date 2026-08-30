# Mobile App — Phase E: Search Filter + Notifications

## ขอบเขต
- `app/search.tsx` — เพิ่ม filter panel (sort + year range + access level)
- `app/(tabs)/index.tsx` — เพิ่มไอคอน 🔔 บน header
- `app/notifications.tsx` — สร้างใหม่
- `app/_layout.tsx` — เพิ่ม `notifications` route
- `lib/research.ts` — เพิ่ม params `yearFrom`, `yearTo`, `accessLevel` ใน `getPublicResearch`
- ห้ามแตะไฟล์อื่น

---

## Part 1: `lib/research.ts` — เพิ่ม filter params

แก้เฉพาะ `getPublicResearch` signature และ query:

```ts
export async function getPublicResearch(params: {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
  sort?: 'latest' | 'views' | 'downloads';
  yearFrom?: number;   // เพิ่ม
  yearTo?: number;     // เพิ่ม
  accessLevel?: string; // เพิ่ม: 'public' | 'read_only' | 'metadata_only' | '' (all)
}) {
  const {
    search = '', category = '', page = 1, limit = 20, sort = 'latest',
    yearFrom, yearTo, accessLevel = '',
  } = params;
  // ...

  // เพิ่มหลัง .in('access_level', [...])
  if (accessLevel) {
    query = query.eq('access_level', accessLevel);
  }
  if (yearFrom) {
    query = query.gte('year', yearFrom);
  }
  if (yearTo) {
    query = query.lte('year', yearTo);
  }
```

---

## Part 2: `app/search.tsx` — เพิ่ม filter panel

### state ที่เพิ่ม
```ts
const [filterVisible, setFilterVisible] = useState(false);
const [sortBy, setSortBy] = useState<'latest' | 'views' | 'downloads'>('latest');
const [accessLevel, setAccessLevel] = useState('');
const [yearFrom, setYearFrom] = useState('');
const [yearTo, setYearTo] = useState('');
const [activeFilters, setActiveFilters] = useState(0); // จำนวน filter ที่ active
```

### แก้ `load` function
```ts
const load = useCallback(async (
  search: string,
  category: string | null,
  pageNum: number,
  sort: 'latest' | 'views' | 'downloads' = sortBy,
  access: string = accessLevel,
  yFrom: string = yearFrom,
  yTo: string = yearTo,
) => {
  setLoading(true);
  const { data, count } = await getPublicResearch({
    search,
    category: category ?? undefined,
    limit: PAGE_SIZE,
    page: pageNum,
    sort,
    accessLevel: access || undefined,
    yearFrom: yFrom ? parseInt(yFrom) : undefined,
    yearTo: yTo ? parseInt(yTo) : undefined,
  });
  setItems(data);
  setTotal(count);
  setLoading(false);
}, [sortBy, accessLevel, yearFrom, yearTo]);
```

### แก้ filterBtn ปุ่มบน header — แสดง badge ถ้ามี filter
```tsx
<TouchableOpacity
  style={styles.filterBtn}
  onPress={() => setFilterVisible(true)}
>
  <Ionicons name="options-outline" size={22} color="#fff" />
  {activeFilters > 0 && (
    <View style={styles.filterBadge}>
      <Text style={styles.filterBadgeText}>{activeFilters}</Text>
    </View>
  )}
</TouchableOpacity>
```

### เพิ่ม Filter Modal ก่อน closing `</View>`
```tsx
<Modal visible={filterVisible} animationType="slide" transparent>
  <View style={styles.modalOverlay}>
    <View style={styles.modalCard}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>ຕົວກອງ</Text>
        <TouchableOpacity onPress={() => setFilterVisible(false)}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Sort */}
      <Text style={styles.filterLabel}>ຮຽງຕາມ</Text>
      <View style={styles.filterChips}>
        {([
          { key: 'latest', label: 'ລ່າສຸດ' },
          { key: 'views', label: 'ຍອດນິຍົມ' },
          { key: 'downloads', label: 'ດາວໂຫລດ' },
        ] as const).map(opt => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.chip, sortBy === opt.key && styles.chipActive]}
            onPress={() => setSortBy(opt.key)}
          >
            <Text style={[styles.chipText, sortBy === opt.key && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Access level */}
      <Text style={styles.filterLabel}>ລະດັບການເຂົ້າເຖິງ</Text>
      <View style={styles.filterChips}>
        {([
          { key: '', label: 'ທັງໝົດ' },
          { key: 'public', label: 'ສາທາລະນະ' },
          { key: 'read_only', label: 'ອ່ານໄດ້' },
          { key: 'metadata_only', label: 'ຂໍ້ມູນດ່ວນ' },
        ]).map(opt => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.chip, accessLevel === opt.key && styles.chipActive]}
            onPress={() => setAccessLevel(opt.key)}
          >
            <Text style={[styles.chipText, accessLevel === opt.key && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Year range */}
      <Text style={styles.filterLabel}>ຊ່ວງປີ (ຄ.ສ.)</Text>
      <View style={styles.yearRow}>
        <TextInput
          style={styles.yearInput}
          placeholder="ຈາກປີ"
          placeholderTextColor={colors.text.muted}
          value={yearFrom}
          onChangeText={setYearFrom}
          keyboardType="numeric"
          maxLength={4}
        />
        <Text style={{ color: colors.text.muted }}>—</Text>
        <TextInput
          style={styles.yearInput}
          placeholder="ຫາປີ"
          placeholderTextColor={colors.text.muted}
          value={yearTo}
          onChangeText={setYearTo}
          keyboardType="numeric"
          maxLength={4}
        />
      </View>

      {/* Apply + Reset */}
      <View style={styles.filterActions}>
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() => {
            setSortBy('latest');
            setAccessLevel('');
            setYearFrom('');
            setYearTo('');
            setActiveFilters(0);
            setFilterVisible(false);
            load(searchInput, selectedCategory, 1, 'latest', '', '', '');
          }}
        >
          <Text style={styles.resetText}>ລ້າງຕົວກອງ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.applyBtn}
          onPress={() => {
            const count = [
              sortBy !== 'latest',
              accessLevel !== '',
              yearFrom !== '' || yearTo !== '',
            ].filter(Boolean).length;
            setActiveFilters(count);
            setFilterVisible(false);
            setPage(1);
            load(searchInput, selectedCategory, 1, sortBy, accessLevel, yearFrom, yearTo);
          }}
        >
          <Text style={styles.applyText}>ນຳໃຊ້</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
```

### เพิ่ม imports ใน search.tsx
```ts
import { Modal } from 'react-native';
```

### เพิ่ม styles ใน createStyles
```ts
filterBadge: {
  position: 'absolute', top: -4, right: -4,
  width: 16, height: 16, borderRadius: 8,
  backgroundColor: '#ef4444',
  alignItems: 'center', justifyContent: 'center',
},
filterBadgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },
modalOverlay: {
  flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
},
modalCard: {
  backgroundColor: colors.surface,
  borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
  padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl,
},
modalHeader: {
  flexDirection: 'row', justifyContent: 'space-between',
  alignItems: 'center', marginBottom: spacing.sm,
},
modalTitle: { ...typography.h3, color: colors.text.primary },
filterLabel: { ...typography.label, color: colors.text.secondary, marginTop: spacing.sm },
filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
chip: {
  paddingHorizontal: spacing.md, paddingVertical: 6,
  borderRadius: radius.full, borderWidth: 1, borderColor: colors.border,
  backgroundColor: colors.background,
},
chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
chipText: { ...typography.caption, color: colors.text.secondary },
chipTextActive: { color: '#fff', fontWeight: '600' },
yearRow: {
  flexDirection: 'row', alignItems: 'center',
  gap: spacing.sm, marginTop: spacing.xs,
},
yearInput: {
  flex: 1, height: 44, borderWidth: 1.5, borderColor: colors.border,
  borderRadius: radius.md, paddingHorizontal: spacing.md,
  ...typography.body, color: colors.text.primary,
  backgroundColor: colors.background,
},
filterActions: {
  flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md,
},
resetBtn: {
  flex: 1, height: 48, borderRadius: radius.md, borderWidth: 1,
  borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
},
resetText: { ...typography.label, color: colors.text.secondary },
applyBtn: {
  flex: 1, height: 48, borderRadius: radius.md,
  backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
},
applyText: { ...typography.label, color: '#fff' },
```

---

## Part 3: `app/(tabs)/index.tsx` — เพิ่มปุ่ม 🔔

แก้ header section:
```tsx
<View style={styles.header}>
  <View style={styles.headerLeft}>
    <View style={styles.logoBox}>
      <Ionicons name="library" size={22} color={colors.primary} />
    </View>
    <View>
      <Text style={styles.greeting}>ສະບາຍດີ 👋</Text>
      <Text style={styles.headerTitle}>ຫ້ອງສະໝຸດດິຈິຕອນ</Text>
    </View>
  </View>
  {/* ปุ่ม notifications */}
  <TouchableOpacity
    style={styles.notifBtn}
    onPress={() => router.push('/notifications' as any)}
  >
    <Ionicons name="notifications-outline" size={22} color={colors.text.primary} />
  </TouchableOpacity>
</View>
```

เพิ่ม style:
```ts
notifBtn: {
  width: 44, height: 44,
  borderRadius: radius.md,
  backgroundColor: colors.primaryLight,
  alignItems: 'center',
  justifyContent: 'center',
},
```

---

## Part 4: `app/notifications.tsx` — สร้างใหม่

```tsx
import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, radius, shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useSession } from '@/hooks/useSession';
import { supabase } from '@/lib/supabase';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  read_at: string | null;
  created_at: string;
  research_id: string | null;
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return 'ມື້ນີ້';
  if (days < 30) return `${days} ວັນ`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ເດືອນ`;
  return `${Math.floor(months / 12)} ປີ`;
}

const TYPE_ICONS: Record<string, string> = {
  new_research: 'document-text-outline',
  system: 'information-circle-outline',
  approval: 'checkmark-circle-outline',
  default: 'notifications-outline',
};

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const session = useSession();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    loadNotifications();
  }, [session]);

  async function loadNotifications() {
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('id, title, message, type, read_at, created_at, research_id')
      .order('created_at', { ascending: false })
      .limit(50);
    setItems((data as Notification[]) ?? []);
    setLoading(false);
  }

  async function markAllRead() {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null);
    setItems(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
  }

  async function markRead(id: string) {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .is('read_at', null);
    setItems(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
  }

  const unreadCount = items.filter(n => !n.read_at).length;

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.card, !item.read_at && styles.cardUnread]}
      onPress={() => {
        markRead(item.id);
        if (item.research_id) router.push(`/research/${item.research_id}` as any);
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, !item.read_at && { backgroundColor: colors.primaryLight }]}>
        <Ionicons
          name={(TYPE_ICONS[item.type] ?? TYPE_ICONS.default) as any}
          size={20}
          color={colors.primary}
        />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, !item.read_at && { color: colors.primary }]}>
          {item.title}
        </Text>
        {item.message ? (
          <Text style={styles.cardMessage} numberOfLines={2}>{item.message}</Text>
        ) : null}
        <Text style={styles.cardTime}>{relativeTime(item.created_at)}</Text>
      </View>
      {!item.read_at && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          ການແຈ້ງເຕືອນ{unreadCount > 0 ? ` (${unreadCount})` : ''}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAll}>ອ່ານທັງໝົດ</Text>
          </TouchableOpacity>
        )}
      </View>

      {!session ? (
        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={48} color={colors.text.muted} />
          <Text style={styles.emptyText}>ເຂົ້າສູ່ລະບົບເພື່ອເບິ່ງການແຈ້ງເຕືອນ</Text>
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-outline" size={48} color={colors.text.muted} />
          <Text style={styles.emptyText}>ບໍ່ມີການແຈ້ງເຕືອນ</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xxl, paddingBottom: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1, borderBottomColor: colors.border,
      gap: spacing.md,
    },
    backBtn: { padding: spacing.xs },
    headerTitle: { ...typography.h3, color: colors.text.primary, flex: 1 },
    markAll: { ...typography.caption, color: colors.primary },
    list: { padding: spacing.md, gap: spacing.sm },
    card: {
      flexDirection: 'row', alignItems: 'flex-start',
      gap: spacing.md, padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
      ...shadows.sm,
    },
    cardUnread: {
      borderColor: colors.primary + '40',
      backgroundColor: colors.primaryLight + '30',
    },
    iconBox: {
      width: 40, height: 40, borderRadius: radius.md,
      backgroundColor: colors.background,
      alignItems: 'center', justifyContent: 'center',
    },
    cardContent: { flex: 1 },
    cardTitle: { ...typography.label, color: colors.text.primary, marginBottom: 2 },
    cardMessage: { ...typography.bodySmall, color: colors.text.secondary, lineHeight: 18 },
    cardTime: { ...typography.caption, color: colors.text.muted, marginTop: 4 },
    unreadDot: {
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: colors.primary, marginTop: 6,
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
    emptyText: { ...typography.body, color: colors.text.muted, textAlign: 'center' },
  });
}
```

---

## Part 5: `app/_layout.tsx` — เพิ่ม notifications route

```tsx
<Stack.Screen name="notifications" />
```

---

## วิธีใช้ใน Cursor

```
@lib/research.ts @app/search.tsx @app/(tabs)/index.tsx @app/_layout.tsx

Phase E Part 1-3 & 5:
1. lib/research.ts: เพิ่ม yearFrom, yearTo, accessLevel params
2. search.tsx: เพิ่ม filter panel Modal + filterBadge + filter state
3. index.tsx: เพิ่มปุ่ม notifications ที่ header
4. _layout.tsx: เพิ่ม notifications route
ห้ามแตะไฟล์อื่น
```

แล้วสร้างไฟล์ใหม่แยก:
```
สร้างไฟล์ app/notifications.tsx ตามโค้ดด้านบน
```

## ตรวจสอบหลังรัน

1. `npx tsc --noEmit` — 0 errors
2. search.tsx — กดปุ่ม filter icon → modal เปิดจากล่าง
3. เลือก sort/access/year → กด ນຳໃຊ້ → ผลลัพธ์อัปเดต
4. filter badge แสดงจำนวน filter ที่ active
5. กด ລ້າງຕົວກອງ → reset ทั้งหมด
6. index.tsx — icon 🔔 ขวาบน → navigate ไป notifications
7. notifications.tsx — แสดง list, unread highlight, กด ອ່ານທັງໝົດ
