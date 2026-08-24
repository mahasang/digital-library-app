# Digital Library Mobile — Expo Phase 2: Research List + Search + Detail + PDF

## Context

- Project: `/c/Project/digital-library-app` (Expo SDK 54, React Native)
- Supabase production: `wpiaynjqnmqimcuhexaq` (Singapore)
- โครงสร้าง: `app/(tabs)/research.tsx`, `lib/supabase.ts`, `constants/theme.ts`
- Theme: background `#FAFAF7`, accent `#185ff2`, surface `#FFFFFF`
- ภาษาหลัก: ลาว (ຫ້ອງສະໝຸດດິຈິຕອນ)
- OS: Windows, shell: Git Bash

## Scope Phase 2

1. Data layer — ดึงงานวิจัยจาก Supabase จริง
2. Research List screen — แสดงรายการ + ค้นหา + filter
3. Research Detail screen — ข้อมูลละเอียด + ผู้วิจัย + keywords
4. PDF Viewer — เปิดอ่าน PDF online (Signed URL)
5. Home screen — อัปเดตให้แสดงสถิติจริง

## ห้ามทำ

- ห้ามแตะ Next.js project ใน `/c/Project/Ebooks/`
- ห้ามแตะ Supabase production settings
- ห้าม cache PDF หรือ Signed URL
- ห้ามใช้ service role key ในแอป mobile

---

## Step 1 — ตรวจไฟล์ก่อนทำ

```bash
# ดูโครงสร้างทั้งหมด
ls app/
ls app/\(tabs\)/
ls lib/
ls components/

# ดู account screen
cat app/\(tabs\)/account.tsx

# ดู index screen
cat app/\(tabs\)/index.tsx | head -60

# ตรวจ packages ที่มี
cat package.json | grep -E "supabase|pdf|webview|router"
```

รายงานสิ่งที่พบก่อนดำเนินการต่อ

---

## Step 2 — ติดตั้ง Dependencies

```bash
npx expo install expo-web-browser
npx expo install react-native-webview
```

**หมายเหตุ:** ใช้ `WebView` สำหรับดู PDF online ผ่าน Signed URL — ง่ายและปลอดภัยกว่า native PDF library

---

## Step 3 — Data Layer

สร้าง `lib/research.ts`:

```typescript
import { supabase } from './supabase';

export type ResearchItem = {
  id: string;
  slug: string;
  title_th: string;
  title_en: string | null;
  year: number;
  abstract: string | null;
  cover_image: string | null;
  access_level: string;
  status: string;
  views: number;
  downloads: number;
  published_at: string | null;
  organizations: { name_th: string } | null;
  research_authors: {
    author_order: number;
    authors: {
      name: string;
      organization_name: string | null;
    } | null;
  }[];
  research_categories: {
    categories: { slug: string; name: string } | null;
  }[];
  research_keywords: {
    keywords: { keyword: string } | null;
  }[];
};

const RESEARCH_SELECT = `
  id, slug, title_th, title_en, year, abstract,
  cover_image, access_level, status, views, downloads, published_at,
  organizations ( name_th ),
  research_authors ( author_order, authors ( name, organization_name ) ),
  research_categories ( categories ( slug, name ) ),
  research_keywords ( keywords ( keyword ) )
`;

// ดึงรายการงานวิจัย public
export async function getPublicResearch(params: {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}) {
  const { search = '', category = '', page = 1, limit = 20 } = params;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('research_items')
    .select(RESEARCH_SELECT, { count: 'exact' })
    .eq('status', 'published')
    .in('access_level', ['public', 'read_only', 'metadata_only'])
    .order('published_at', { ascending: false })
    .range(from, to);

  if (search) {
    query = query.or(`title_th.ilike.%${search}%,title_en.ilike.%${search}%,abstract.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) return { data: [], count: 0 };
  return { data: data as ResearchItem[], count: count ?? 0 };
}

// ดึงงานวิจัยเดี่ยว
export async function getResearchBySlug(slug: string) {
  const { data, error } = await supabase
    .from('research_items')
    .select(RESEARCH_SELECT)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) return null;
  return data as ResearchItem;
}

// ดึง Signed URL สำหรับ PDF
export async function getResearchPdfUrl(slug: string): Promise<string | null> {
  // ดึงข้อมูล PDF file path
  const { data, error } = await supabase
    .from('research_items')
    .select('pdf_file, access_level')
    .eq('slug', slug)
    .single();

  if (error || !data?.pdf_file) return null;

  // สร้าง Signed URL อายุ 1 ชั่วโมง
  const { data: signedUrl, error: signError } = await supabase
    .storage
    .from('research-documents')
    .createSignedUrl(data.pdf_file, 3600);

  if (signError) return null;
  return signedUrl.signedUrl;
}

