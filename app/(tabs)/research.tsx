import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Image, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, radius, shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { getPublicResearch, ResearchItem } from '@/lib/research';

export default function ShelfScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicResearch({ limit: 20 }).then(({ data }) => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  const renderItem = ({ item }: { item: ResearchItem }) => (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() => router.push(`/research/${item.slug}`)}
      activeOpacity={0.7}
    >
      {item.cover_image ? (
        <Image source={{ uri: item.cover_image }} style={styles.bookCover} />
      ) : (
        <View style={[styles.bookCover, styles.bookPlaceholder]}>
          <Ionicons name="document-text" size={36} color={colors.primary} />
        </View>
      )}
      <Text style={styles.bookTitle} numberOfLines={2}>{item.title_th}</Text>
      <Text style={styles.bookYear}>{item.year}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ຊັ້ນຫນັງສື</Text>
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => router.push('/search')}
        >
          <Ionicons name="search-outline" size={22} color={colors.text.primary} />
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
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
    searchBtn: { padding: spacing.xs },
    grid: { padding: spacing.md },
    row: { gap: spacing.sm, marginBottom: spacing.sm },
    bookCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
    },
    bookCover: { width: '100%', height: 180 },
    bookPlaceholder: {
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bookTitle: {
      ...typography.label,
      color: colors.text.primary,
      padding: spacing.sm,
      paddingBottom: 2,
    },
    bookYear: {
      ...typography.caption,
      color: colors.text.muted,
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.sm,
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  });
}
