import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Image, RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, radius, shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { getFavoriteResearch } from '@/lib/profile';
import { ResearchItem } from '@/lib/research';
import { ResearchCardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';

export default function FavoritesScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getFavoriteResearch();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: ResearchItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/research/${item.slug}`)}
      activeOpacity={0.7}
    >
      <View style={styles.coverArea}>
        {item.cover_image ? (
          <Image source={{ uri: item.cover_image }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]}>
            <Ionicons name="document-text" size={28} color={colors.primary} />
          </View>
        )}
      </View>
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
        <Text style={styles.headerTitle}>ລາຍການທີ່ມັກ</Text>
      </View>

      {loading ? (
        <View style={styles.list}>
          {[1, 2, 3].map((i) => (
            <ResearchCardSkeleton key={i} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="heart-outline" size={40} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>ຍັງບໍ່ມີລາຍການທີ່ມັກ</Text>
          <Text style={styles.emptyText}>
            ກົດ ❤️ ໃນໜ້າລາຍລະອຽດງານວິໄຈ ເພື່ອບັນທຶກໄວ້ອ່ານພາຍຫຼັງ
          </Text>
          <Button
            title="ຄົ້ນຫາງານວິໄຈ"
            onPress={() => router.push('/search')}
            style={styles.emptyBtn}
          />
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
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: { ...typography.h3, color: colors.text.primary },
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
    coverArea: { width: 90 },
    cover: { width: 90, height: 120 },
    coverPlaceholder: {
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardContent: { flex: 1, padding: spacing.md, gap: 4, justifyContent: 'center' },
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
    meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    year: { ...typography.caption, color: colors.text.muted },
    stats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText: { ...typography.caption, color: colors.text.muted },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      padding: spacing.xl,
    },
    emptyIcon: {
      width: 80, height: 80,
      borderRadius: radius.full,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    emptyTitle: { ...typography.h3, color: colors.text.primary },
    emptyText: {
      ...typography.bodySmall,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    emptyBtn: { minWidth: 200 },
  });
}
