# Mobile App — Home Screen Redesign

## ขอบเขต
- แก้เฉพาะ `app/(tabs)/index.tsx`
- ห้ามแตะไฟล์อื่น ยกเว้น `lib/research.ts` ถ้าต้องเพิ่มฟังก์ชัน

---

## สิ่งที่ต้องเปลี่ยน

### 1. Header
- เพิ่มโลโก้ (ไอคอน `library` สีฟ้า) ซ้ายสุด ก่อนชื่อ
- **ตัดปุ่ม search ออก** (มี tab ค้นหาอยู่แล้ว)
- Layout: `[โลโก้] [ชื่อ ຫ້ອງສະໝຸດດິຈິຕອນ]`

### 2. Hero Banner
- **ลดความสูงลง 50%** — เปลี่ยน padding จาก `spacing.lg` เป็น `spacing.sm`
- ลด font size: heroTitle → `typography.h3`, heroSubtitle → `typography.caption`
- ปุ่ม heroBtn เล็กลง padding `spacing.xs` / `spacing.sm`

### 3. Stats cards (3 ช่อง)
- **เล็กลง** — padding จาก `spacing.md` → `spacing.sm`
- icon size 18 (จาก 20)
- statValue font: `typography.h3` (จาก `typography.h2`)

### 4. ปี พ.ศ → ค.ศ (ทั่วโปรเจค)
ใน `index.tsx` ที่แสดง `item.year` — field `year` ใน DB เก็บเป็น พ.ศ (2567)
แปลงเป็น ค.ศ ด้วยฟังก์ชัน helper:
```ts
function toAD(year: number) { return year > 2500 ? year - 543 : year; }
```
ใช้ `toAD(item.year)` ทุกจุดที่แสดง `item.year`

ทำเช่นเดียวกันใน:
- `app/(tabs)/research.tsx`
- `app/search.tsx`
- `app/research/[slug].tsx` (ถ้ามี)

### 5. ລາຍການຍອດນິຍົມ (รายการยอดนิยม)
เพิ่ม section ใหม่ **เหนือ** ງານວິໄຈລ່າສຸດ:
- ดึงข้อมูลด้วย `getPublicResearch({ limit: 10, sort: 'views' })` — ต้องเพิ่ม param `sort` ใน `lib/research.ts`
- แสดงเป็น **horizontal FlatList** (scroll ซ้าย-ขวา)
- card ขนาดเดียวกับหน้าค้นหา: `width: 110`, cover height `154` (ratio 1:1.4)
- ถ้า total > 10 → แสดงปุ่ม `ເບິ່ງເພີ່ມເຕີມ →` ที่ท้าย section (navigate ไป `/(tabs)/research`)

### 6. ງານວິໄຈລ່າສຸດ
- เปลี่ยนจาก list แนวตั้ง → **horizontal FlatList** เหมือนกัน
- ดึง `limit: 10` (จาก 3)
- card ขนาดเดียวกัน: `width: 110`, cover height `154`
- ถ้า total > 10 → ปุ่ม `ເບິ່ງເພີ່ມເຕີມ →`

---

## การแก้ `lib/research.ts`

เพิ่ม param `sort` ใน `getPublicResearch`:

```ts
export async function getPublicResearch(params: {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
  sort?: 'latest' | 'views' | 'downloads'; // เพิ่มบรรทัดนี้
}) {
  const { search = '', category = '', page = 1, limit = 20, sort = 'latest' } = params;
  // ...
  // เปลี่ยน order:
  const orderCol = sort === 'views' ? 'views' : sort === 'downloads' ? 'downloads' : 'published_at';
  query = query.order(orderCol, { ascending: false });
  // ...
}
```

---

## โค้ดเต็ม `app/(tabs)/index.tsx`

**แทนที่ไฟล์ทั้งหมดด้วยโค้ดนี้:**

