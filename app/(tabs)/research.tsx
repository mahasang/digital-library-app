import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView,
  TouchableOpacity, ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, radius, shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/contexts/LanguageContext';
import { getPublicResearch, ResearchItem } from '@/lib/research';
import { setCache, getCache, CACHE_KEYS } from '@/lib/cache';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

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

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return 'ມື້ນີ້';
  if (days < 30) return `${days} ວັນ`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ເດືອນ`;
  return `${Math.floor(months / 12)} ປີ`;
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
  const t = useT();
  const { isOnline } = useNetworkStatus();
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

    // โหลดทั้งหมด — online: fetch จริงแล้ว cache, offline: โหลดจาก cache
    if (isOnline) {
      getPublicResearch({ limit: 30 }).then(({ data }) => {
        setAllItems(data);
        setAllLoading(false);
        setCache(CACHE_KEYS.RESEARCH_LIST, data);
      });
    } else {
      getCache<ResearchItem[]>(CACHE_KEYS.RESEARCH_LIST).then(cached => {
        if (cached) setAllItems(cached);
        setAllLoading(false);
      });
    }
  }, [isOnline]);

  // Card แนวนอน
  const renderHCard = ({ item }: { item: ResearchItem }) => (
    <TouchableOpacity
      style={styles.hCard}
      onPress={() => router.push(`/research/${item.slug}` as any)}
      activeOpacity={0.75}
    >
      {item.cover_image ? (
        <Image
          source={{ uri: item.cover_image }}
          style={styles.hCover}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
        />
      ) : (
        <View style={[styles.hCover, styles.hPlaceholder]}>
          <Ionicons name="document-text" size={24} color={colors.primary} />
        </View>
      )}
      <View style={styles.hInfo}>
        <Text style={styles.hTitle} numberOfLines={2}>{item.title_th}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
          <Ionicons name="eye-outline" size={9} color={colors.text.muted} />
          <Text style={styles.hMeta}>{item.views}</Text>
          {item.published_at ? (
            <Text style={[styles.hMeta, { marginLeft: 2 }]}>{relativeTime(item.published_at)}</Text>
          ) : null}
        </View>
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
          <Text style={styles.seeAll}>{t('shelf_see_all')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('shelf_title')}</Text>
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => router.push('/search')}
        >
          <Text style={styles.searchLabel}>{t('shelf_search')}</Text>
          <Ionicons name="search-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── ຫນັງສືໂດດເດັ່ນ ── */}
        <View style={styles.section}>
          <SectionHeader
            title={t('shelf_featured')}
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
              nestedScrollEnabled={true}
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
                  nestedScrollEnabled={true}
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
            title={t('shelf_all')}
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
                  {row.map(item => (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.bookCard, { width: CARD_WIDTH }]}
                      onPress={() => router.push(`/research/${item.slug}` as any)}
                      activeOpacity={0.75}
                    >
                      {item.cover_image ? (
                        <Image
                          source={{ uri: item.cover_image }}
                          style={[styles.bookCover, { height: COVER_HEIGHT }]}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                          transition={200}
                        />
                      ) : (
                        <View style={[styles.bookCover, styles.bookPlaceholder, { height: COVER_HEIGHT }]}>
                          <Ionicons name="document-text" size={28} color={colors.primary} />
                        </View>
                      )}
                      <View style={styles.cardInfo}>
                        <Text style={styles.bookTitle} numberOfLines={2}>{item.title_th}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                          <Ionicons name="eye-outline" size={9} color={colors.text.muted} />
                          <Text style={styles.hMeta}>{item.views}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
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
      marginTop: spacing.lg,
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
      borderRadius: radius.lg,
      overflow: 'hidden',
      borderWidth: 0,
      ...shadows.md,
    },
    hCover: {
      width: H_CARD_WIDTH,
      height: H_COVER_HEIGHT,
      backgroundColor: colors.primaryLight,
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
    hMeta: { fontSize: 9, color: colors.text.muted },

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
      borderRadius: radius.lg,
      overflow: 'hidden',
      borderWidth: 0,
      ...shadows.md,
    },
    bookCover: { width: '100%', backgroundColor: colors.primaryLight },
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
  });
}
