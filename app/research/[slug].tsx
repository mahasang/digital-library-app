import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Image
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useSession } from '@/hooks/useSession';
import { getResearchBySlug, ResearchItem } from '@/lib/research';
import { getFavorites, toggleFavorite, addReadingHistory } from '@/lib/profile';
import { Button } from '@/components/ui/Button';
import { FadeInView } from '@/components/ui/FadeInView';

/** แปลง พ.ศ → ค.ศ */
function toAD(year: number) {
  return year > 2500 ? year - 543 : year;
}

export default function ResearchDetailScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const session = useSession();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [item, setItem] = useState<ResearchItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (slug) {
      getResearchBySlug(slug).then((data) => {
        setItem(data);
        setLoading(false);
      });
    }
  }, [slug]);

  useEffect(() => {
    if (item) {
      getFavorites().then((favs) => setIsFavorite(favs.includes(item.id)));
      addReadingHistory(item.slug);
    }
  }, [item]);

  async function handleFavorite() {
    if (!session) {
      router.push('/(auth)/login');
      return;
    }
    if (!item) return;
    const nowFav = await toggleFavorite(item.id);
    setIsFavorite(nowFav);
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
        <Text style={styles.errorText}>ບໍ່ພົບງານວິໄຈ</Text>
        <Button title="ກັບໄປ" onPress={() => router.back()} variant="outline" />
      </View>
    );
  }

  const authors = item.research_authors
    .slice()
    .sort((a, b) => a.author_order - b.author_order)
    .map((ra) => ra.authors?.name)
    .filter(Boolean)
    .join(', ');

  const keywords = item.research_keywords
    .map((rk) => rk.keywords?.keyword)
    .filter(Boolean);

  const canReadPdf = ['public', 'read_only'].includes(item.access_level);

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>ລາຍລະອຽດ</Text>
        <TouchableOpacity onPress={handleFavorite} style={styles.favBtn}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? colors.error : colors.text.secondary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <FadeInView>
          {item.cover_image ? (
            <Image source={{ uri: item.cover_image }} style={styles.cover} resizeMode="cover" />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="document-text-outline" size={64} color={colors.text.muted} />
            </View>
          )}

          <View style={styles.content}>
            <Text style={styles.title}>{item.title_th}</Text>
            {item.title_en && (
              <Text style={styles.titleEn}>{item.title_en}</Text>
            )}

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                <Text style={styles.statText}>{toAD(item.year)}</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="eye-outline" size={16} color={colors.primary} />
                <Text style={styles.statText}>{item.views}</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="download-outline" size={16} color={colors.primary} />
                <Text style={styles.statText}>{item.downloads}</Text>
              </View>
            </View>

            {canReadPdf && (
              <Button
                title="📄 ອ່ານ PDF ອອນລາຍ"
                onPress={() => {
                  if (!session) {
                    router.push('/(auth)/login');
                    return;
                  }
                  router.push(`/research/${slug}/pdf`);
                }}
                style={styles.pdfBtn}
              />
            )}

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
    favBtn: { padding: 4 },
    cover: { width: '100%', height: 200 },
    coverPlaceholder: {
      width: '100%', height: 200,
      backgroundColor: colors.background,
      alignItems: 'center', justifyContent: 'center',
    },
    scroll: { paddingBottom: spacing.xxl },
    content: { padding: spacing.lg, gap: spacing.md },
    title: { ...typography.h2, color: colors.text.primary },
    titleEn: { ...typography.body, color: colors.text.secondary },
    statsRow: { flexDirection: 'row', gap: spacing.lg },
    stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText: { ...typography.bodySmall, color: colors.text.secondary },
    pdfBtn: { marginVertical: spacing.sm },
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
    errorText: { ...typography.body, color: colors.text.secondary },
  });
}