```tsx
import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, FlatList, Image, Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { spacing, typography, radius, shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { getResearchStats, getPublicResearch, ResearchItem } from '@/lib/research';

const SCREEN_WIDTH = Dimensions.get('window').width;
const H_CARD_WIDTH = 110;
const H_COVER_HEIGHT = 154; // ratio 1:1.4

/** แปลง พ.ศ → ค.ศ */
function toAD(year: number) {
  return year > 2500 ? year - 543 : year;
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [stats, setStats] = useState({ research: 0, categories: 0, organizations: 0 });
  const [popular, setPopular] = useState<ResearchItem[]>([]);
  const [popularTotal, setPopularTotal] = useState(0);
  const [latest, setLatest] = useState<ResearchItem[]>([]);
  const [latestTotal, setLatestTotal] = useState(0);

  useEffect(() => {
    getResearchStats().then(setStats);
    getPublicResearch({ limit: 10, sort: 'views' }).then(({ data, count }) => {
      setPopular(data);
      setPopularTotal(count);
    });
    getPublicResearch({ limit: 10, sort: 'latest' }).then(({ data, count }) => {
      setLatest(data);
      setLatestTotal(count);
    });
  }, []);

  /** Card แนวนอน ใช้ทั้ง popular และ latest */
  const renderHCard = ({ item }: { item: ResearchItem }) => (
    <TouchableOpacity
      style={styles.hCard}
      onPress={() => router.push(`/research/${item.slug}`)}
      activeOpacity={0.75}
    >
      {item.cover_image ? (
        <Image
          source={{ uri: item.cover_image }}
          style={styles.hCover}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.hCover, styles.hPlaceholder]}>
          <Ionicons name="document-text" size={24} color={colors.primary} />
        </View>
      )}
      <View style={styles.hInfo}>
        <Text style={styles.hTitle} numberOfLines={2}>{item.title_th}</Text>
        <Text style={styles.hYear}>{toAD(item.year)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* โลโก้ */}
          <View style={styles.logoBox}>
            <Ionicons name="library" size={22} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.greeting}>ສະບາຍດີ 👋</Text>
            <Text style={styles.headerTitle}>ຫ້ອງສະໝຸດດິຈິຕອນ</Text>
          </View>
        </View>
        {/* ไม่มีปุ่ม search */}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Hero Banner (เล็กลง 50%) ── */}
        <LinearGradient
          colors={isDark ? ['#1e3a5f', '#0f172a'] : ['#185ff2', '#1248c4']}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>ຍິນດີຕ້ອນຮັບ 👋</Text>
            <Text style={styles.heroSubtitle}>
              ຄົ້ນຫາງານວິໄຈກວ່າ {stats.research} ລາຍການ
            </Text>
            <TouchableOpacity
              style={styles.heroBtn}
              onPress={() => router.push('/search')}
            >
              <Text style={styles.heroBtnText}>ຄົ້ນຫາງານວິໄຈ →</Text>
            </TouchableOpacity>
          </View>
          <Ionicons
            name="library"
            size={56}
            color="rgba(255,255,255,0.15)"
            style={styles.heroIcon}
          />
        </LinearGradient>

        {/* ── Stats (เล็กลง) ── */}
        <View style={styles.statsRow}>
          {[
            { label: 'ງານວິໄຈ', value: stats.research.toString(), icon: 'document-text-outline' },
            { label: 'ຫມວດຫມູ່', value: stats.categories.toString(), icon: 'folder-outline' },
            { label: 'ຫນ່ວຍງານ', value: stats.organizations.toString(), icon: 'business-outline' },
          ].map((stat) => (
            <Card key={stat.label} style={styles.statCard}>
              <Ionicons name={stat.icon as any} size={18} color={colors.primary} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Card>
          ))}
        </View>

        {/* ── ລາຍການຍອດນິຍົມ ── */}
        {popular.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>ລາຍການຍອດນິຍົມ</Text>
              {popularTotal > 10 && (
                <TouchableOpacity onPress={() => router.push('/(tabs)/research')}>
                  <Text style={styles.seeAll}>ເບິ່ງເພີ່ມເຕີມ →</Text>
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={popular}
              keyExtractor={(item) => item.id}
              renderItem={renderHCard}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
              ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
            />
          </View>
        )}

        {/* ── ງານວິໄຈລ່າສຸດ ── */}
        {latest.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>ງານວິໄຈລ່າສຸດ</Text>
              {latestTotal > 10 && (
                <TouchableOpacity onPress={() => router.push('/(tabs)/research')}>
                  <Text style={styles.seeAll}>ເບິ່ງເພີ່ມເຕີມ →</Text>
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={latest}
              keyExtractor={(item) => item.id}
              renderItem={renderHCard}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
              ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    // ── Header ──
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    logoBox: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    greeting: { ...typography.caption, color: colors.text.secondary },
    headerTitle: { ...typography.h3, color: colors.text.primary },

    scroll: { padding: spacing.md, gap: spacing.md },

    // ── Hero (เล็กลง 50%) ──
    hero: {
      borderRadius: radius.xl,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      overflow: 'hidden',
      position: 'relative',
    },
    heroContent: { gap: 4 },
    heroTitle: { ...typography.h3, color: '#fff' },
    heroSubtitle: { ...typography.caption, color: 'rgba(255,255,255,0.85)' },
    heroBtn: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      marginTop: spacing.xs,
    },
    heroBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },
    heroIcon: {
      position: 'absolute',
      right: -8,
      top: -8,
    },

    // ── Stats (เล็กลง) ──
    statsRow: { flexDirection: 'row', gap: spacing.sm },
    statCard: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
      padding: spacing.sm,
    },
    statValue: { ...typography.h3, color: colors.primary },
    statLabel: { fontSize: 10, color: colors.text.secondary, textAlign: 'center' },

    // ── Section ──
    section: {},
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    sectionTitle: { ...typography.h3, color: colors.text.primary },
    seeAll: { ...typography.bodySmall, color: colors.primary },

    // ── Horizontal card ──
    hList: { paddingBottom: spacing.xs },
    hCard: {
      width: H_CARD_WIDTH,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
    },
    hCover: {
      width: H_CARD_WIDTH,
      height: H_COVER_HEIGHT,
    },
    hPlaceholder: {
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hInfo: {
      padding: spacing.xs,
      paddingBottom: 6,
    },
    hTitle: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.text.primary,
      lineHeight: 15,
    },
    hYear: {
      fontSize: 10,
      color: colors.text.muted,
      marginTop: 2,
    },
  });
}
```

