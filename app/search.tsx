import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ScrollView, Image, ActivityIndicator,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
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
const COVER_HEIGHT = Math.round(CARD_WIDTH * 1.4); // อัตราส่วนปกหนังสือ

/** แปลง พ.ศ → ค.ศ */
function toAD(year: number) {
  return year > 2500 ? year - 543 : year;
}

export default function SearchScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [searchInput, setSearchInput] = useState('');
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name_th: string; slug: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // โหลดหมวดหมู่
  useEffect(() => {
    supabase
      .from('categories')
      .select('id, name_th, slug')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setCategories(data ?? []));
  }, []);

  const load = useCallback(async (search: string, category: string | null) => {
    setLoading(true);
    const { data, count } = await getPublicResearch({
      search,
      category: category ?? undefined,
      limit: 30,
    });
    setItems(data);
    setTotal(count);
    setLoading(false);
  }, []);

  useEffect(() => {
    load('', null);
  }, [load]);

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  function handleInput(text: string) {
    setSearchInput(text);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(text, selectedCategory), 400);
  }

  function clearSearch() {
    setSearchInput('');
    clearTimeout(debounceRef.current);
    load('', selectedCategory);
  }

  function handleCategory(slug: string | null) {
    setSelectedCategory(slug);
    clearTimeout(debounceRef.current);
    load(searchInput, slug);
  }

  // Card แต่ละรายการ — ขนาด fixed width เพื่อให้ grid สม่ำเสมอ
  const renderBook = ({ item }: { item: ResearchItem }) => (
    <TouchableOpacity
      style={[styles.bookCard, { width: CARD_WIDTH }]}
      onPress={() => router.push(`/research/${item.slug}`)}
      activeOpacity={0.75}
    >
      {/* ปกหนังสือ */}
      {item.cover_image ? (
        <Image
          source={{ uri: item.cover_image }}
          style={[styles.cover, { height: COVER_HEIGHT }]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.cover, styles.placeholder, { height: COVER_HEIGHT }]}>
          <Ionicons name="document-text" size={28} color={colors.primary} />
        </View>
      )}

      {/* ข้อมูลใต้ปก */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title_th}
        </Text>
        {item.year ? (
          <Text style={styles.cardYear} numberOfLines={1}>
            {toAD(item.year)}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ── Header (สีหลัก) ── */}
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
        {/* ปุ่ม filter (ไว้ขยายในอนาคต) */}
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="options-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Category tabs ── */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {/* ทังหมด */}
          <TouchableOpacity
            style={[styles.tab, !selectedCategory && styles.tabActive]}
            onPress={() => handleCategory(null)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, !selectedCategory && styles.tabTextActive]}>
              ທັງໝົດ
            </Text>
          </TouchableOpacity>

          {/* หมวดหมู่จาก DB */}
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.tab, selectedCategory === cat.slug && styles.tabActive]}
              onPress={() => handleCategory(cat.slug)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedCategory === cat.slug && styles.tabTextActive,
                ]}
              >
                {cat.name_th}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Filter chips แนวนอน (radio style) ── */}
      <View style={styles.filterRow}>
        {/* Radio: ทังหมด */}
        <TouchableOpacity
          style={styles.radioChip}
          onPress={() => handleCategory(null)}
          activeOpacity={0.8}
        >
          <View style={[
            styles.radioCircle,
            !selectedCategory && styles.radioCircleActive,
          ]}>
            {!selectedCategory && <View style={styles.radioInner} />}
          </View>
          <Text style={styles.radioText}>ທັງໝົດ</Text>
        </TouchableOpacity>

        {/* Radio chips สำหรับ 4 หมวดแรก */}
        {categories.slice(0, 4).map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.radioChip}
            onPress={() => handleCategory(cat.slug)}
            activeOpacity={0.8}
          >
            <View style={[
              styles.radioCircle,
              selectedCategory === cat.slug && styles.radioCircleActive,
            ]}>
              {selectedCategory === cat.slug && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioText} numberOfLines={1}>{cat.name_th}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── จำนวนผลลัพธ์ ── */}
      {!loading && (
        <Text style={styles.resultCount}>
          ຜົນການຄົ້ນຫາ {total} ລາຍການ
        </Text>
      )}

      {/* ── Grid ── */}
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
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderBook}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
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
      paddingVertical: 0, // Android fix
    },
    filterBtn: { padding: 4 },

    // ── Category tabs (บน header สี) ──
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

    // ── Filter radio chips (ใต้ header) ──
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SIDE_PADDING,
      paddingVertical: spacing.sm,
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexWrap: 'wrap',
    },
    radioChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    radioCircle: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioCircleActive: {
      borderColor: colors.primary,
    },
    radioInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    radioText: {
      ...typography.caption,
      color: colors.text.secondary,
      fontSize: 13,
      maxWidth: 70,
    },

    // ── Result count ──
    resultCount: {
      ...typography.caption,
      color: colors.text.secondary,
      paddingHorizontal: SIDE_PADDING,
      paddingVertical: spacing.sm,
    },

    // ── Book grid ──
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
    cover: {
      width: '100%',
    },
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
    cardYear: {
      fontSize: 10,
      color: colors.text.muted,
      marginTop: 2,
    },

    // ── Empty / Loading ──
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
