import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TextInput, TouchableOpacity, ActivityIndicator,
  Image, RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '@/constants/theme';
import { getPublicResearch, ResearchItem } from '@/lib/research';

export default function ResearchScreen() {
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [total, setTotal] = useState(0);

  const load = useCallback(async (searchTerm = '') => {
    setLoading(true);
    const { data, count } = await getPublicResearch({ search: searchTerm, limit: 20 });
    setItems(data);
    setTotal(count);
    setLoading(false);
  }, []);

  useEffect(() => { load(search); }, [search, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(search);
    setRefreshing(false);
  };

  const handleSearch = () => setSearch(searchInput);

  const renderItem = ({ item }: { item: ResearchItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/research/${item.slug}`)}
      activeOpacity={0.7}
    >
      {item.cover_image ? (
        <Image source={{ uri: item.cover_image }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder]}>
          <Ionicons name="document-text-outline" size={32} color={colors.text.muted} />
        </View>
      )}
      <View style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={2}>{item.title_th}</Text>
        {item.title_en && (
          <Text style={styles.titleEn} numberOfLines={1}>{item.title_en}</Text>
        )}
        <Text style={styles.org} numberOfLines={1}>
          {item.organizations?.name_th ?? ''}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.year}>{item.year}</Text>
          <View style={styles.stats}>
            <Ionicons name="eye-outline" size={12} color={colors.text.muted} />
            <Text style={styles.statText}>{item.views}</Text>
            <Ionicons name="download-outline" size={12} color={colors.text.muted} />
            <Text style={styles.statText}>{item.downloads}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>ງານວິໄຈ</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={colors.text.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="ຄົ້ນຫາ..."
              placeholderTextColor={colors.text.muted}
              value={searchInput}
              onChangeText={setSearchInput}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchInput.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchInput(''); setSearch(''); }}>
                <Ionicons name="close-circle" size={18} color={colors.text.muted} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>ຄົ້ນຫາ</Text>
          </TouchableOpacity>
        </View>
        {total > 0 && (
          <Text style={styles.totalText}>ພົບ {total} ລາຍການ</Text>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
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

const styles = StyleSheet.create({
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
  searchRow: { flexDirection: 'row', gap: spacing.sm },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, ...typography.body, color: colors.text.primary },
  searchBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    justifyContent: 'center',
  },
  searchBtnText: { ...typography.label, color: '#fff' },
  totalText: { ...typography.caption, color: colors.text.secondary },
  list: { padding: spacing.md, gap: spacing.sm },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cover: { width: 80, height: 110 },
  coverPlaceholder: {
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: { flex: 1, padding: spacing.md, gap: 4 },
  title: { ...typography.label, color: colors.text.primary },
  titleEn: { ...typography.caption, color: colors.text.secondary },
  org: { ...typography.caption, color: colors.primary },
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  year: { ...typography.caption, color: colors.text.muted },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { ...typography.caption, color: colors.text.muted },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emptyText: { ...typography.body, color: colors.text.muted },
});