// ดึงสถิติสำหรับ Home screen
export async function getResearchStats() {
  const [researchCount, categoryCount, orgCount] = await Promise.all([
    supabase.from('research_items').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    supabase.from('organizations').select('id', { count: 'exact', head: true }),
  ]);

  return {
    research: researchCount.count ?? 0,
    categories: categoryCount.count ?? 0,
    organizations: orgCount.count ?? 0,
  };
}
```

---

## Step 4 — Research List Screen

แทนที่ `app/(tabs)/research.tsx` ทั้งหมด:

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TextInput, TouchableOpacity, ActivityIndicator,
  Image, RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '@/constants/theme';
import { getPublicResearch, ResearchItem } from '@/lib/research';

export default function ResearchScreen() {
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [total, setTotal] = useState(0);

  const load = useCallback(async (searchTerm = '') => {
    setLoading(true);
    const { data, count } = await getPublicResearch({ search: searchTerm, limit: 20 });
    setItems(data);
    setTotal(count);
    setLoading(false);
  }, []);

  useEffect(() => { load(search); }, [search]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(search);
    setRefreshing(false);
  };

  const handleSearch = () => setSearch(searchInput);

  const renderItem = ({ item }: { item: ResearchItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/research/${item.slug}`)}
      activeOpacity={0.7}
    >
      {item.cover_image ? (
        <Image source={{ uri: item.cover_image }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder]}>
          <Ionicons name="document-text-outline" size={32} color={colors.text.muted} />
        </View>
      )}
      <View style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={2}>{item.title_th}</Text>
        {item.title_en && (
          <Text style={styles.titleEn} numberOfLines={1}>{item.title_en}</Text>
        )}
        <Text style={styles.org} numberOfLines={1}>
          {item.organizations?.name_th ?? ''}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.year}>{item.year}</Text>
          <View style={styles.stats}>
            <Ionicons name="eye-outline" size={12} color={colors.text.muted} />
            <Text style={styles.statText}>{item.views}</Text>
            <Ionicons name="download-outline" size={12} color={colors.text.muted} />
            <Text style={styles.statText}>{item.downloads}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header + Search */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ງານວິໄຈ</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={colors.text.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="ຄົ້ນຫາ..."
              placeholderTextColor={colors.text.muted}
              value={searchInput}
              onChangeText={setSearchInput}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchInput.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchInput(''); setSearch(''); }}>
                <Ionicons name="close-circle" size={18} color={colors.text.muted} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>ຄົ້ນຫາ</Text>
          </TouchableOpacity>
        </View>
        {total > 0 && (
          <Text style={styles.totalText}>ພົບ {total} ລາຍການ</Text>
        )}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={48} color={colors.text.muted} />
          <Text style={styles.emptyText}>ບໍ່ພົບງານວິໄຈ</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  headerTitle: { ...typography.h3, color: colors.text.primary },
  searchRow: { flexDirection: 'row', gap: spacing.sm },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, ...typography.body, color: colors.text.primary },
  searchBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    justifyContent: 'center',
  },
  searchBtnText: { ...typography.label, color: '#fff' },
  totalText: { ...typography.caption, color: colors.text.secondary },
  list: { padding: spacing.md, gap: spacing.sm },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cover: { width: 80, height: 110 },
  coverPlaceholder: {
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: { flex: 1, padding: spacing.md, gap: 4 },
  title: { ...typography.label, color: colors.text.primary },
  titleEn: { ...typography.caption, color: colors.text.secondary },
  org: { ...typography.caption, color: colors.primary },
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  year: { ...typography.caption, color: colors.text.muted },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { ...typography.caption, color: colors.text.muted },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emptyText: { ...typography.body, color: colors.text.muted },
});
```

---

## Step 5 — Research Detail Screen

สร้าง `app/research/[slug].tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Image
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '@/constants/theme';
import { getResearchBySlug, ResearchItem } from '@/lib/research';
import { Button } from '@/components/ui/Button';

