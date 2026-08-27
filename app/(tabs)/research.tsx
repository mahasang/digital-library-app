import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView,
  TouchableOpacity, Image, ActivityIndicator,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, radius, shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { getPublicResearch, ResearchItem } from '@/lib/research';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = 8;
const SIDE_PADDING = 12;

// Card แนวนอน (horizontal scroll)
const H_CARD_WIDTH = 110;
const H_COVER_HEIGHT = Math.round(H_CARD_WIDTH * 1.4);

// Card grid 3 คอลัมน์ (all books section)
const NUM_COLUMNS = 3;
const CARD_WIDTH = (SCREEN_WIDTH - SIDE_PADDING * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const COVER_HEIGHT = Math.round(CARD_WIDTH * 1.4);

function toAD(year: number) {
  return year > 2500 ? year - 543 : year;
}

// 3 หมวดหมู่โดดเด่น (slug, ชื่อภาษาลาว)
const FEATURED_CATEGORIES = [
  { slug: 'science',     name: 'ວິທະຍາສາດພື້ນຖານ' },
  { slug: 'it',          name: 'ເຕັກໂນໂລຊີສາລະສົນເທດ' },
  { slug: 'engineering', name: 'ວິສະວະກຳສາດ' },
];

type SectionData = {
  items: ResearchItem[];
  total: number;
  loading: boolean;
};

export default function ShelfScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // หนังสือโดดเด่น (sort by views)
  const [featured, setFeatured] = useState<SectionData>({ items: [], total: 0, loading: true });

  // แต่ละหมวดหมู่
  const [catSections, setCatSections] = useState<Record<string, SectionData>>(
    Object.fromEntries(FEATURED_CATEGORIES.map(c => [c.slug, { items: [], total: 0, loading: true }]))
  );

  // ทั้งหมด (grid ด้านล่าง)
  const [allItems, setAllItems] = useState<ResearchItem[]>([]);
  const [allLoading, setAllLoading] = useState(true);

  useEffect(() => {
    // โหลดหนังสือโดดเด่น
    getPublicResearch({ limit: 10, sort: 'views' }).then(({ data, count }) => {
      setFeatured({ items: data, total: count, loading: false });
    });

    // โหลดแต่ละหมวด
    FEATURED_CATEGORIES.forEach(cat => {
      getPublicResearch({ limit: 10, category: cat.slug, sort: 'views' }).then(({ data, count }) => {
        setCatSections(prev => ({
          ...prev,
          [cat.slug]: { items: data, total: count, loading: false },
        }));
      });
    });

    // โหลดทั้งหมด
    getPublicResearch({ limit: 30 }).then(({ data }) => {
      setAllItems(data);
      setAllLoading(false);
    });
  }, []);

  // Card แนวนอน
  const renderHCard = ({ item }: { item: ResearchItem }) => (
    <TouchableOpacity
      style={styles.hCard}
      onPress={() => router.push(`/research/${item.slug}`)}
      activeOpacity={0.75}
    >
      {item.cover_image ? (
        <Image source={{ uri: item.cover_image }} style={styles.hCover} resizeMode="cover" />
      ) : (
        <View style={[styles.hCover, styles.hPlaceholder]}>
          <Ionicons name="document-text" size={24} color={colors.primary} />
        </View>
      )}
      <View style={styles.hInfo}>
        <Text style={styles.hTitle} numberOfLines={2}>{item.title_th}</Text>
        {item.year ? <Text style={styles.hYear}>{toAD(item.year)}</Text> : null}
      </View>
    </TouchableOpacity>
  );

  // Card grid 3 คอลัมน์
  const renderGridCard = ({ item }: { item: ResearchItem }) => (
    <TouchableOpacity
      style={[styles.bookCard, { width: CARD_WIDTH }]}
      onPress={() => router.push(`/research/${item.slug}`)}
      activeOpacity={0.75}
    >
      {item.cover_image ? (
        <Image
          source={{ uri: item.cover_image }}
          style={[styles.bookCover, { height: COVER_HEIGHT }]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.bookCover, styles.bookPlaceholder, { height: COVER_HEIGHT }]}>
          <Ionicons name="document-text" size={28} color={colors.primary} />
        </View>
      )}
      <View style={styles.cardInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>{item.title_th}</Text>
        {item.year ? <Text style={styles.bookYear}>{toAD(item.year)}</Text> : null}
      </View>
    </TouchableOpacity>
  );

  // Section header พร้อมปุ่ม ເບິ່ງທັງໝົດ
  const SectionHeader = ({
    title,
    total,
    onSeeAll,
  }: {
    title: string;
    total: number;
    onSeeAll?: () => void;
  }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {total > 10 && onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAll}>ເບິ່ງທັງໝົດ →</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ຊັ້ນຫນັງສື</Text>
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => router.push('/search')}
        >
          <Text style={styles.searchLabel}>ຄົ້ນຫາ</Text>
          <Ionicons name="search-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── ຫນັງສືໂດດເດັ່ນ ── */}
        <View style={styles.section}>
          <SectionHeader
            title="ຫນັງສືໂດດເດັ່ນ"
            total={featured.total}
            onSeeAll={() => router.push('/search')}
          />
          {featured.loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
          ) : (
            <FlatList
              data={featured.items}
              keyExtractor={(item) => item.id}
              renderItem={renderHCard}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
              ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
            />
          )}
        </View>

        {/* ── 3 หมวดหมู่โดดเด่น ── */}
        {FEATURED_CATEGORIES.map(cat => {
          const sec = catSections[cat.slug];
          if (!sec.loading && sec.items.length === 0) return null;
          return (
            <View key={cat.slug} style={styles.section}>
              <SectionHeader
                title={cat.name}
                total={sec.total}
                onSeeAll={() => router.push(`/search?category=${cat.slug}`)}
              />
              {sec.loading ? (
                <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
              ) : (
                <FlatList
                  data={sec.items}
                  keyExtractor={(item) => item.id}
                  renderItem={renderHCard}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.hList}
                  ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
                />
              )}
            </View>
          );
        })}

        {/* ── ທັງໝົດ (grid 3 คอลัมน์) ── */}
        <View style={styles.section}>
          <SectionHeader
            title="ທັງໝົດ"
            total={allItems.length}
            onSeeAll={() => router.push('/search')}
          />
          {allLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
          ) : (
            // ใช้ map แทน FlatList เพราะอยู่ใน ScrollView แล้ว
            <View style={styles.grid}>
              {allItems.reduce<ResearchItem[][]>((rows, item, i) => {
                if (i % NUM_COLUMNS === 0) rows.push([]);
                rows[rows.length - 1].push(item);
                return rows;
              }, []).map((row, rowIdx) => (
                <View key={rowIdx} style={styles.row}>
                  {row.map(item => renderGridCard({ item }))}
                  {/* เติม placeholder ถ้าแถวสุดท้ายไม่เต็ม */}
                  {row.length < NUM_COLUMNS &&
                    Array.from({ length: NUM_COLUMNS - row.length }).map((_, i) => (
                      <View key={`empty-${i}`} style={{ width: CARD_WIDTH }} />
                    ))}
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: spacing.xl }} />
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
    headerTitle: { ...typography.h3, color: colors.text.primary },
    searchBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
      backgroundColor: colors.primaryLight,
    },
    searchLabel: {
      ...typography.label,
      color: colors.primary,
      fontSize: 13,
    },

    // ── Section ──
    section: {
      marginTop: spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: SIDE_PADDING,
      marginBottom: spacing.sm,
    },
    sectionTitle: { ...typography.h3, color: colors.text.primary },
    seeAll: { ...typography.bodySmall, color: colors.primary },

    // ── Horizontal card ──
    hList: { paddingHorizontal: SIDE_PADDING },
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
    hInfo: { padding: spacing.xs, paddingBottom: 6 },
    hTitle: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.text.primary,
      lineHeight: 15,
    },
    hYear: { fontSize: 10, color: colors.text.muted, marginTop: 2 },

    // ── Grid 3 คอลัมน์ ──
    grid: {
      paddingHorizontal: SIDE_PADDING,
    },
    row: {
      flexDirection: 'row',
      gap: CARD_GAP,
      marginBottom: CARD_GAP,
    },
    bookCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
    },
    bookCover: { width: '100%' },
    bookPlaceholder: {
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardInfo: { padding: spacing.xs, paddingBottom: 6 },
    bookTitle: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.text.primary,
      lineHeight: 15,
    },
    bookYear: { fontSize: 10, color: colors.text.muted, marginTop: 2 },
  });
}
