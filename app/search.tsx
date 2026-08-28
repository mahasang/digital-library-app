import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ScrollView, ActivityIndicator,
  Dimensions, Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/contexts/LanguageContext';
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
  const t = useT();
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

  const [filterVisible, setFilterVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'views' | 'downloads'>('latest');
  const [accessLevel, setAccessLevel] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [activeFilters, setActiveFilters] = useState(0); // จำนวน filter ที่ active

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

  // โหลดครั้งแรก + โหลด count รวม — ใช้ category จาก param ถ้ามี
  // หมายเหตุ: deps ตั้งใจไม่ใส่ `load` — load เปลี่ยน identity ทุกครั้งที่ sortBy/accessLevel/
  // yearFrom/yearTo เปลี่ยน (จากการแตะ chip ใน filter modal ก่อนกด "ນຳໃຊ້" ด้วยซ้ำ) ถ้าใส่ `load`
  // ไว้ effect นี้จะยิงซ้ำและล้าง search กลับเป็นค่าว่าง+หน้า 1 โดยไม่ได้ตั้งใจทุกครั้งที่แตะ chip
  // ปุ่ม ນຳໃຊ້/ລ້າງຕົວກອງ ส่งค่า filter ครบทุกตัวแบบ explicit อยู่แล้ว ไม่ได้พึ่ง default param ของ load ตรงนี้
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load('', categoryParam ?? null, 1);
  }, [categoryParam]);

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
            placeholder={t('search_placeholder')}
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
              {t('search_all')}{allTotal > 0 ? ` (${allTotal})` : ''}
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
          {t('search_result')} {total} {t('search_items')}
          {totalPages > 1 ? `  ·  ${t('search_page')} ${page}/${totalPages}` : ''}
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
            {t('search_empty')}
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

      <Modal visible={filterVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('filter_title')}</Text>
              <TouchableOpacity onPress={() => setFilterVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Sort */}
            <Text style={styles.filterLabel}>{t('filter_sort')}</Text>
            <View style={styles.filterChips}>
              {([
                { key: 'latest', label: t('filter_latest') },
                { key: 'views', label: t('filter_popular') },
                { key: 'downloads', label: t('filter_downloads') },
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
            <Text style={styles.filterLabel}>{t('filter_access')}</Text>
            <View style={styles.filterChips}>
              {([
                { key: '', label: t('search_all') },
                { key: 'public', label: t('filter_public') },
                { key: 'read_only', label: t('filter_readonly') },
                { key: 'metadata_only', label: t('filter_meta') },
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
            <Text style={styles.filterLabel}>{t('filter_year')}</Text>
            <View style={styles.yearRow}>
              <TextInput
                style={styles.yearInput}
                placeholder={t('year_from')}
                placeholderTextColor={colors.text.muted}
                value={yearFrom}
                onChangeText={setYearFrom}
                keyboardType="numeric"
                maxLength={4}
              />
              <Text style={{ color: colors.text.muted }}>—</Text>
              <TextInput
                style={styles.yearInput}
                placeholder={t('year_to')}
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
                <Text style={styles.resetText}>{t('filter_reset')}</Text>
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
                <Text style={styles.applyText}>{t('filter_apply')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