export default function ResearchDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [item, setItem] = useState<ResearchItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      getResearchBySlug(slug).then((data) => {
        setItem(data);
        setLoading(false);
      });
    }
  }, [slug]);

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
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>ລາຍລະອຽດ</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Cover */}
        {item.cover_image ? (
          <Image source={{ uri: item.cover_image }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="document-text-outline" size={64} color={colors.text.muted} />
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{item.title_th}</Text>
          {item.title_en && (
            <Text style={styles.titleEn}>{item.title_en}</Text>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <Text style={styles.statText}>{item.year}</Text>
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

          {/* PDF Button */}
          {canReadPdf && (
            <Button
              title="📄 ອ່ານ PDF ອອນລາຍ"
              onPress={() => router.push(`/research/${slug}/pdf`)}
              style={styles.pdfBtn}
            />
          )}

          {/* Organization */}
          {item.organizations?.name_th && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ໜ່ວຍງານ</Text>
              <Text style={styles.sectionText}>{item.organizations.name_th}</Text>
            </View>
          )}

          {/* Authors */}
          {authors && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ຜູ້ວິໄຈ</Text>
              <Text style={styles.sectionText}>{authors}</Text>
            </View>
          )}

          {/* Abstract */}
          {item.abstract && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ບົດຄັດຫຍໍ້</Text>
              <Text style={styles.sectionText}>{item.abstract}</Text>
            </View>
          )}

          {/* Keywords */}
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
```

---

## Step 6 — PDF Viewer Screen

สร้าง `app/research/[slug]/pdf.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/constants/theme';
import { getResearchPdfUrl } from '@/lib/research';

export default function PdfViewerScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (slug) {
      getResearchPdfUrl(slug).then((url) => {
        if (url) setPdfUrl(url);
        else setError(true);
        setLoading(false);
      });
    }
  }, [slug]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ອ່ານ PDF</Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>ກຳລັງໂຫລດ PDF...</Text>
        </View>
      ) : error || !pdfUrl ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>ບໍ່ສາມາດໂຫລດ PDF ໄດ້</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>ກັບໄປ</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          source={{ uri: pdfUrl }}
          style={styles.webview}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  headerTitle: { ...typography.h3, color: colors.text.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { ...typography.body, color: colors.text.secondary },
  errorText: { ...typography.body, color: colors.error },
  backLink: { ...typography.label, color: colors.primary },
  webview: { flex: 1 },
});
```

---

## Step 7 — อัปเดต Home Screen ให้แสดงสถิติจริง

เปิด `app/(tabs)/index.tsx` แล้วเพิ่ม data fetching:

```typescript
// เพิ่ม import
import { getResearchStats } from '@/lib/research';

// เพิ่ม state และ useEffect ใน component
const [stats, setStats] = useState({ research: 0, categories: 0, organizations: 0 });

useEffect(() => {
  getResearchStats().then(setStats);
}, []);

// แก้ stats array ให้ใช้ค่าจริง
{ label: 'ງານວິໄຈ', value: stats.research.toString(), icon: 'document-text-outline' },
{ label: 'ຫມວດຫມູ່', value: stats.categories.toString(), icon: 'folder-outline' },
{ label: 'ຫນ່ວຍງານ', value: stats.organizations.toString(), icon: 'business-outline' },
```

---

## Step 8 — รัน และทดสอบ

```bash
npx expo start --go
```

สแกน QR code ด้วย Expo Go แล้วทดสอบ:
- [ ] Research list โหลดข้อมูลจาก Supabase จริง
- [ ] ค้นหางานวิจัยได้
- [ ] กดการ์ดแล้วเข้าหน้า detail
- [ ] กด "ອ່ານ PDF ອອນລາຍ" แล้ว PDF เปิดได้
- [ ] Home screen แสดงสถิติจริง
- [ ] Pull to refresh ทำงาน

---

## รายงานผลที่ต้องการ

1. ผล Step 1 (โครงสร้างไฟล์จริง)
2. ไฟล์ที่สร้างและแก้ไข
3. ผลการทดสอบบนมือถือ (screenshot ถ้าได้)
4. ปัญหาที่พบ + วิธีแก้

---

## ตารางความเสี่ยง

| ความเสี่ยง | การป้องกัน |
|---|---|
| Signed URL หมดอายุ | สร้างใหม่ทุกครั้งที่เปิด PDF — ห้าม cache |
| PDF ไม่เปิดใน WebView | ตรวจ access_level ก่อน — เฉพาะ public/read_only |
| research_items query ช้า | limit 20 รายการต่อหน้า |
| cover_image URL ไม่ถูกต้อง | ใช้ placeholder ถ้าไม่มี cover |
| `app/research/[slug]/pdf.tsx` path ซับซ้อน | ตรวจ Expo Router nested route ก่อน |
