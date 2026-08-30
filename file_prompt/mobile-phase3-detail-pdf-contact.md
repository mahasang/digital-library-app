# Mobile App — Phase 3: Research Detail + PDF + Contact

## ขอบเขต
- `app/research/[slug].tsx` — full replace
- `app/research/[slug]/pdf.tsx` — full replace
- `app/(tabs)/contact.tsx` — full replace
- ห้ามแตะไฟล์อื่น

---

## สิ่งที่เปลี่ยน

### [slug].tsx
1. **Cover hero ใหญ่ขึ้น** — height 280 (จาก 200), overlay gradient ด้านล่าง
2. **Share button** — ปุ่ม share ที่ header (ใช้ `Share` จาก react-native)
3. **Access level badge** — แสดง chip "ສາທາລະນະ" / "ອ່ານໄດ້" / "ຂໍ້ມູນດ່ວນ" ใต้ชื่อ
4. **Related research** — horizontal scroll 5 รายการ (same category, exclude current)
5. **PDF button** ปรับเป็นสี primary เต็มความกว้าง พร้อม icon

### pdf.tsx
1. **Loading progress bar** — แถบ progress ใต้ header แทน spinner กลางจอ
2. **Retry button** — กรณี error มีปุ่ม "ລອງໃໝ່" reload
3. **Title แสดงชื่อ slug** — header แสดงชื่อย่อของงานวิจัย

### contact.tsx
1. **เพิ่ม section "เวลาทำการ"** — ຈັນ-ສຸກ 8:00-17:00, ເສົາ 8:00-12:00
2. **เพิ่ม social media** — Facebook, LINE
3. **แสดง map placeholder** — card สีเทามีไอคอน location พร้อม "ເປີດໃນແຜນທີ່" → Linking

---

## โค้ดเต็ม `app/research/[slug].tsx`

```tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Image, Share,
} from 'react-native';
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
              <Image source={{ uri: item.cover_image }} style={styles.cover} resizeMode="cover" />
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
                        <Image source={{ uri: r.cover_image }} style={styles.relatedCover} resizeMode="cover" />
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
    relatedCover: { width: 100, height: 140 },
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
```

---

## โค้ดเต็ม `app/research/[slug]/pdf.tsx`

```tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Animated,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { getResearchPdfUrl } from '@/lib/research';

export default function PdfViewerScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [webViewLoading, setWebViewLoading] = useState(true);
  const progressAnim = useMemo(() => new Animated.Value(0), []);

  const fetchUrl = useCallback(async () => {
    setError(false);
    setLoading(true);
    setPdfUrl(null);
    if (!slug) return;
    const url = await getResearchPdfUrl(slug);
    if (url) setPdfUrl(url);
    else setError(true);
    setLoading(false);
  }, [slug]);

  useEffect(() => { fetchUrl(); }, [fetchUrl]);

  // progress bar animation เมื่อ WebView loading
  useEffect(() => {
    if (webViewLoading && pdfUrl) {
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: 0.85,
        duration: 8000,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [webViewLoading, pdfUrl]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // แสดงชื่อจาก slug
  const displayTitle = slug
    ? slug.split('-').slice(0, 4).join(' ')
    : 'PDF';

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{displayTitle}</Text>
      </View>

      {/* Progress bar */}
      {pdfUrl && webViewLoading && (
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>ກຳລັງໂຫລດ PDF...</Text>
        </View>
      ) : error || !pdfUrl ? (
        <View style={styles.center}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          </View>
          <Text style={styles.errorTitle}>ບໍ່ສາມາດໂຫລດ PDF ໄດ້</Text>
          <Text style={styles.errorSub}>ກວດສອບການເຊື່ອມຕໍ່ ຫຼື ລອງໃໝ່ອີກຄັ້ງ</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchUrl}>
            <Ionicons name="refresh-outline" size={18} color={colors.primary} />
            <Text style={styles.retryText}>ລອງໃໝ່</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: spacing.sm }}>
            <Text style={styles.backLink}>ກັບໄປ</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          source={{
            uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`,
          }}
          injectedJavaScript={`
            const style = document.createElement('style');
            style.innerHTML = '.ndfHFb-c4YZDc-Wrql6b { display: none !important; }';
            document.head.appendChild(style);
          `}
          style={styles.webview}
          onLoadStart={() => setWebViewLoading(true)}
          onLoadEnd={() => setWebViewLoading(false)}
          startInLoadingState={false}
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
    backBtn: { padding: 4 },
    headerTitle: { ...typography.h3, color: colors.text.primary, flex: 1, textTransform: 'capitalize' },
    progressTrack: {
      height: 3,
      backgroundColor: colors.border,
    },
    progressBar: {
      height: 3,
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    center: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      gap: spacing.sm, padding: spacing.xl,
    },
    loadingText: { ...typography.body, color: colors.text.secondary },
    errorIcon: {
      width: 80, height: 80, borderRadius: radius.full,
      backgroundColor: '#fef2f2',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    errorTitle: { ...typography.h3, color: colors.text.primary },
    errorSub: { ...typography.bodySmall, color: colors.text.secondary, textAlign: 'center' },
    retryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    retryText: { ...typography.label, color: colors.primary },
    backLink: { ...typography.label, color: colors.text.secondary },
    webview: { flex: 1 },
  });
}
```

---

## โค้ดเต็ม `app/(tabs)/contact.tsx`

```tsx
import { Fragment, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { spacing, typography, radius, shadows } from '@/constants/theme';

export default function ContactScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const contacts = [
    { icon: 'mail-outline',     title: 'ອີເມວ',     sub: 'info@digitallibrary.la',            action: () => Linking.openURL('mailto:info@digitallibrary.la') },
    { icon: 'call-outline',     title: 'ໂທລະສັບ',   sub: '+856 20 XXXX XXXX',                 action: () => Linking.openURL('tel:+85620XXXXXXXX') },
    { icon: 'globe-outline',    title: 'ເວັບໄຊ',    sub: 'digital-library-sls.vercel.app',    action: () => Linking.openURL('https://digital-library-sls.vercel.app') },
    { icon: 'logo-facebook',    title: 'Facebook',  sub: 'Digital Library Lao',               action: () => Linking.openURL('https://facebook.com') },
    { icon: 'chatbubble-outline',title: 'LINE',      sub: '@digitallibrary',                   action: () => Linking.openURL('https://line.me') },
  ];

  const hours = [
    { day: 'ຈັນ – ສຸກ', time: '08:00 – 17:00' },
    { day: 'ເສົາ',       time: '08:00 – 12:00' },
    { day: 'ອາທິດ',     time: 'ປິດ' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>ຕິດຕໍ່ເຮົາ</Text>
        <Text style={styles.headerSub}>ມີຄຳຖາມຫຼືຕ້ອງການຊ່ວຍເຫຼືອ?</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── ช่องทางติดต่อ ── */}
        <Text style={styles.sectionLabel}>ຊ່ອງທາງຕິດຕໍ່</Text>
        <View style={styles.card}>
          {contacts.map((c, i) => (
            <Fragment key={c.title}>
              <TouchableOpacity style={styles.item} onPress={c.action}>
                <View style={styles.iconBox}>
                  <Ionicons name={c.icon as any} size={20} color={colors.primary} />
                </View>
                <View style={styles.itemText}>
                  <Text style={styles.itemTitle}>{c.title}</Text>
                  <Text style={styles.itemSub}>{c.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
              </TouchableOpacity>
              {i < contacts.length - 1 && <View style={styles.divider} />}
            </Fragment>
          ))}
        </View>

        {/* ── เวลาทำการ ── */}
        <Text style={styles.sectionLabel}>ເວລາເຮັດວຽກ</Text>
        <View style={styles.card}>
          {hours.map((h, i) => (
            <Fragment key={h.day}>
              <View style={styles.item}>
                <View style={styles.iconBox}>
                  <Ionicons name="time-outline" size={20} color={colors.primary} />
                </View>
                <Text style={styles.itemTitle}>{h.day}</Text>
                <Text style={[styles.itemSub, { marginLeft: 'auto' as any }]}>{h.time}</Text>
              </View>
              {i < hours.length - 1 && <View style={styles.divider} />}
            </Fragment>
          ))}
        </View>

        {/* ── ที่อยู่ / Map ── */}
        <Text style={styles.sectionLabel}>ທີ່ຕັ້ງ</Text>
        <TouchableOpacity
          style={styles.mapCard}
          onPress={() => Linking.openURL('https://maps.google.com/?q=Vientiane,Laos')}
          activeOpacity={0.8}
        >
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={48} color={colors.primary} />
          </View>
          <View style={styles.mapInfo}>
            <View style={styles.iconBox}>
              <Ionicons name="location-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.itemText}>
              <Text style={styles.itemTitle}>ວຽງຈັນ, ສປປ ລາວ</Text>
              <Text style={styles.itemSub}>ເປີດໃນແຜນທີ່ →</Text>
            </View>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      backgroundColor: colors.primary,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.lg,
      paddingHorizontal: spacing.lg,
    },
    headerTitle: { ...typography.h2, color: '#fff' },
    headerSub: { ...typography.body, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
    scroll: {
      padding: spacing.lg,
      gap: spacing.sm,
      paddingBottom: spacing.xxl,
    },
    sectionLabel: {
      ...typography.label,
      color: colors.text.secondary,
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      ...shadows.sm,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      gap: spacing.md,
    },
    iconBox: {
      width: 40, height: 40,
      borderRadius: radius.md,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemText: { flex: 1 },
    itemTitle: { ...typography.label, color: colors.text.primary },
    itemSub: { ...typography.caption, color: colors.text.secondary, marginTop: 2 },
    divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
    mapCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      ...shadows.sm,
    },
    mapPlaceholder: {
      height: 120,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mapInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      gap: spacing.md,
    },
  });
}
```

---

## วิธีใช้ใน Cursor

```
@app/research/[slug].tsx @app/research/[slug]/pdf.tsx @app/(tabs)/contact.tsx

Phase 3: แทนที่ทั้ง 3 ไฟล์ตาม prompt file นี้
ห้ามแตะไฟล์อื่น
```

## ตรวจสอบหลังรัน

1. `npx tsc --noEmit` — 0 errors
2. [slug].tsx — cover hero สูง 280, header icons บนรูป
3. [slug].tsx — share button ทำงาน (native share sheet)
4. [slug].tsx — access badge แสดงสีถูกต้อง
5. [slug].tsx — related research scroll ซ้าย-ขวา
6. pdf.tsx — progress bar ใต้ header ขณะ WebView โหลด
7. pdf.tsx — error state มีปุ่ม retry
8. contact.tsx — 3 sections: ช่องทางติดต่อ, เวลาทำการ, ที่ตั้ง
9. contact.tsx — กด map card → เปิด Google Maps
