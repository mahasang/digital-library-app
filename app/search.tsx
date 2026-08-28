import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ScrollView, ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { getPublicResearch, ResearchItem } from '@/lib/research';
import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { spacing, typography, radius, shadows } from '@/constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const NUM_COLUMNS = 3;
const CARD_GAP = 8;
const SIDE_PADDING = 12;
const CARD_WIDTH = (SCREEN_WIDTH - SIDE_PADDING * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const COVER_HEIGHT = Math.round(CARD_WIDTH * 1.4);
const PAGE_SIZE = 20;

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

function StarRow({ score = 0, colors }: { score?: number; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1, marginTop: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Text key={i} style={{ fontSize: 9, color: i <= Math.round(score) ? '#f59e0b' : colors.border }}>★</Text>
      ))}
    </View>
  );
}

type Category = { id: string; name_th: string; slug: string; count?: number };

export default function SearchScreen() {
  const { colors } = useTheme();
  const { category: categoryParam } = useLocalSearchParams<{ category?: string }>();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const flatListRef = useRef<FlatList>(null);

  const [searchInput, setSearchInput] = useState('');
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    categoryParam ?? null
  );
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // โหลด categories พร้อม count แต่ละหมวด
  useEffect(() => {
    supabase
      .from('categories')
      .select('id, name_th, slug')
      .eq('is_active', true)
      .order('sort_order')
      .then(async ({ data }) => {
        if (!data) return;
        // ดึง count แต่ละหมวดพร้อมกัน — ต้อง embed research_categories!inner เพื่อให้
        // .eq('research_categories.categories.slug', ...) กรองแถวนอกได้จริง (เหมือน
        // RESEARCH_SELECT_BY_CATEGORY ใน lib/research.ts) และกรอง access_level ให้ตรงกับ
        // ที่ getPublicResearch ใช้แสดงผลจริง ไม่งั้นตัวเลขบน tab จะไม่ตรงกับผลลัพธ์ที่กดเข้าไปเห็น
        const withCount = await Promise.all(
          data.map(async (cat) => {
            const { count } = await supabase
              .from('research_items')
              .select('id, research_categories!inner ( categories!inner ( slug ) )', { count: 'exact', head: true })
              .eq('status', 'published')
              .in('access_level', ['public', 'read_only', 'metadata_only'])
              .eq('research_categories.categories.slug', cat.slug);
            return { ...cat, count: count ?? 0 };
          })
        );
        setCategories(withCount);
      });
  }, []);

  const load = useCallback(async (
    search: string,
    category: string | null,
    pageNum: number
  ) => {
    setLoading(true);
    const { data, count } = await getPublicResearch({
      search,
      category: category ?? undefined,
      limit: PAGE_SIZE,
      page: pageNum,
    });
    setItems(data);
    setTotal(count);
    setLoading(false);
  }, []);

  // โหลดครั้งแรก + โหลด count รวม — ใช้ category จาก param ถ้ามี
  useEffect(() => {
    load('', categoryParam ?? null, 1);
  }, [load, categoryParam]);

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  function handleInput(text: string) {
    setSearchInput(text);
    setPage(1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(text, selectedCategory, 1), 400);
  }

  function clearSearch() {
    setSearchInput('');
    setPage(1);
    clearTimeout(debounceRef.current);
    load('', selectedCategory, 1);
  }

  function handleCategory(slug: string | null) {
    setSelectedCategory(slug);
    setPage(1);
    clearTimeout(debounceRef.current);
    load(searchInput, slug, 1);
    // scroll to top
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }

  function handlePage(newPage: number) {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    load(searchInput, selectedCategory, newPage);
    // scroll to top smooth
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 100);
  }

  // นับ total ทั้งหมด (tab ທັງໝົດ)
  const [allTotal, setAllTotal] = useState(0);
  useEffect(() => {
    getPublicResearch({ limit: 1, page: 1 }).then(({ count }) => setAllTotal(count));
  }, []);

  const renderBook = ({ item }: { item: ResearchItem }) => (
    <TouchableOpacity
      style={[styles.bookCard, { width: CARD_WIDTH }]}
      onPress={() => router.push(`/research/${item.slug}` as any)}
      activeOpacity={0.75}
    >
      {item.cover_image ? (
        <Image
          source={{ uri: item.cover_image }}
          style={[styles.cover, { height: COVER_HEIGHT }]}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
        />
      ) : (
        <View style={[styles.cover, styles.placeholder, { height: COVER_HEIGHT }]}>
          <Ionicons name="document-text" size={28} color={colors.primary} />
        </View>
      )}
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title_th}</Text>
        <StarRow score={0} colors={colors} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
          <Ionicons name="eye-outline" size={9} color={colors.text.muted} />
          <Text style={styles.cardMeta}>{item.views}</Text>
          {item.published_at ? (
            <Text style={[styles.cardMeta, { marginLeft: 2 }]}>{relativeTime(item.published_at)}</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Pagination bar
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    // แสดงหน้าแบบ window: prev, [1]...[current-1][current][current+1]...[last], next
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return (
      <View style={styles.pagination}>
        {/* Prev */}
        <TouchableOpacity
          style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
          onPress={() => handlePage(page - 1)}
          disabled={page === 1}
        >
          <Ionicons name="chevron-back" size={16} color={page === 1 ? colors.text.muted : colors.primary} />
        </TouchableOpacity>

        {/* Page numbers */}
        {pages.map((p, idx) =>
          p === '...' ? (
            <Text key={`dots-${idx}`} style={styles.pageDots}>…</Text>
          ) : (
            <TouchableOpacity
              key={p}
              style={[styles.pageBtn, p === page && styles.pageBtnActive]}
              onPress={() => handlePage(p as number)}
            >
              <Text style={[styles.pageNum, p === page && styles.pageNumActive]}>
                {p}
              </Text>
            </TouchableOpacity>
          )
        )}

        {/* Next */}
        <TouchableOpacity
          style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
          onPress={() => handlePage(page + 1)}
          disabled={page === totalPages}
        >
          <Ionicons name="chevron-forward" size={16} color={page === totalPages ? colors.text.muted : colors.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={colors.text.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="ຄົ້ນຫາງານວິໄຈ..."
            placeholderTextColor={colors.text.muted}
            value={searchInput}
            onChangeText={handleInput}
            autoFocus
            returnKeyType="search"
          />
          {searchInput.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={16} color={colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="options-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Category tabs พร้อม count ── */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {/* ທັງໝົດ */}
          <TouchableOpacity
            style={[styles.tab, !selectedCategory && styles.tabActive]}
            onPress={() => handleCategory(null)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, !selectedCategory && styles.tabTextActive]}>
              ທັງໝົດ{allTotal > 0 ? ` (${allTotal})` : ''}
            </Text>
          </TouchableOpacity>

          {/* หมวดหมู่ */}
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.tab, selectedCategory === cat.slug && styles.tabActive]}
              onPress={() => handleCategory(cat.slug)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, selectedCategory === cat.slug && styles.tabTextActive]}>
                {cat.name_th}{cat.count != null ? ` (${cat.count})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Result count + หน้าปัจจุบัน ── */}
      {!loading && (
        <Text style={styles.resultCount}>
          ຜົນການຄົ້ນຫາ {total} ລາຍການ
          {totalPages > 1 ? `  ·  ໜ້າ ${page}/${totalPages}` : ''}
        </Text>
      )}

      {/* ── Grid + Pagination ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={48} color={colors.text.muted} />
          <Text style={[styles.resultCount, { marginTop: spacing.md }]}>
            ບໍ່ພົບງານວິໄຈ
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderBook}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderPagination}
        />
      )}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    // ── Header ──
    header: {
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: spacing.xxl,
      paddingBottom: spacing.md,
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
    },
    backBtn: { padding: 4 },
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: radius.full,
      paddingHorizontal: spacing.md,
      height: 40,
      gap: spacing.sm,
    },
    searchInput: {
      flex: 1,
      ...typography.body,
      color: colors.text.primary,
      paddingVertical: 0,
    },
    filterBtn: { padding: 4 },

    // ── Tabs ──
    tabsWrapper: {
      backgroundColor: colors.primary,
      paddingBottom: spacing.sm,
    },
    tabs: {
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
    },
    tab: {
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radius.full,
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    tabActive: { backgroundColor: '#fff' },
    tabText: {
      ...typography.label,
      color: 'rgba(255,255,255,0.9)',
      fontSize: 13,
    },
    tabTextActive: { color: colors.primary },

    // ── Result count ──
    resultCount: {
      ...typography.caption,
      color: colors.text.secondary,
      paddingHorizontal: SIDE_PADDING,
      paddingVertical: spacing.sm,
    },

    // ── Grid ──
    grid: {
      paddingHorizontal: SIDE_PADDING,
      paddingBottom: spacing.xl,
    },
    row: {
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
    cover: { width: '100%', backgroundColor: colors.primaryLight },
    placeholder: {
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardInfo: {
      padding: spacing.xs,
      paddingBottom: 6,
    },
    cardTitle: {
      ...typography.caption,
      color: colors.text.primary,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: '600',
    },
    cardMeta: { fontSize: 9, color: colors.text.muted },

    // ── Pagination ──
    pagination: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
    },
    pageBtn: {
      minWidth: 36,
      height: 36,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    pageBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    pageBtnDisabled: {
      opacity: 0.4,
    },
    pageNum: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text.primary,
    },
    pageNumActive: {
      color: '#fff',
    },
    pageDots: {
      fontSize: 14,
      color: colors.text.muted,
      paddingHorizontal: 4,
    },

    // ── Empty/Loading ──
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
