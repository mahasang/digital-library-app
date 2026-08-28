import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { spacing, typography, radius, shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { getResearchStats, getPublicResearch, ResearchItem } from '@/lib/research';

const H_CARD_WIDTH = 110;
const H_COVER_HEIGHT = 154; // ratio 1:1.4

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

function StarRow({ score = 0 }: { score?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1, marginTop: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Text key={i} style={{ fontSize: 9, color: i <= Math.round(score) ? '#f59e0b' : '#d1d5db' }}>★</Text>
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [stats, setStats] = useState({ research: 0, categories: 0, organizations: 0 });
  const [popular, setPopular] = useState<ResearchItem[]>([]);
  const [popularTotal, setPopularTotal] = useState(0);
  const [latest, setLatest] = useState<ResearchItem[]>([]);
  const [latestTotal, setLatestTotal] = useState(0);

  useEffect(() => {
    getResearchStats().then(setStats);
    getPublicResearch({ limit: 10, sort: 'views' }).then(({ data, count }) => {
      setPopular(data);
      setPopularTotal(count);
    });
    getPublicResearch({ limit: 10, sort: 'latest' }).then(({ data, count }) => {
      setLatest(data);
      setLatestTotal(count);
    });
  }, []);

  /** Card แนวนอน ใช้ทั้ง popular และ latest */
  const renderHCard = ({ item }: { item: ResearchItem }) => (
    <TouchableOpacity
      style={styles.hCard}
      onPress={() => router.push(`/research/${item.slug}` as any)}
      activeOpacity={0.75}
    >
      {item.cover_image ? (
        <Image
          source={{ uri: item.cover_image }}
          style={styles.hCover}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
        />
      ) : (
        <View style={[styles.hCover, styles.hPlaceholder]}>
          <Ionicons name="document-text" size={24} color={colors.primary} />
        </View>
      )}
      <View style={styles.hInfo}>
        <Text style={styles.hTitle} numberOfLines={2}>{item.title_th}</Text>
        <StarRow score={0} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <Ionicons name="eye-outline" size={9} color={colors.text.muted} />
          <Text style={styles.hMeta}>{item.views}</Text>
          {item.published_at ? (
            <Text style={[styles.hMeta, { marginLeft: 2 }]}>{relativeTime(item.published_at)}</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* โลโก้ */}
          <View style={styles.logoBox}>
            <Ionicons name="library" size={22} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.greeting}>ສະບາຍດີ 👋</Text>
            <Text style={styles.headerTitle}>ຫ້ອງສະໝຸດດິຈິຕອນ</Text>
          </View>
        </View>
        {/* ไม่มีปุ่ม search */}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Hero Banner (เล็กลง 50%) ── */}
        <LinearGradient
          colors={isDark ? ['#1e3a5f', '#0f172a'] : ['#185ff2', '#1248c4']}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>ຍິນດີຕ້ອນຮັບ 👋</Text>
            <Text style={styles.heroSubtitle}>
              ຄົ້ນຫາງານວິໄຈກວ່າ {stats.research} ລາຍການ
            </Text>
            <TouchableOpacity
              style={styles.heroBtn}
              onPress={() => router.push('/search')}
            >
              <Text style={styles.heroBtnText}>ຄົ້ນຫາງານວິໄຈ →</Text>
            </TouchableOpacity>
          </View>
          <Ionicons
            name="library"
            size={56}
            color="rgba(255,255,255,0.15)"
            style={styles.heroIcon}
          />
        </LinearGradient>

        {/* ── Stats (เล็กลง) ── */}
        <View style={styles.statsRow}>
          {[
            { label: 'ງານວິໄຈ', value: stats.research.toString(), icon: 'document-text-outline' },
            { label: 'ຫມວດຫມູ່', value: stats.categories.toString(), icon: 'folder-outline' },
            { label: 'ຫນ່ວຍງານ', value: stats.organizations.toString(), icon: 'business-outline' },
          ].map((stat) => (
            <Card key={stat.label} style={styles.statCard}>
              <Ionicons name={stat.icon as any} size={18} color={colors.primary} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Card>
          ))}
        </View>

        {/* ── ລາຍການຍອດນິຍົມ ── */}
        {popular.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>ລາຍການຍອດນິຍົມ</Text>
              {popularTotal > 10 && (
                <TouchableOpacity onPress={() => router.push('/(tabs)/research' as any)}>
                  <Text style={styles.seeAll}>ເບິ່ງເພີ່ມເຕີມ →</Text>
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={popular}
              keyExtractor={(item) => item.id}
              renderItem={renderHCard}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
              ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
            />
          </View>
        )}

        {/* ── ງານວິໄຈລ່າສຸດ ── */}
        {latest.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>ງານວິໄຈລ່າສຸດ</Text>
              {latestTotal > 10 && (
                <TouchableOpacity onPress={() => router.push('/(tabs)/research' as any)}>
                  <Text style={styles.seeAll}>ເບິ່ງເພີ່ມເຕີມ →</Text>
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={latest}
              keyExtractor={(item) => item.id}
              renderItem={renderHCard}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
              ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    // ── Header ──
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
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    logoBox: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    greeting: { ...typography.caption, color: colors.text.secondary },
    headerTitle: { ...typography.h3, color: colors.text.primary },

    scroll: { padding: spacing.md, gap: spacing.md },

    // ── Hero (เล็กลง 50%) ──
    hero: {
      borderRadius: radius.xl,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      overflow: 'hidden',
      position: 'relative',
    },
    heroContent: { gap: 4 },
    heroTitle: { ...typography.h3, color: '#fff' },
    heroSubtitle: { ...typography.caption, color: 'rgba(255,255,255,0.85)' },
    heroBtn: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      marginTop: spacing.xs,
    },
    heroBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },
    heroIcon: {
      position: 'absolute',
      right: -8,
      top: -8,
    },

    // ── Stats (เล็กลง) ──
    statsRow: { flexDirection: 'row', gap: spacing.sm },
    statCard: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
      padding: spacing.sm,
    },
    statValue: { ...typography.h3, color: colors.primary },
    statLabel: { fontSize: 10, color: colors.text.secondary, textAlign: 'center' },

    // ── Section ──
    section: {},
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    sectionTitle: { ...typography.h3, color: colors.text.primary },
    seeAll: { ...typography.bodySmall, color: colors.primary },

    // ── Horizontal card ──
    hList: { paddingBottom: spacing.xs },
    hCard: {
      width: H_CARD_WIDTH,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
    },
    hCover: {
      width: H_CARD_WIDTH,
      height: H_COVER_HEIGHT,
      backgroundColor: colors.primaryLight,
    },
    hPlaceholder: {
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hInfo: {
      padding: spacing.xs,
      paddingBottom: 6,
    },
    hTitle: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.text.primary,
      lineHeight: 15,
    },
    hMeta: { fontSize: 9, color: colors.text.muted },
  });
}
