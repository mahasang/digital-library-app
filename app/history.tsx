import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet,
  TouchableOpacity, RefreshControl, Alert,
  Animated, PanResponder, SectionList,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, radius, shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { getReadingHistory, ReadingHistoryItem } from '@/lib/profile';
import { ResearchCardSkeleton } from '@/components/ui/Skeleton';

function toAD(year: number) {
  return year > 2500 ? year - 543 : year;
}

type ThemeColors = ReturnType<typeof useTheme>['colors'];

// stub — implement ใน Phase หลัง
async function clearAllHistory(): Promise<void> { /* TODO: implement in lib/profile.ts */ }
async function removeHistoryItem(_id: string): Promise<void> { /* TODO: implement in lib/profile.ts */ }

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'ມື້ນີ້';
  if (date.toDateString() === yesterday.toDateString()) return 'ມື້ວານ';
  return date.toLocaleDateString('lo-LA', { day: 'numeric', month: 'long', year: 'numeric' });
}

// group items by date อ่านจริง (read_at) — ไม่ใช้ published_at ของ research_items
// เพราะนั่นคือวันที่ตีพิมพ์ ไม่เกี่ยวกับวันที่ user เปิดอ่าน
function groupByDate(items: ReadingHistoryItem[]): { title: string; data: ReadingHistoryItem[] }[] {
  const groups: Record<string, ReadingHistoryItem[]> = {};
  items.forEach(item => {
    const label = getDateLabel(item.read_at);
    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  });
  return Object.entries(groups).map(([title, data]) => ({ title, data }));
}

// Swipeable card
function SwipeableHistoryCard({
  item,
  onPress,
  onRemove,
  styles,
  colors,
}: {
  item: ReadingHistoryItem;
  onPress: () => void;
  onRemove: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const SWIPE_THRESHOLD = -80;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && g.dx < 0,
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) translateX.setValue(Math.max(g.dx, -100));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < SWIPE_THRESHOLD) {
          Animated.timing(translateX, { toValue: -90, duration: 150, useNativeDriver: true }).start();
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  function handleRemove() {
    Alert.alert('ລຶບອອກ', 'ທ່ານຕ້ອງການລຶບອອກຈາກປະຫວັດການອ່ານບໍ?', [
      { text: 'ຍົກເລີກ', style: 'cancel', onPress: () => Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start() },
      {
        text: 'ລຶບ', style: 'destructive', onPress: () => {
          Animated.timing(translateX, { toValue: -400, duration: 250, useNativeDriver: true }).start(() => onRemove());
        },
      },
    ]);
  }

  return (
    <View style={{ position: 'relative', marginBottom: spacing.sm }}>
      <View style={styles.swipeBg}>
        <TouchableOpacity onPress={handleRemove} style={styles.swipeAction}>
          <Ionicons name="trash-outline" size={22} color="#fff" />
          <Text style={styles.swipeText}>ລຶບ</Text>
        </TouchableOpacity>
      </View>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
          <View style={styles.coverArea}>
            {item.cover_image ? (
              <Image
                source={{ uri: item.cover_image }}
                style={styles.cover}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
              />
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
              <Text style={styles.year}>{toAD(item.year)}</Text>
              <View style={styles.stats}>
                <Ionicons name="eye-outline" size={11} color={colors.text.muted} />
                <Text style={styles.statText}>{item.views}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function HistoryScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [items, setItems] = useState<ReadingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getReadingHistory();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  function handleRemove(item: ReadingHistoryItem) {
    removeHistoryItem(item.id);
    setItems(prev => prev.filter(i => i.id !== item.id));
  }

  function handleClearAll() {
    Alert.alert('ລົບທັງໝົດ', 'ທ່ານຕ້ອງການລົບປະຫວັດການອ່ານທັງໝົດບໍ?', [
      { text: 'ຍົກເລີກ', style: 'cancel' },
      {
        text: 'ລົບທັງໝົດ', style: 'destructive',
        onPress: () => { clearAllHistory(); setItems([]); },
      },
    ]);
  }

  const sections = useMemo(() => groupByDate(items), [items]);

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ປະຫວັດການອ່ານ</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
            <Text style={styles.clearText}>ລົບທັງໝົດ</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.list}>
          {[1, 2, 3].map(i => <ResearchCardSkeleton key={i} />)}
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="time-outline" size={40} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>ຍັງບໍ່ມີປະຫວັດການອ່ານ</Text>
          <Text style={styles.emptyText}>
            ງານວິໄຈທີ່ທ່ານເປີດອ່ານຈະຖືກບັນທຶກໄວ້ທີ່ນີ້
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <SwipeableHistoryCard
              item={item}
              onPress={() => router.push(`/research/${item.slug}` as any)}
              onRemove={() => handleRemove(item)}
              styles={styles}
              colors={colors}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: spacing.md,
    },
    backBtn: { padding: spacing.xs },
    headerTitle: { ...typography.h3, color: colors.text.primary, flex: 1 },
    clearBtn: { padding: spacing.xs },
    clearText: { ...typography.caption, color: colors.error },
    sectionHeader: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.xs,
    },
    sectionTitle: { ...typography.label, color: colors.text.muted, fontSize: 12 },
    list: { padding: spacing.md },
    swipeBg: {
      position: 'absolute',
      right: 0, top: 0, bottom: 0,
      width: 90,
      backgroundColor: colors.error,
      borderRadius: radius.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    swipeAction: { alignItems: 'center', gap: 4 },
    swipeText: { fontSize: 11, color: '#fff', fontWeight: '600' },
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
    cover: { width: 90, height: 120, backgroundColor: colors.primaryLight },
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
    },
    badgeText: { ...typography.caption, color: colors.primary },
    meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    year: { ...typography.caption, color: colors.text.muted },
    stats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText: { ...typography.caption, color: colors.text.muted },
    empty: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      gap: spacing.sm, padding: spacing.xl,
    },
    emptyIcon: {
      width: 80, height: 80, borderRadius: radius.full,
      backgroundColor: colors.primaryLight,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    emptyTitle: { ...typography.h3, color: colors.text.primary },
    emptyText: { ...typography.bodySmall, color: colors.text.secondary, textAlign: 'center' },
  });
}
