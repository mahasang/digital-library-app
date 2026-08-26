import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ScrollView, Image, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { getPublicResearch, ResearchItem } from '@/lib/research';
import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { spacing, typography, radius } from '@/constants/theme';

export default function SearchScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [searchInput, setSearchInput] = useState('');
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name_th: string; slug: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    supabase.from('categories')
      .select('id, name_th, slug')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setCategories(data ?? []));
  }, []);

  const load = useCallback(async (search: string, category: string | null) => {
    setLoading(true);
    const { data, count } = await getPublicResearch({ search, category: category ?? undefined, limit: 30 });
    setItems(data);
    setTotal(count);
    setLoading(false);
  }, []);

  useEffect(() => { load('', null); }, [load]);

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

  const renderBook = ({ item }: { item: ResearchItem }) => (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() => router.push(`/research/${item.slug}`)}
      activeOpacity={0.7}
    >
      {item.cover_image ? (
        <Image source={{ uri: item.cover_image }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.placeholder]}>
          <Ionicons name="document-text" size={28} color={colors.primary} />
        </View>
      )}
      <Text style={styles.title} numberOfLines={2}>{item.title_th}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {/* Header สีเขียว */}
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

      {/* Category tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, !selectedCategory && styles.tabActive]}
            onPress={() => handleCategory(null)}
          >
            <Text style={[styles.tabText, !selectedCategory && styles.tabTextActive]}>ທັງໝົດ</Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.tab, selectedCategory === cat.slug && styles.tabActive]}
              onPress={() => handleCategory(cat.slug)}
            >
              <Text style={[styles.tabText, selectedCategory === cat.slug && styles.tabTextActive]}>
                {cat.name_th}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Result count */}
      {!loading && (
        <Text style={styles.resultCount}>ຜົນການຄົ້ນຫາ {total} ລາຍການ</Text>
      )}

      {/* Grid */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderBook}
          numColumns={3}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
        />
      )}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
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
    searchInput: { flex: 1, ...typography.body, color: colors.text.primary },
    filterBtn: { padding: 4 },
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
    tabText: { ...typography.label, color: 'rgba(255,255,255,0.9)', fontSize: 13 },
    tabTextActive: { color: colors.primary },
    resultCount: {
      ...typography.caption,
      color: colors.text.secondary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    grid: { padding: spacing.sm },
    row: { gap: spacing.sm, marginBottom: spacing.sm },
    bookCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    cover: { width: '100%', height: 120 },
    placeholder: {
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      ...typography.caption,
      color: colors.text.primary,
      padding: spacing.xs,
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  });
}
