import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, FlatList, Dimensions, RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { spacing, typography, radius, shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/contexts/LanguageContext';
import { useSession } from '@/hooks/useSession';
import { Card } from '@/components/ui/Card';
import { getResearchStats, getPublicResearch, ResearchItem } from '@/lib/research';
import { getMyProfile, UserProfile } from '@/lib/profile';
import { supabase } from '@/lib/supabase';

const SCREEN_WIDTH = Dimensions.get('window').width;
const H_CARD_WIDTH = 140;
const H_COVER_HEIGHT = 196; // ratio 1:1.4

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

// รูปร่างตรงกับ RPC get_rating_stats() — .single() บน rpc() ที่ไม่มี generated types
// infer เป็น {} เฉยๆ จึงต้อง cast ตรงนี้
type RatingStats = { avg_score: number; rating_count: number };

// แสดง rating เป็นตัวเลข เช่น "4.6 ★"
function RatingBadge({ score, count }: { score: number; count: number }) {
  if (count === 0) return null;
  return (
    <Text style={{ fontSize: 10, color: '#f59e0b', fontWeight: '600', marginTop: 2 }}>
      {score.toFixed(1)} ★
    </Text>
  );
}

function SkeletonCard({ colors }: { colors: any }) {
  return (
    <View style={{
      width: H_CARD_WIDTH, borderRadius: 8,
      backgroundColor: colors.border, overflow: 'hidden',
    }}>
      <View style={{ width: H_CARD_WIDTH, height: H_COVER_HEIGHT, backgroundColor: colors.border }} />
      <View style={{ padding: 8, gap: 4 }}>
        <View style={{ height: 10, backgroundColor: colors.primaryLight, borderRadius: 4 }} />
        <View style={{ height: 10, width: '60%', backgroundColor: colors.primaryLight, borderRadius: 4 }} />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const t = useT();
  const session = useSession();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [stats, setStats] = useState({ research: 0, categories: 0, organizations: 0 });
  const [popular, setPopular] = useState<ResearchItem[]>([]);
  const [popularTotal, setPopularTotal] = useState(0);
  const [latest, setLatest] = useState<ResearchItem[]>([]);
  const [latestTotal, setLatestTotal] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // rating state: researchId → { avg, count }
  const [ratings, setRatings] = useState<Record<string, { avg: number; count: number }>>({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    try {
      getResearchStats().then(setStats).catch(err => console.error(err));
      getPublicResearch({ limit: 10, sort: 'views' }).then(({ data, count }) => {
        setPopular(data);
        setPopularTotal(count);
        loadRatings(data);
      }).catch(err => console.error(err));
      getPublicResearch({ limit: 10, sort: 'latest' }).then(({ data, count }) => {
        setLatest(data);
        setLatestTotal(count);
        loadRatings(data);
      }).catch(err => console.error(err));
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (session) getMyProfile().then(setProfile);
    else setProfile(null);
  }, [session]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([
        getResearchStats().then(setStats),
        getPublicResearch({ limit: 10, sort: 'views' }).then(({ data, count }) => {
          setPopular(data); setPopularTotal(count); loadRatings(data);
        }),
        getPublicResearch({ limit: 10, sort: 'latest' }).then(({ data, count }) => {
          setLatest(data); setLatestTotal(count); loadRatings(data);
        }),
      ]);
    } catch (err) { console.error(err); }
    setRefreshing(false);
  }

  async function loadRatings(items: ResearchItem[]) {
    const results = await Promise.all(
      items.map(item =>
        supabase
          .rpc('get_rating_stats', { p_research_id: item.id })
          .single()
          .then(({ data }) => ({ id: item.id, data: data as unknown as RatingStats | null }))
      )
    );
    setRatings(prev => {
      const next = { ...prev };
      for (const { id, data: stats } of results) {
        if (stats) {
          next[id] = {
            avg: Number(stats.avg_score) ?? 0,
            count: stats.rating_count ?? 0,
          };
        }
      }
      return next;
    });
  }

  const renderHCard = ({ item }: { item: ResearchItem }) => {
    const rating = ratings[item.id];
    return (
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
            <Ionicons name="document-text" size={32} color={colors.primary} />
          </View>
        )}
        <View style={styles.hInfo}>
          <Text style={styles.hTitle} numberOfLines={2}>{item.title_th}</Text>
          {rating && rating.count > 0 && (
            <RatingBadge score={rating.avg} count={rating.count} />
          )}
          {item.views > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Ionicons name="eye-outline" size={9} color={colors.text.muted} />
              <Text style={styles.hMeta}>{item.views}</Text>
              {item.published_at ? (
                <Text style={[styles.hMeta, { marginLeft: 2 }]}>{relativeTime(item.published_at)}</Text>
              ) : null}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Avatar / initials ของ user
  const initials = profile?.full_name
    ? profile.full_name.slice(0, 2).toUpperCase()
    : profile?.email?.slice(0, 2).toUpperCase() ?? '';

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBox}>
            <Ionicons name="library" size={22} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.greeting}>{t('home_greeting')}</Text>
            <Text style={styles.headerTitle}>{t('home_title')}</Text>
          </View>
        </View>

        {/* Avatar หรือ icon ถ้าไม่ login */}
        {session ? (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/account' as any)}
            activeOpacity={0.8}
          >
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatarImg}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={styles.avatarBox}>
                <Text style={styles.avatarText}>{initials || '👤'}</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.push('/(auth)/login' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="person-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* ── Hero Banner ── */}
        <LinearGradient
          colors={isDark ? ['#1e3a5f', '#0f172a'] : ['#185ff2', '#1248c4']}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{t('home_welcome')}</Text>
            <Text style={styles.heroSubtitle}>
              ຄົ້ນຫາງານວິໄຈກວ່າ {stats.research} ລາຍການ
            </Text>
            <TouchableOpacity
              style={styles.heroBtn}
              onPress={() => router.push('/search')}
            >
              <Text style={styles.heroBtnText}>{t('home_search_btn')}</Text>
            </TouchableOpacity>
          </View>
          <Ionicons name="library" size={56} color="rgba(255,255,255,0.15)" style={styles.heroIcon} />
        </LinearGradient>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          {[
            { label: t('stat_research'), value: stats.research.toString(), icon: 'document-text-outline' },
            { label: t('stat_category'), value: stats.categories.toString(), icon: 'folder-outline' },
            { label: t('stat_org'), value: stats.organizations.toString(), icon: 'business-outline' },
          ].map((stat) => (
            <Card key={stat.label} style={styles.statCard}>
              <View style={styles.statIconCircle}>
                <Ionicons name={stat.icon as any} size={18} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Card>
          ))}
        </View>

        {/* ── ລາຍການຍອດນິຍົມ ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home_popular')}</Text>
            {popularTotal > 10 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/research' as any)}>
                <Text style={styles.seeAll}>{t('home_see_more')}</Text>
              </TouchableOpacity>
            )}
          </View>
          {popular.length === 0 ? (
            <View style={{ flexDirection: 'row', gap: spacing.sm, paddingLeft: spacing.xs }}>
              {[1,2,3,4,5].map(i => <SkeletonCard key={i} colors={colors} />)}
            </View>
          ) : (
            <FlatList
              data={popular}
              keyExtractor={(item) => item.id}
              renderItem={renderHCard}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
              ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
            />
          )}
        </View>

        {/* ── ງານວິໄຈລ່າສຸດ ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home_latest')}</Text>
            {latestTotal > 10 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/research' as any)}>
                <Text style={styles.seeAll}>{t('home_see_more')}</Text>
              </TouchableOpacity>
            )}
          </View>
          {latest.length === 0 ? (
            <View style={{ flexDirection: 'row', gap: spacing.sm, paddingLeft: spacing.xs }}>
              {[1,2,3,4,5].map(i => <SkeletonCard key={i} colors={colors} />)}
            </View>
          ) : (
            <FlatList
              data={latest}
              keyExtractor={(item) => item.id}
              renderItem={renderHCard}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
              ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
            />
          )}
        </View>
      </ScrollView>
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
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    logoBox: {
      width: 40, height: 40,
      borderRadius: radius.md,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    greeting: { ...typography.caption, color: colors.text.secondary },
    headerTitle: { ...typography.h3, color: colors.text.primary },

    // Avatar
    avatarImg: {
      width: 40, height: 40,
      borderRadius: 20,
    },
    avatarBox: {
      width: 40, height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { fontSize: 14, fontWeight: '700', color: '#fff' },
    loginBtn: {
      width: 40, height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },

    scroll: { padding: spacing.md, gap: spacing.md },

    hero: {
      borderRadius: radius.xl,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      overflow: 'hidden',
      position: 'relative',
    },
    heroContent: { gap: 4 },
    heroTitle: { ...typography.h3, color: '#fff' },
    heroSubtitle: { ...typography.caption, color: 'rgba(255,255,255,0.95)' },
    heroBtn: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      marginTop: spacing.xs,
    },
    heroBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },
    heroIcon: { position: 'absolute', right: -8, top: -8, opacity: 0.12 },

    statsRow: { flexDirection: 'row', gap: spacing.sm },
    statCard: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
      padding: spacing.sm,
      backgroundColor: colors.primaryLight,
      borderRadius: radius.lg,
      borderWidth: 0,
    },
    statIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    statValue: { ...typography.h3, color: colors.primary },
    statLabel: { fontSize: 10, color: colors.text.secondary, textAlign: 'center' },

    section: {},
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      ...typography.h3,
      color: colors.text.primary,
      paddingLeft: spacing.sm,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    seeAll: { ...typography.bodySmall, color: colors.primary },

    hList: { paddingBottom: spacing.xs },
    hCard: {
      width: H_CARD_WIDTH,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      overflow: 'hidden',
      borderWidth: 0,
      ...shadows.md,
    },
    hCover: {
      width: H_CARD_WIDTH,
      height: H_COVER_HEIGHT,
      backgroundColor: colors.primaryLight,
    },
    hPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    hInfo: { padding: spacing.sm, paddingBottom: 8 },
    hTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text.primary,
      lineHeight: 16,
    },
    hMeta: { fontSize: 9, color: colors.text.muted },
  });
}
