import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Share,
  TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, radius, shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useSession } from '@/hooks/useSession';
import { useT } from '@/contexts/LanguageContext';
import { getPublicResearch, getResearchBySlug, ResearchItem } from '@/lib/research';
import { getFavorites, toggleFavorite, addReadingHistory } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
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
  staff_only:   { label: 'ພະນັກງານ',  color: '#6b7280' },
};

// รูปร่างตรงกับ RPC get_comments() — resolve author_name/avatar ฝั่ง DB ให้แล้ว
// (join profiles ตรงๆ จาก client จะโดน profiles RLS บล็อกจนชื่อคนอื่นหายไป)
type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author_name: string;
  author_avatar_url: string | null;
};

// รูปร่างตรงกับ RPC get_rating_stats() — .single() บน rpc() ที่ไม่มี generated types
// infer เป็น {} เฉยๆ จึงต้อง cast ตรงนี้
type RatingStats = { avg_score: number; rating_count: number };

function StarRating({
  score,
  onRate,
  size = 20,
  readonly = false,
  colors,
}: {
  score: number;
  onRate?: (s: number) => void;
  size?: number;
  readonly?: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <TouchableOpacity
          key={i}
          onPress={() => !readonly && onRate?.(i)}
          disabled={readonly}
          activeOpacity={readonly ? 1 : 0.7}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Text style={{ fontSize: size, color: i <= Math.round(score) ? '#f59e0b' : colors.border }}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return 'ມື້ນີ້';
  if (days < 30) return `${days} ວັນ`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ເດືອນ`;
  return `${Math.floor(months / 12)} ປີ`;
}

export default function ResearchDetailScreen() {
  const { colors, isDark } = useTheme();
  const t = useT();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const session = useSession();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [item, setItem] = useState<ResearchItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favCount, setFavCount] = useState(0);
  const [related, setRelated] = useState<ResearchItem[]>([]);

  // Rating
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [myRating, setMyRating] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

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

    // favorites count — favorites.select RLS เห็นแค่แถวของตัวเอง ต้องใช้ RPC เพื่อนับรวมทุกคน
    supabase
      .rpc('get_favorites_count', { p_research_id: item.id })
      .then(({ data }) => setFavCount(data ?? 0));

    // avg rating — ratings ไม่เปิด public select ตรงๆ ต้องใช้ RPC เช่นกัน
    supabase
      .rpc('get_rating_stats', { p_research_id: item.id })
      .single()
      .then(({ data }) => {
        const stats = data as unknown as RatingStats | null;
        if (stats) {
          setAvgRating(Number(stats.avg_score) ?? 0);
          setRatingCount(stats.rating_count ?? 0);
        }
      });

    // my rating (ถ้า login) — เป็นแถวของตัวเอง อ่านจากตารางตรงๆ ได้
    if (session) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        supabase
          .from('ratings')
          .select('score')
          .eq('research_id', item.id)
          .eq('user_id', user.id)
          .single()
          .then(({ data }) => { if (data) setMyRating(data.score); });
      });
    }

    // related
    const catSlug = item.research_categories[0]?.categories?.slug;
    if (catSlug) {
      getPublicResearch({ category: catSlug, limit: 6 }).then(({ data }) => {
        setRelated(data.filter(r => r.id !== item.id).slice(0, 5));
      });
    }

    // comments
    loadComments(item.id);
  }, [item, session]);

  async function loadComments(researchId: string) {
    const { data } = await supabase.rpc('get_comments', { p_research_id: researchId, p_limit: 20 });
    setComments((data as unknown as Comment[]) ?? []);
  }

  async function handleFavorite() {
    if (!session) { router.push('/(auth)/login' as any); return; }
    if (!item) return;
    const nowFav = await toggleFavorite(item.id);
    setIsFavorite(nowFav);
    setFavCount(prev => nowFav ? prev + 1 : Math.max(0, prev - 1));
  }

  async function handleShare() {
    if (!item) return;
    await Share.share({
      title: item.title_th,
      message: `${item.title_th}\n\nhttps://digital-library-sls.vercel.app/lo/research/${item.slug}`,
    });
  }

  async function handleRate(score: number) {
    if (!session) { router.push('/(auth)/login' as any); return; }
    if (!item) return;
    setRatingLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setRatingLoading(false); return; }

    const { error } = await supabase.from('ratings').upsert({
      user_id: user.id,
      research_id: item.id,
      score,
    }, { onConflict: 'user_id,research_id' });

    if (error) {
      setRatingLoading(false);
      Alert.alert(t('common_error'), t('common_rating_error'));
      return;
    }

    setMyRating(score);
    // reload avg ผ่าน RPC (ratings ไม่เปิด public select ตรงๆ)
    const { data: statsRaw } = await supabase
      .rpc('get_rating_stats', { p_research_id: item.id })
      .single();
    const stats = statsRaw as unknown as RatingStats | null;
    if (stats) {
      setAvgRating(Number(stats.avg_score) ?? 0);
      setRatingCount(stats.rating_count ?? 0);
    }
    setRatingLoading(false);
  }

  async function handleComment() {
    if (!session) { router.push('/(auth)/login' as any); return; }
    if (!item || !commentText.trim()) return;
    setCommentLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCommentLoading(false); return; }

    const { error } = await supabase.from('comments').insert({
      user_id: user.id,
      research_id: item.id,
      content: commentText.trim(),
    });

    if (error) {
      Alert.alert(t('common_error'), t('common_comment_error'));
    } else {
      setCommentText('');
      await loadComments(item.id);
    }
    setCommentLoading(false);
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
        <Text style={styles.errorText}>{t('detail_not_found')}</Text>
        <Button title={t('common_back')} onPress={() => router.back()} variant="outline" />
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />

      {/* ── Header overlay ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
          <Ionicons name="share-outline" size={22} color="#fff" />
        </TouchableOpacity>
        {/* Heart + count */}
        <TouchableOpacity onPress={handleFavorite} style={styles.iconBtnFav}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={isFavorite ? '#f87171' : '#fff'}
          />
          {favCount > 0 && (
            <Text style={styles.favCount}>{favCount}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <FadeInView>
          {/* Cover */}
          <View style={styles.heroWrap}>
            {item.cover_image ? (
              <Image source={{ uri: item.cover_image }} style={styles.cover} contentFit="cover" cachePolicy="memory-disk" transition={300} />
            ) : (
              <View style={[styles.cover, styles.coverPlaceholder]}>
                <Ionicons name="document-text-outline" size={80} color={colors.text.muted} />
              </View>
            )}
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

            {/* Stats row: views | downloads | favorites */}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Ionicons name="eye-outline" size={16} color={colors.primary} />
                <Text style={styles.statText}>{item.views}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Ionicons name="download-outline" size={16} color={colors.primary} />
                <Text style={styles.statText}>{item.downloads}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Ionicons name="heart-outline" size={16} color={colors.error} />
                <Text style={styles.statText}>{favCount}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                <Text style={styles.statText}>{toAD(item.year)}</Text>
              </View>
            </View>

            {/* Rating section */}
            <View style={styles.ratingSection}>
              <View style={styles.ratingLeft}>
                <Text style={styles.ratingScore}>{avgRating > 0 ? avgRating.toFixed(1) : '—'}</Text>
                <StarRating score={avgRating} readonly size={18} colors={colors} />
                <Text style={styles.ratingCount}>{ratingCount} {t('rating_count')}</Text>
              </View>
              <View style={styles.ratingRight}>
                <Text style={styles.ratingLabel}>
                  {session ? t('rating_label') : t('rating_login')}
                </Text>
                {session && (
                  <StarRating
                    score={myRating}
                    onRate={handleRate}
                    size={32}
                    readonly={ratingLoading}
                    colors={colors}
                  />
                )}
                {ratingLoading && <ActivityIndicator size="small" color={colors.primary} />}
              </View>
            </View>

            {/* PDF Button */}
            {canReadPdf && (
              <TouchableOpacity
                style={styles.pdfBtn}
                onPress={() => {
                  if (!session) {
                    Alert.alert(
                      t('common_error'),
                      t('fav_login_text'),
                      [{ text: t('common_ok'), onPress: () => router.push('/(auth)/login' as any) }]
                    );
                    return;
                  }
                  router.push(`/research/${slug}/pdf` as any);
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="document-text" size={20} color="#fff" />
                <Text style={styles.pdfBtnText}>{t('detail_read_pdf')}</Text>
              </TouchableOpacity>
            )}

            {/* Sections */}
            {item.organizations?.name_th && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('detail_org')}</Text>
                <Text style={styles.sectionText}>{item.organizations.name_th}</Text>
              </View>
            )}
            {authors && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('detail_author')}</Text>
                <Text style={styles.sectionText}>{authors}</Text>
              </View>
            )}
            {item.abstract && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('detail_abstract')}</Text>
                <Text style={styles.sectionText}>{item.abstract}</Text>
              </View>
            )}
            {keywords.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('detail_keywords')}</Text>
                <View style={styles.keywords}>
                  {keywords.map((kw, i) => (
                    <View key={i} style={styles.keyword}>
                      <Text style={styles.keywordText}>{kw}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Related */}
            {related.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('detail_related')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.relatedScroll}>
                  {related.map(r => (
                    <TouchableOpacity
                      key={r.id}
                      style={styles.relatedCard}
                      onPress={() => router.push(`/research/${r.slug}` as any)}
                      activeOpacity={0.75}
                    >
                      {r.cover_image ? (
                        <Image source={{ uri: r.cover_image }} style={styles.relatedCover} contentFit="cover" cachePolicy="memory-disk" transition={200} />
                      ) : (
                        <View style={[styles.relatedCover, styles.relatedPlaceholder]}>
                          <Ionicons name="document-text" size={20} color={colors.primary} />
                        </View>
                      )}
                      <Text style={styles.relatedTitle} numberOfLines={2}>{r.title_th}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ── Comments ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('comment_title')} ({comments.length})</Text>

              {/* Add comment */}
              <View style={styles.commentInput}>
                <TextInput
                  style={styles.commentBox}
                  placeholder={session ? t('comment_placeholder') : t('comment_login')}
                  placeholderTextColor={colors.text.muted}
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                  maxLength={500}
                  editable={!!session}
                />
                <TouchableOpacity
                  style={[styles.commentSend, (!commentText.trim() || !session) && { opacity: 0.4 }]}
                  onPress={handleComment}
                  disabled={!commentText.trim() || !session || commentLoading}
                >
                  {commentLoading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Ionicons name="send" size={16} color="#fff" />
                  }
                </TouchableOpacity>
              </View>

              {/* Comment list */}
              {comments.length === 0 ? (
                <Text style={styles.noComment}>{t('comment_empty')}</Text>
              ) : (
                comments.map(c => {
                  const initials = c.author_name.slice(0, 2).toUpperCase();
                  return (
                    <View key={c.id} style={styles.commentItem}>
                      <View style={styles.commentAvatar}>
                        {c.author_avatar_url ? (
                          <Image source={{ uri: c.author_avatar_url }} style={styles.avatarImg} contentFit="cover" />
                        ) : (
                          <Text style={styles.avatarInitials}>{initials}</Text>
                        )}
                      </View>
                      <View style={styles.commentBubble}>
                        <View style={styles.commentHeader}>
                          <Text style={styles.commentName}>{c.author_name}</Text>
                          <Text style={styles.commentTime}>{relativeTime(c.created_at)}</Text>
                        </View>
                        <Text style={styles.commentText}>{c.content}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

          </View>
        </FadeInView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },

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
    iconBtnFav: {
      minWidth: 40, height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.35)',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 4,
      paddingHorizontal: 10,
    },
    favCount: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
    },

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

    accessBadge: {
      flexDirection: 'row', alignItems: 'center',
      alignSelf: 'flex-start', gap: 6,
      paddingHorizontal: spacing.sm, paddingVertical: 4,
      borderRadius: radius.full, borderWidth: 1,
    },
    accessDot: { width: 6, height: 6, borderRadius: 3 },
    accessText: { fontSize: 12, fontWeight: '600' },

    title: { ...typography.h2, color: colors.text.primary },
    titleEn: { ...typography.body, color: colors.text.secondary },

    statsRow: {
      flexDirection: 'row', alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md, padding: spacing.md,
      borderWidth: 1, borderColor: colors.border,
    },
    stat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
      justifyContent: 'center',
    },
    statText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text.primary,
    },
    statDivider: { width: 1, height: 16, backgroundColor: colors.border },

    // Rating
    ratingSection: {
      flexDirection: 'row',
      backgroundColor: colors.primaryLight,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.lg,
      alignItems: 'center',
      borderWidth: 0,
    },
    ratingLeft: {
      alignItems: 'center',
      gap: 4,
      paddingRight: spacing.md,
      borderRightWidth: 1,
      borderRightColor: colors.border,
    },
    ratingScore: {
      ...typography.h2,
      color: colors.primary,
      fontWeight: '700',
    },
    ratingCount: { ...typography.caption, color: colors.text.secondary },
    ratingRight: {
      flex: 1,
      gap: 8,
      alignItems: 'flex-start',
    },
    ratingLabel: {
      ...typography.label,
      color: colors.text.secondary,
      fontSize: 12,
    },

    pdfBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: spacing.sm, backgroundColor: colors.primary,
      borderRadius: radius.md, paddingVertical: spacing.md, ...shadows.sm,
    },
    pdfBtnText: { ...typography.label, color: '#fff', fontSize: 15 },

    section: { gap: spacing.xs },
    sectionTitle: {
      ...typography.label,
      color: colors.text.primary,
      fontSize: 15,
      paddingLeft: spacing.sm,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      borderRadius: 0,
    },
    sectionText: { ...typography.body, color: colors.text.secondary, lineHeight: 24 },

    keywords: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    keyword: {
      backgroundColor: colors.primaryLight, borderRadius: radius.full,
      paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    },
    keywordText: { ...typography.caption, color: colors.primary },

    relatedScroll: { marginTop: spacing.xs },
    relatedCard: {
      width: 100, marginRight: spacing.sm,
      backgroundColor: colors.surface, borderRadius: radius.md,
      overflow: 'hidden', borderWidth: 1, borderColor: colors.border,
    },
    relatedCover: { width: 100, height: 140, backgroundColor: colors.primaryLight },
    relatedPlaceholder: { alignItems: 'center', justifyContent: 'center' },
    relatedTitle: {
      fontSize: 11, fontWeight: '600',
      color: colors.text.primary,
      padding: spacing.xs, lineHeight: 15,
    },

    // Comments
    commentInput: {
      flexDirection: 'row', gap: spacing.sm,
      alignItems: 'flex-end', marginTop: spacing.sm,
    },
    commentBox: {
      flex: 1, minHeight: 44, maxHeight: 120,
      borderWidth: 1.5, borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
      ...typography.body, color: colors.text.primary,
      backgroundColor: colors.surface,
    },
    commentSend: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: 'center', justifyContent: 'center',
    },
    noComment: {
      ...typography.caption, color: colors.text.muted,
      textAlign: 'center', paddingVertical: spacing.lg,
    },
    commentItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    commentAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: 1.5,
      borderColor: colors.primary + '30',
      flexShrink: 0,
    },
    avatarImg: { width: 36, height: 36 },
    avatarInitials: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    commentBubble: {
      flex: 1,
      backgroundColor: colors.primaryLight,
      borderRadius: radius.lg,
      borderTopLeftRadius: 4,
      padding: spacing.sm,
      gap: 4,
    },
    commentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    commentName: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    commentTime: {
      ...typography.caption,
      color: colors.text.muted,
      fontSize: 10,
    },
    commentText: {
      ...typography.bodySmall,
      color: colors.text.primary,
      lineHeight: 20,
    },

    errorText: { ...typography.body, color: colors.text.secondary },
  });
}
