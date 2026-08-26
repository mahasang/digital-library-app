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
    categories: { slug: string; name_th: string; name_en: string | null } | null;
  }[];
  research_keywords: {
    keywords: { keyword: string } | null;
  }[];
};

export const RESEARCH_SELECT = `
  id, slug, title_th, title_en, year, abstract,
  cover_image, access_level, status, views, downloads, published_at,
  organizations ( name_th ),
  research_authors ( author_order, authors ( name, organization_name ) ),
  research_categories ( categories ( slug, name_th, name_en ) ),
  research_keywords ( keywords ( keyword ) )
`;

// เหมือน RESEARCH_SELECT แต่ join research_categories/categories แบบ !inner —
// จำเป็นสำหรับ .eq('research_categories.categories.slug', ...): ถ้าไม่ใช้ !inner
// PostgREST จะแค่ทำให้ embedded resource ที่ไม่ตรง category เป็น null แต่ไม่กรองแถวนอกออก
// (research_categories เป็นความสัมพันธ์ many จาก research_items จึงต้องระบุ !inner ทั้งสองชั้น)
const RESEARCH_SELECT_BY_CATEGORY = RESEARCH_SELECT.replace(
  'research_categories ( categories ( slug, name_th, name_en ) )',
  'research_categories!inner ( categories!inner ( slug, name_th, name_en ) )'
);

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
    .select(category ? RESEARCH_SELECT_BY_CATEGORY : RESEARCH_SELECT, { count: 'exact' })
    .eq('status', 'published')
    .in('access_level', ['public', 'read_only', 'metadata_only'])
    .order('published_at', { ascending: false })
    .range(from, to);

  if (search) {
    query = query.or(`title_th.ilike.%${search}%,title_en.ilike.%${search}%,abstract.ilike.%${search}%`);
  }

  if (category) {
    query = query.eq('research_categories.categories.slug', category);
  }

  const { data, error, count } = await query;
  if (error) return { data: [], count: 0 };
  return { data: data as unknown as ResearchItem[], count: count ?? 0 };
}

export async function getResearchBySlug(slug: string) {
  const { data, error } = await supabase
    .from('research_items')
    .select(RESEARCH_SELECT)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) return null;
  return data as unknown as ResearchItem;
}

export async function getResearchPdfUrl(slug: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('research_items')
    .select('pdf_file, access_level')
    .eq('slug', slug)
    .single();

  if (error || !data?.pdf_file) return null;

  const { data: signedUrl, error: signError } = await supabase
    .storage
    .from('research-documents')
    .createSignedUrl(data.pdf_file, 3600);

  if (signError) return null;
  return signedUrl.signedUrl;
}

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
