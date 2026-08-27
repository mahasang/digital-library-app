import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Image, ActivityIndicator,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, radius, shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { getPublicResearch, ResearchItem } from '@/lib/research';

const SCREEN_WIDTH = Dimensions.get('window').width;
const NUM_COLUMNS = 3;
const CARD_GAP = 8;
const SIDE_PADDING = 12;
const CARD_WIDTH = (SCREEN_WIDTH - SIDE_PADDING * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const COVER_HEIGHT = Math.round(CARD_WIDTH * 1.4);

/** แปลง พ.ศ → ค.ศ */
function toAD(year: number) {
  return year > 2500 ? year - 543 : year;
}

export default function ShelfScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicResearch({ limit: 30 }).then(({ data }) => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  const renderItem = ({ item }: { item: ResearchItem }) => (
    <TouchableOpacity
      style={[styles.bookCard, { width: CARD_WIDTH }]}
      onPress={() => router.push(`/research/${item.slug}`)}
      activeOpacity={0.75}
    >
      {item.cover_image ? (
        <Image
          source={{ uri: item.cover_image }}
          style={[styles.bookCover, { height: COVER_HEIGHT }]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.bookCover, styles.bookPlaceholder, { height: COVER_HEIGHT }]}>
          <Ionicons name="document-text" size={28} color={colors.primary} />
        </View>
      )}
      <View style={styles.cardInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>{item.title_th}</Text>
        {item.year ? (
          <Text style={styles.bookYear}>{toAD(item.year)}</Text>
        ) : null}
      </View>
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
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="library-outline" size={48} color={colors.text.muted} />
          <Text style={styles.emptyText}>ບໍ່ພົບງານວິໄຈ</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
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

    grid: {
      paddingHorizontal: SIDE_PADDING,
      paddingTop: spacing.md,
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
    bookCover: { width: '100%' },
    bookPlaceholder: {
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardInfo: {
      padding: spacing.xs,
      paddingBottom: 6,
    },
    bookTitle: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.text.primary,
      lineHeight: 15,
    },
    bookYear: {
      fontSize: 10,
      color: colors.text.muted,
      marginTop: 2,
    },
    emptyText: {
      ...typography.caption,
      color: colors.text.muted,
      marginTop: spacing.md,
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  });
}
