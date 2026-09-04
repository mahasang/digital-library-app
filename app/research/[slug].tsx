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

const COVER_W = 120;
const COVER_H = Math.round(COVER_W * 1.4);

function toAD(year: number) {
  return year > 2500 ? year - 543 : year;
}

const ACCESS_LABELS: Record<string, { label: string; color: string }> = {
  public:        { label: 'ສາທາລະນະ',  color: '#22c55e' },
  read_only:     { label: 'ອ່ານໄດ້',    color: '#3b82f6' },
  metadata_only: { label: 'ຂໍ້ມູນດ່ວນ', color: '#f59e0b' },
  member_only:   { label: 'ສະມາຊິກ',   color: '#8b5cf6' },
  staff_only:    { label: 'ພະນັກງານ',  color: '#6b7280' },
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author_name: string;
  author_avatar_url: string | null;
};

type RatingStats = { avg_score: number; rating_count: number };

function StarRating({
  score, onRate, size = 20, readonly = false, colors,
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
          <Text style={{ fontSize: size, color: i <= Math.round(score) ? '#f59e0b' : colors.border }}>★</Text>
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

type Tab = 'abstract' | 'comments';

export default function ResearchDetailScreen() {
  const { colors, isDark } = useTheme();
  const t = useT();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const session = useSession();
  const { slug, tab } = useLocalSearchParams<{ slug: string; tab: string }>();

  const [item, setItem] = useState<ResearchItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favCount, setFavCount] = useState(0);
  const [related, setRelated] = useState<ResearchItem[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [myRating, setMyRating] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>(tab === 'comments' ? 'comments' : 'abstract');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

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

    supabase.rpc('get_favorites_count', { p_research_id: item.id })
      .then(({ data }) => setFavCount(data ?? 0));

    supabase.rpc('get_rating_stats', { p_research_id: item.id }).single()
      .then(({ data }) => {
        const stats = data as unknown as RatingStats | null;
        if (stats) { setAvgRating(Number(stats.avg_score)); setRatingCount(stats.rating_count); }
      });

    if (session) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        supabase.from('ratings').select('score')
          .eq('research_id', item.id).eq('user_id', user.id).single()
          .then(({ data }) => { if (data) setMyRating(data.score); });
      });
    }

    const catSlug = item.research_categories[0]?.categories?.slug;
    if (catSlug) {
      getPublicResearch({ category: catSlug, limit: 6 }).then(({ data }) => {
        setRelated(data.filter(r => r.id !== item.id).slice(0, 5));
      });
    }

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
    if (!item || ratingLoading) return;
    setRatingLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setRatingLoading(false); return; }
    const { error } = await supabase.from('ratings').upsert(
      { user_id: user.id, research_id: item.id, score },
      { onConflict: 'user_id,research_id' }
    );
    if (error) { Alert.alert(t('common_error'), t('common_rating_error')); setRatingLoading(false); return; }
    setMyRating(score);
    const { data: stats } = await supabase.rpc('get_rating_stats', { p_research_id: item.id }).single();
    const s = stats as unknown as RatingStats | null;
    if (s) { setAvgRating(Number(s.avg_score)); setRatingCount(s.rating_count); }
    setRatingLoading(false);
  }

  async function handleComment() {
    if (!session) { router.push('/(auth)/login' as any); return; }
    if (!item || !commentText.trim() || commentLoading) return;
    setCommentLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCommentLoading(false); return; }
    const { error } = await supabase.from('comments').insert(
      { user_id: user.id, research_id: item.id, content: commentText.trim() }
    );
    if (error) { Alert.alert(t('common_error'), t('common_comment_error')); }
    else { setCommentText(''); await loadComments(item.id); }
    setCommentLoading(false);
  }

  async function handleDeleteComment(commentId: string) {
    Alert.alert(
      t('common_delete'),
      'ທ່ານຕ້ອງການລຶບຄຳເຫັນນີ້ບໍ?',
      [
        { text: t('common_cancel'), style: 'cancel' },
        {
          text: t('common_delete'),
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('comments')
              .delete()
              .eq('id', commentId);
            if (!error && item) await loadComments(item.id);
          },
        },
      ]
    );
  }

  async function handleEditComment(commentId: string, newContent: string) {
    if (!newContent.trim()) return;
    const { error } = await supabase
      .from('comments')
      .update({ content: newContent.trim() })
      .eq('id', commentId);
    if (!error) {
      setEditingCommentId(null);
      setEditingText('');
      if (item) await loadComments(item.id);
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
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

  const keywords = item.research_keywords.map(rk => rk.keywords?.keyword).filter(Boolean);
  const canReadPdf = ['public', 'read_only'].includes(item.access_level);
  const accessInfo = ACCESS_LABELS[item.access_level];
  const categoryName = item.research_categories[0]?.categories?.name_th ?? '';

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* ── Sticky Header ── */}
      <View style={styles.stickyHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerSlug} numberOfLines={1}>{item.title_th}</Text>
        <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
          <Ionicons name="share-outline" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleFavorite} style={styles.headerBtn}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={isFavorite ? '#f87171' : colors.text.primary}
          />
          {favCount > 0 && <Text style={styles.favCount}>{favCount}</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <FadeInView>

          {/* ── Hero Row: ปกซ้าย + info ขวา ── */}
          <View style={styles.heroRow}>
            {/* ปก */}
            <View style={styles.coverWrapper}>
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
                  <Ionicons name="document-text-outline" size={40} color={colors.primary} />
                </View>
              )}
            </View>

            {/* Info */}
            <View style={styles.heroInfo}>
              <Text style={styles.title} numberOfLines={4}>{item.title_th}</Text>
              {item.title_en && (
                <Text style={styles.titleEn} numberOfLines={2}>{item.title_en}</Text>
              )}
              {accessInfo && (
                <View style={[styles.accessBadge, { backgroundColor: accessInfo.color + '20', borderColor: accessInfo.color + '50' }]}>
                  <View style={[styles.accessDot, { backgroundColor: accessInfo.color }]} />
                  <Text style={[styles.accessText, { color: accessInfo.color }]}>{accessInfo.label}</Text>
                </View>
              )}
              {/* Rating inline */}
              {ratingCount > 0 ? (
                <View style={styles.ratingInline}>
                  <Text style={styles.ratingNum}>{avgRating.toFixed(1)}</Text>
                  <Text style={{ color: '#f59e0b', fontSize: 14 }}>★</Text>
                  <Text style={styles.ratingInlineCount}>({ratingCount})</Text>
                </View>
              ) : null}
              {/* Stats inline */}
              <View style={styles.statsInline}>
                <Ionicons name="eye-outline" size={13} color={colors.text.muted} />
                <Text style={styles.statInlineTxt}>{item.views}</Text>
                <Text style={styles.statDot}>·</Text>
                <Ionicons name="download-outline" size={13} color={colors.text.muted} />
                <Text style={styles.statInlineTxt}>{item.downloads}</Text>
              </View>
            </View>
          </View>

          {/* ── PDF Button ── */}
          {canReadPdf && (
            <TouchableOpacity
              style={styles.pdfBtn}
              onPress={() => {
                if (!session) {
                  Alert.alert(t('common_error'), t('fav_login_text'), [{ text: t('common_ok'), onPress: () => router.push('/(auth)/login' as any) }]);
                  return;
                }
                router.push(`/research/${slug}/pdf` as any);
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="document-text" size={18} color="#fff" />
              <Text style={styles.pdfBtnText}>{t('detail_read_pdf')}</Text>
            </TouchableOpacity>
          )}

          {/* ── Details Grid ── */}
          <View style={styles.detailGrid}>
            {[
              { icon: 'calendar-outline', label: 'ປີ', value: toAD(item.year).toString() },
              { icon: 'business-outline', label: t('detail_org'), value: item.organizations?.name_th?.split(' ')[0] ?? '—' },
              { icon: 'folder-outline', label: 'ໝວດ', value: categoryName || '—' },
              { icon: 'heart-outline', label: 'ມັກ', value: favCount.toString() },
            ].map((d, i) => (
              <View key={i} style={[styles.detailCell, i < 3 && styles.detailCellBorder]}>
                <Ionicons name={d.icon as any} size={18} color={colors.primary} />
                <Text style={styles.detailValue}>{d.value}</Text>
                <Text style={styles.detailLabel}>{d.label}</Text>
              </View>
            ))}
          </View>

          {/* ── Tabs ── */}
          <View style={styles.tabs}>
            {([
              { key: 'abstract', label: t('detail_abstract') },
              { key: 'comments', label: `${t('comment_title')} (${comments.length})` },
            ] as { key: Tab; label: string }[]).map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Tab: Abstract ── */}
          {activeTab === 'abstract' && (
            <View style={styles.tabContent}>
              {item.abstract && (
                <Text style={styles.abstractText}>{item.abstract}</Text>
              )}
              {authors ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('detail_author')}</Text>
                  <Text style={styles.infoValue}>{authors}</Text>
                </View>
              ) : null}
              {keywords.length > 0 && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('detail_keywords')}</Text>
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
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('detail_related')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.xs }}>
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
                          <View style={[styles.relatedCover, { backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }]}>
                            <Ionicons name="document-text" size={20} color={colors.primary} />
                          </View>
                        )}
                        <Text style={styles.relatedTitle} numberOfLines={2}>{r.title_th}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {/* ── Tab: Comments ── */}
          {activeTab === 'comments' && (
            <View style={styles.tabContent}>
              {/* Rating summary */}
              <View style={styles.ratingCard}>
                <View style={styles.ratingLeft}>
                  <Text style={styles.ratingBig}>{ratingCount > 0 ? avgRating.toFixed(1) : '—'}</Text>
                  <StarRating score={avgRating} readonly size={16} colors={colors} />
                  <Text style={styles.ratingCountTxt}>{ratingCount} {t('rating_count')}</Text>
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

              {/* Comment input */}
              <View style={styles.commentInputRow}>
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
                    : <Ionicons name="send" size={16} color="#fff" />}
                </TouchableOpacity>
              </View>

              {/* Comment list */}
              {comments.length === 0 ? (
                <Text style={styles.noComment}>{t('comment_empty')}</Text>
              ) : (
                comments.map(c => {
                  const initials = c.author_name.slice(0, 2).toUpperCase();
                  const isOwn = !!session && c.user_id === session.user.id;
                  const isEditing = editingCommentId === c.id;
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
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={styles.commentTime}>{relativeTime(c.created_at)}</Text>
                            {isOwn && !isEditing && (
                              <>
                                <TouchableOpacity onPress={() => {
                                  setEditingCommentId(c.id);
                                  setEditingText(c.content);
                                }}>
                                  <Ionicons name="pencil-outline" size={12} color={colors.text.muted} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeleteComment(c.id)}>
                                  <Ionicons name="trash-outline" size={12} color={colors.error} />
                                </TouchableOpacity>
                              </>
                            )}
                          </View>
                        </View>

                        {isEditing ? (
                          <View style={{ gap: 6 }}>
                            <TextInput
                              style={styles.commentBox}
                              value={editingText}
                              onChangeText={setEditingText}
                              multiline
                              maxLength={500}
                              autoFocus
                            />
                            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                              <TouchableOpacity onPress={() => {
                                setEditingCommentId(null);
                                setEditingText('');
                              }}>
                                <Text style={{ fontSize: 12, color: colors.text.muted }}>{t('common_cancel')}</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleEditComment(c.id, editingText)}>
                                <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>{t('account_save')}</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <Text style={styles.commentText}>{c.content}</Text>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

        </FadeInView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
    errorText: { ...typography.body, color: colors.text.secondary },

    // ── Sticky Header ──
    stickyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: spacing.xxl,
      paddingBottom: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: spacing.xs,
    },
    headerBtn: {
      width: 40, height: 40,
      alignItems: 'center', justifyContent: 'center',
      borderRadius: radius.md,
    },
    headerSlug: {
      flex: 1,
      ...typography.label,
      color: colors.text.primary,
      fontSize: 13,
    },
    favCount: { fontSize: 10, color: '#f87171', fontWeight: '700', marginTop: -4 },

    scroll: { paddingBottom: spacing.xxl },

    // ── Hero Row ──
    heroRow: {
      flexDirection: 'row',
      gap: spacing.md,
      padding: spacing.lg,
      backgroundColor: colors.surface,
    },
    coverWrapper: {
      ...shadows.md,
      borderRadius: radius.md,
      overflow: 'hidden',
    },
    cover: { width: COVER_W, height: COVER_H },
    coverPlaceholder: {
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroInfo: {
      flex: 1,
      gap: spacing.xs,
      justifyContent: 'flex-start',
    },
    title: { ...typography.h3, color: colors.text.primary, lineHeight: 24 },
    titleEn: { ...typography.caption, color: colors.text.secondary, lineHeight: 18 },
    accessBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm, paddingVertical: 3,
      borderRadius: radius.full, borderWidth: 1,
    },
    accessDot: { width: 6, height: 6, borderRadius: 3 },
    accessText: { fontSize: 11, fontWeight: '600' },
    ratingInline: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
    },
    ratingNum: { fontSize: 14, fontWeight: '700', color: colors.text.primary },
    ratingInlineCount: { fontSize: 12, color: colors.text.muted },
    statsInline: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
    },
    statInlineTxt: { fontSize: 12, color: colors.text.muted },
    statDot: { color: colors.border, fontSize: 12 },

    // ── PDF Button ──
    pdfBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: spacing.sm,
      marginHorizontal: spacing.lg,
      marginTop: spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      ...shadows.md,
    },
    pdfBtnText: { ...typography.label, color: '#fff', fontSize: 15 },

    // ── Details Grid ──
    detailGrid: {
      flexDirection: 'row',
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    detailCell: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.md,
      gap: 4,
    },
    detailCellBorder: {
      borderRightWidth: 1,
      borderRightColor: colors.border,
    },
    detailValue: { ...typography.label, color: colors.text.primary, fontSize: 13, textAlign: 'center' },
    detailLabel: { fontSize: 10, color: colors.text.muted, textAlign: 'center' },

    // ── Tabs ──
    tabs: {
      flexDirection: 'row',
      marginTop: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.md,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: { borderBottomColor: colors.primary },
    tabText: { ...typography.label, color: colors.text.muted, fontSize: 13 },
    tabTextActive: { color: colors.primary },

    // ── Tab Content ──
    tabContent: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    abstractText: {
      ...typography.body,
      color: colors.text.secondary,
      lineHeight: 26,
    },
    infoRow: { gap: spacing.xs },
    infoLabel: {
      ...typography.label,
      color: colors.text.primary,
      paddingLeft: spacing.sm,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    infoValue: { ...typography.body, color: colors.text.secondary },
    keywords: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    keyword: {
      backgroundColor: colors.primaryLight,
      borderRadius: radius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    keywordText: { ...typography.caption, color: colors.primary },
    relatedCard: {
      width: 100, marginRight: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    relatedCover: { width: 100, height: 140 },
    relatedTitle: {
      fontSize: 11, fontWeight: '600',
      color: colors.text.primary,
      padding: spacing.xs, lineHeight: 15,
    },

    // ── Rating Card ──
    ratingCard: {
      flexDirection: 'row',
      backgroundColor: colors.primaryLight,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.lg,
      alignItems: 'center',
    },
    ratingLeft: {
      alignItems: 'center',
      gap: 4,
      paddingRight: spacing.md,
      borderRightWidth: 1,
      borderRightColor: colors.border,
    },
    ratingBig: { ...typography.h2, color: colors.primary, fontWeight: '700' },
    ratingCountTxt: { ...typography.caption, color: colors.text.secondary },
    ratingRight: { flex: 1, gap: 8, alignItems: 'flex-start' },
    ratingLabel: { ...typography.caption, color: colors.text.secondary },

    // ── Comments ──
    commentInputRow: {
      flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end',
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
      flexDirection: 'row', alignItems: 'flex-start',
      gap: spacing.sm, marginTop: spacing.sm,
    },
    commentAvatar: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: colors.primaryLight,
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: 1.5, borderColor: colors.primary + '30',
      flexShrink: 0,
    },
    avatarImg: { width: 36, height: 36 },
    avatarInitials: { fontSize: 12, fontWeight: '700', color: colors.primary },
    commentBubble: {
      flex: 1,
      backgroundColor: colors.primaryLight,
      borderRadius: radius.lg,
      borderTopLeftRadius: 4,
      padding: spacing.sm,
      gap: 4,
    },
    commentHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    commentName: { fontSize: 12, fontWeight: '700', color: colors.primary },
    commentTime: { ...typography.caption, color: colors.text.muted, fontSize: 10 },
    commentText: { ...typography.bodySmall, color: colors.text.primary, lineHeight: 20 },
  });
}
