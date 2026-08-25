import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TextInput, TouchableOpacity,
  Image, RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, radius, shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { getPublicResearch, ResearchItem } from '@/lib/research';
import { ResearchCardSkeleton } from '@/components/ui/Skeleton';

export default function ResearchScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [total, setTotal] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(async (searchTerm = '') => {
    setLoading(true);
    const { data, count } = await getPublicResearch({ search: searchTerm, limit: 20 });
    setItems(data);
    setTotal(count);
    setLoading(false);
  }, []);

  useEffect(() => { load(''); }, [load]);

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  function handleSearchInput(text: string) {
    setSearchInput(text);
    // debounce 400ms — ค้นหาหลังหยุดพิมพ์
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      load(text);
    }, 400);
  }

  function clearSearch() {
    setSearchInput('');
    clearTimeout(debounceRef.current);
    load('');
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await load(searchInput);
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: ResearchItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/research/${item.slug}`)}
      activeOpacity={0.7}
    >
      {/* Cover / Icon */}
      <View style={styles.coverArea}>
        {item.cover_image ? (
          <Image source={{ uri: item.cover_image }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]}>
            <Ionicons name="document-text" size={28} color={colors.primary} />
          </View>
        )}
      </View>

      {/* Content */}
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
          <Text style={styles.year}>{item.year}</Text>
          <View style={styles.stats}>
            <Ionicons name="eye-outline" size={11} color={colors.text.muted} />
            <Text style={styles.statText}>{item.views}</Text>
            <Ionicons name="download-outline" size={11} color={colors.text.muted} />
            <Text style={styles.statText}>{item.downloads}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>ງານວິໄຈ</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.text.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="ຄົ້ນຫາງານວິໄຈ..."
            placeholderTextColor={colors.text.muted}
            value={searchInput}
            onChangeText={handleSearchInput}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchInput.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={18} color={colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>
        {total > 0 && (
          <Text style={styles.totalText}>ພົບ {total} ລາຍການ</Text>
        )}
      </View>

      {loading ? (
        <View style={styles.list}>
          {[1, 2, 3, 4, 5].map((i) => (
            <ResearchCardSkeleton key={i} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={48} color={colors.text.muted} />
          <Text style={styles.emptyText}>ບໍ່ພົບງານວິໄຈ</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
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
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: spacing.sm,
    },
    headerTitle: { ...typography.h3, color: colors.text.primary },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: radius.full,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      height: 46,
      gap: spacing.sm,
    },
    searchInput: { flex: 1, ...typography.body, color: colors.text.primary },
    totalText: { ...typography.caption, color: colors.text.secondary },
    list: { padding: spacing.md, gap: spacing.sm },
    card: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      ...shadows.sm,
    },
    coverArea: {
      width: 90,
    },
    cover: { width: 90, height: 120 },
    coverPlaceholder: {
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardContent: {
      flex: 1,
      padding: spacing.md,
      gap: 4,
      justifyContent: 'center',
    },
    title: { ...typography.label, color: colors.text.primary, lineHeight: 20 },
    titleEn: { ...typography.caption, color: colors.text.secondary },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primaryLight,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      marginTop: 2,
    },
    badgeText: { ...typography.caption, color: colors.primary },
    meta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
    year: { ...typography.caption, color: colors.text.muted },
    stats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText: { ...typography.caption, color: colors.text.muted },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
    emptyText: { ...typography.body, color: colors.text.muted },
  });
}