---

## การแก้ `lib/research.ts`

เพิ่ม param `sort` — แก้เฉพาะส่วน function signature และ query order:

```ts
// เปลี่ยน signature
export async function getPublicResearch(params: {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
  sort?: 'latest' | 'views' | 'downloads'; // เพิ่ม
}) {
  const { search = '', category = '', page = 1, limit = 20, sort = 'latest' } = params;
  // ...

  // เปลี่ยนบรรทัด .order(...)
  const orderCol = sort === 'views'
    ? 'views'
    : sort === 'downloads'
    ? 'downloads'
    : 'published_at';

  let query = supabase
    .from('research_items')
    .select(category ? RESEARCH_SELECT_BY_CATEGORY : RESEARCH_SELECT, { count: 'exact' })
    .eq('status', 'published')
    .in('access_level', ['public', 'read_only', 'metadata_only'])
    .order(orderCol, { ascending: false })
    .range(from, to);
  // ...
}
```

---

## ปี พ.ศ → ค.ศ ในไฟล์อื่น

เพิ่มฟังก์ชัน helper นี้ในทุกไฟล์ที่แสดง `item.year`:

```ts
function toAD(year: number) {
  return year > 2500 ? year - 543 : year;
}
```

แล้วเปลี่ยน `{item.year}` → `{toAD(item.year)}` ใน:
- `app/(tabs)/research.tsx`
- `app/search.tsx`
- `app/research/[slug].tsx`

---

## วิธีใช้ใน Cursor

```
@app/(tabs)/index.tsx @lib/research.ts @app/(tabs)/research.tsx @app/search.tsx

ปรับ UI ตาม prompt file นี้:
- index.tsx: header โลโก้+ไม่มี search, hero เล็กลง, stats เล็กลง,
  เพิ่ม section ยอดนิยม + ล่าสุด แบบ horizontal scroll
- research.ts: เพิ่ม param sort
- research.tsx / search.tsx: แปลง item.year → toAD(item.year)
ห้ามแตะไฟล์อื่น
```

## ตรวจสอบหลังรัน

1. หน้าแรก — header มีโลโก้, ไม่มีปุ่ม search
2. Hero เล็กลงครึ่งหนึ่ง
3. Stats 3 ช่องเล็กลง
4. Section ยอดนิยม scroll ซ้าย-ขวาได้
5. Section ล่าสุด scroll ซ้าย-ขวาได้
6. ปีแสดงเป็น ค.ศ (เช่น 2567 → 2024)
```
