import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Share,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, radius, shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useSession } from '@/hooks/useSession';
import { getPublicResearch, getResearchBySlug, ResearchItem } from '@/lib/research';
import { getFavorites, toggleFavorite, addReadingHistory } from '@/lib/profile';
import { Button } from '@/components/ui/Button';
import { FadeInView } from '@/components/ui/FadeInView';

function toAD(year: number) {
  return year > 2500 ? year - 543 : year;
}

const ACCESS_LABELS: Record<string, { label: string; color: string }> = {
  public:       { label: 'ສາທາລະນະ',  color: '#22c55e' },
  read_only:    { label: 'ອ່ານໄດ້',    color: '#3b82f6' },
  metadata_only:{ label: 'ຂໍ້ມູນດ່ວນ', color: '#f59e0b' },
  member_only:  { label: 'ສະມາຊິກ',   color: '#8b5cf6' },
};

export default function ResearchDetailScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const session = useSession();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [item, setItem] = useState<ResearchItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [related, setRelated] = useState<ResearchItem[]>([]);

  useEffect(() => {
    if (!slug) return;
    getResearchBySlug(slug).then((data) => {
      setItem(data);
      setLoading(false);
    });
  }, [slug]);

  useEffect(() => {
    if (!item) return;
    getFavorites().then((favs) => setIsFavorite(favs.includes(item.id)));
    addReadingHistory(item.slug);
    // โหลด related research (same category, limit 5)
    const catSlug = item.research_categories[0]?.categories?.slug;
    if (catSlug) {
      getPublicResearch({ category: catSlug, limit: 6 }).then(({ data }) => {
        setRelated(data.filter(r => r.id !== item.id).slice(0, 5));
      });
    }
  }, [item]);

  async function handleFavorite() {
    if (!session) { router.push('/(auth)/login' as any); return; }
    if (!item) return;
    const nowFav = await toggleFavorite(item.id);
    setIsFavorite(nowFav);
  }

  async function handleShare() {
    if (!item) return;
    await Share.share({
      title: item.title_th,
      message: `${item.title_th}\n\nhttps://digital-library-sls.vercel.app/lo/research/${item.slug}`,
    });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.text.muted} />
        <Text style={styles.errorText}>ບໍ່ພົບງານວິໄຈ</Text>
        <Button title="ກັບໄປ" onPress={() => router.back()} variant="outline" />
      </View>
    );
  }

  const authors = item.research_authors
    .slice().sort((a, b) => a.author_order - b.author_order)
    .map(ra => ra.authors?.name).filter(Boolean).join(', ');

  const keywords = item.research_keywords
    .map(rk => rk.keywords?.keyword).filter(Boolean);

  const canReadPdf = ['public', 'read_only'].includes(item.access_level);
  const accessInfo = ACCESS_LABELS[item.access_level];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ── Header overlay บนรูป ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
          <Ionicons name="share-outline" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleFavorite} style={styles.iconBtn}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={isFavorite ? '#f87171' : '#fff'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <FadeInView>
          {/* ── Cover Hero ── */}
          <View style={styles.heroWrap}>
            {item.cover_image ? (
              <Image
                source={{ uri: item.cover_image }}
                style={styles.cover}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={300}
              />
            ) : (
              <View style={[styles.cover, styles.coverPlaceholder]}>
                <Ionicons name="document-text-outline" size={80} color={colors.text.muted} />
              </View>
            )}
            {/* gradient overlay */}
            <View style={styles.heroGradient} />
          </View>

          <View style={styles.content}>
            {/* Access badge */}
            {accessInfo && (
              <View style={[styles.accessBadge, { backgroundColor: accessInfo.color + '20', borderColor: accessInfo.color + '40' }]}>
                <View style={[styles.accessDot, { backgroundColor: accessInfo.color }]} />
                <Text style={[styles.accessText, { color: accessInfo.color }]}>{accessInfo.label}</Text>
              </View>
            )}

            <Text style={styles.title}>{item.title_th}</Text>
            {item.title_en && <Text style={styles.titleEn}>{item.title_en}</Text>}

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Ionicons name="calendar-outline" size={15} color={colors.primary} />
                <Text style={styles.statText}>{toAD(item.year)}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Ionicons name="eye-outline" size={15} color={colors.primary} />
                <Text style={styles.statText}>{item.views} ເທື່ອ</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Ionicons name="download-outline" size={15} color={colors.primary} />
                <Text style={styles.statText}>{item.downloads} ເທື່ອ</Text>
              </View>
            </View>

            {/* PDF Button */}
            {canReadPdf && (
              <TouchableOpacity
                style={styles.pdfBtn}
                onPress={() => {
                  if (!session) { router.push('/(auth)/login' as any); return; }
                  router.push(`/research/${slug}/pdf` as any);
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="document-text" size={20} color="#fff" />
                <Text style={styles.pdfBtnText}>ອ່ານ PDF ອອນລາຍ</Text>
              </TouchableOpacity>
            )}

            {/* Sections */}
            {item.organizations?.name_th && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>ໜ່ວຍງານ</Text>
                <Text style={styles.sectionText}>{item.organizations.name_th}</Text>
              </View>
            )}

            {authors && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>ຜູ້ວິໄຈ</Text>
                <Text style={styles.sectionText}>{authors}</Text>
              </View>
            )}

            {item.abstract && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>ບົດຄັດຫຍໍ້</Text>
                <Text style={styles.sectionText}>{item.abstract}</Text>
              </View>
            )}

            {keywords.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>ຄຳສຳຄັນ</Text>
                <View style={styles.keywords}>
                  {keywords.map((kw, i) => (
                    <View key={i} style={styles.keyword}>
                      <Text style={styles.keywordText}>{kw}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Related research */}
            {related.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>ງານວິໄຈທີ່ກ່ຽວຂ້ອງ</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.relatedScroll}>
                  {related.map(r => (
                    <TouchableOpacity
                      key={r.id}
                      style={styles.relatedCard}
                      onPress={() => router.push(`/research/${r.slug}` as any)}
                      activeOpacity={0.75}
                    >
                      {r.cover_image ? (
                        <Image
                        source={{ uri: r.cover_image }}
                        style={styles.relatedCover}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={200}
                      />
                      ) : (
                        <View style={[styles.relatedCover, styles.relatedPlaceholder]}>
                          <Ionicons name="document-text" size={20} color={colors.primary} />
                        </View>
                      )}
                      <Text style={styles.relatedTitle} numberOfLines={2}>{r.title_th}</Text>
                      <Text style={styles.relatedYear}>{toAD(r.year)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </FadeInView>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },

    // Header overlay
    header: {
      position: 'absolute',
      top: 0, left: 0, right: 0,
      zIndex: 10,
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: spacing.xxl,
      paddingBottom: spacing.md,
      paddingHorizontal: spacing.md,
      gap: spacing.xs,
    },
    iconBtn: {
      width: 40, height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.35)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Hero
    heroWrap: { position: 'relative' },
    cover: { width: '100%', height: 280 },
    coverPlaceholder: {
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroGradient: {
      position: 'absolute',
      bottom: 0, left: 0, right: 0,
      height: 80,
      backgroundColor: 'rgba(0,0,0,0.25)',
    },

    scroll: { paddingBottom: spacing.xxl },
    content: { padding: spacing.lg, gap: spacing.md },

    // Access badge
    accessBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.full,
      borderWidth: 1,
    },
    accessDot: { width: 6, height: 6, borderRadius: 3 },
    accessText: { fontSize: 12, fontWeight: '600' },

    title: { ...typography.h2, color: colors.text.primary },
    titleEn: { ...typography.body, color: colors.text.secondary },

    // Stats
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    stat: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' },
    statText: { ...typography.bodySmall, color: colors.text.secondary },
    statDivider: { width: 1, height: 16, backgroundColor: colors.border },

    // PDF button
    pdfBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      ...shadows.sm,
    },
    pdfBtnText: { ...typography.label, color: '#fff', fontSize: 15 },

    section: { gap: spacing.xs },
    sectionTitle: { ...typography.label, color: colors.text.primary },
    sectionText: { ...typography.body, color: colors.text.secondary, lineHeight: 24 },

    keywords: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    keyword: {
      backgroundColor: colors.primaryLight,
      borderRadius: radius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    keywordText: { ...typography.caption, color: colors.primary },

    // Related
    relatedScroll: { marginTop: spacing.xs },
    relatedCard: {
      width: 100,
      marginRight: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    relatedCover: { width: 100, height: 140, backgroundColor: colors.primaryLight },
    relatedPlaceholder: {
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    relatedTitle: {
      fontSize: 11, fontWeight: '600',
      color: colors.text.primary,
      padding: spacing.xs,
      lineHeight: 15,
    },
    relatedYear: {
      fontSize: 10, color: colors.text.muted,
      paddingHorizontal: spacing.xs,
      paddingBottom: spacing.xs,
    },

    errorText: { ...typography.body, color: colors.text.secondary },
  });
}
