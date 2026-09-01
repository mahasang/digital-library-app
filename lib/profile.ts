import { supabase } from './supabase';
import { RESEARCH_SELECT, ResearchItem } from './research';

export type UserProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  organization_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  date_of_birth: string | null;
  address: string | null;
  role: string | null;
};

export async function getMyProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id, full_name, email,
      organization_name, avatar_url,
      phone, date_of_birth, address
    `)
    .eq('id', user.id)
    .single();

  if (error || !data) return null;

  // ผู้ใช้หนึ่งคนมีได้หลายบทบาท (ไม่มี unique constraint กันไว้) — เลือกบทบาทที่ rank สูงสุด
  const { data: roleRows } = await supabase
    .from('user_roles')
    .select('roles ( name, rank )')
    .eq('user_id', user.id);

  type RoleRow = { name: string; rank: number };
  const topRole = (roleRows ?? []).reduce<RoleRow | null>((top, row) => {
    const r = row.roles as unknown as RoleRow | null;
    if (!r) return top;
    return !top || r.rank > top.rank ? r : top;
  }, null);

  return {
    ...data,
    email: user.email ?? null,
    role: topRole?.name ?? 'member',
  };
}

// อัปโหลดรูปโปรไฟล์ — path คงที่ {uid}/avatar.{ext} ต่อคนเดียว (upsert:true
// แทนที่ของเดิมเสมอ) ตรง bucket "avatars" เดียวกับฝั่งเว็บ (ดู
// supabase/migrations/20260831120000_add_profile_fields.sql) ใช้ arrayBuffer
// แทน File/Blob ตรงๆ เพราะ React Native ไม่มี Blob จาก local file URI ให้ใช้
// ตรงๆ แบบเบราว์เซอร์ — ต้อง fetch() URI ของไฟล์ในเครื่องก่อนแปลงเป็น arrayBuffer
export async function uploadAvatar(
  uri: string,
  mimeType: string
): Promise<{ url: string | null; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { url: null, error: 'not signed in' };

  const ext = mimeType.split('/')[1] ?? 'jpg';
  const path = `${user.id}/avatar.${ext}`;

  let arraybuffer: ArrayBuffer;
  try {
    arraybuffer = await fetch(uri).then((res) => res.arrayBuffer());
  } catch {
    return { url: null, error: 'read file failed' };
  }

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, arraybuffer, { contentType: mimeType, upsert: true });

  if (uploadError) return { url: null, error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
  // กัน cache เดิมของ path เดียวกัน (upsert ทับไฟล์แต่ URL ไม่เปลี่ยน)
  const cacheBustedUrl = `${publicUrl}?v=${Date.now()}`;

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: cacheBustedUrl })
    .eq('id', user.id);
  if (error) return { url: null, error: error.message };

  return { url: cacheBustedUrl, error: null };
}

// Favorites
export async function getFavorites(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('favorites')
    .select('research_id')
    .eq('user_id', user.id);

  if (error || !data) return [];
  return data.map((f) => f.research_id as string);
}

export async function toggleFavorite(researchId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('research_id', researchId)
    .single();

  if (existing) {
    await supabase.from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('research_id', researchId);
    return false;
  } else {
    await supabase.from('favorites')
      .insert({ user_id: user.id, research_id: researchId });
    return true;
  }
}

// Reading History — ใช้ RPC log_reading_history() แบบเดียวกับเว็บ Next.js
// (reading_history ไม่มี unique constraint ต่อ user+research จึงบันทึกทุกครั้งที่เปิดอ่าน
// ไม่ใช่ upsert แถวเดียว, และฟังก์ชันนี้ตรวจ published + auth.uid() ให้ในตัว)
export async function addReadingHistory(slug: string): Promise<void> {
  await supabase.rpc('log_reading_history', { p_slug: slug });
}

// ดึงงานวิจัยเต็มรูปแบบที่ user กดถูกใจ เรียงตามเวลาที่กดถูกใจล่าสุดก่อน
export async function getFavoriteResearch(): Promise<ResearchItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('favorites')
    .select(`created_at, research_items!inner ( ${RESEARCH_SELECT} )`)
    .eq('user_id', user.id)
    .eq('research_items.status', 'published')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data
    .map((row) => row.research_items as unknown as ResearchItem)
    .filter(Boolean);
}

// ResearchItem + เวลาที่อ่านล่าสุด — ใช้ตอน group ประวัติการอ่านตามวันที่จริงที่อ่าน
// (ห้ามใช้ published_at ของ research_items แทน นั่นคือวันที่ตีพิมพ์ ไม่ใช่วันที่ user อ่าน)
export type ReadingHistoryItem = ResearchItem & { read_at: string };

// ดึงงานวิจัยที่ user เคยเปิดอ่าน เรียงตามเวลาอ่านล่าสุดก่อน — เอาแค่ครั้งล่าสุดของแต่ละเรื่อง
// (reading_history ไม่มี unique constraint จึงมีได้หลายแถวต่อเรื่องเดียวกัน ต้อง dedup ฝั่ง client)
export async function getReadingHistory(): Promise<ReadingHistoryItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('reading_history')
    .select(`read_at, research_items!inner ( ${RESEARCH_SELECT} )`)
    .eq('user_id', user.id)
    .eq('research_items.status', 'published')
    .order('read_at', { ascending: false })
    .limit(50);

  if (error || !data) return [];

  type HistoryRow = { read_at: string; research_items: ResearchItem | null };
  const rows = data as unknown as HistoryRow[];

  const seen = new Set<string>();
  return rows
    .filter((row) => {
      const id = row.research_items?.id;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .map((row) => ({ ...(row.research_items as ResearchItem), read_at: row.read_at }));
}

// ลบ reading_history ทั้งหมดของ user
export async function clearAllHistory(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('reading_history')
    .delete()
    .eq('user_id', user.id);
}

// ลบ reading_history ของ research_item หนึ่งชิ้น (ลบทุก rows ของ user+research นั้น)
export async function removeHistoryItem(researchId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('reading_history')
    .delete()
    .eq('user_id', user.id)
    .eq('research_id', researchId);
}
