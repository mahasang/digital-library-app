-- ============================================================================
-- Phase C (mobile): ratings + comments บนงานวิจัยแต่ละชิ้น
--
-- หมายเหตุ: ตารางเหล่านี้ยังไม่มีอยู่ใน schema เดิม — สร้างใหม่ตาม pattern เดียวกับ
-- favorites/reading_history ที่มีอยู่แล้ว (RLS เจ้าของแถวเท่านั้นสำหรับ write,
-- ใช้ security-definer function สำหรับ aggregate/cross-user read เพื่อไม่ต้องเปิด
-- raw SELECT policy กว้างเกินจำเป็น — เหมือน user_max_role_rank()/log_reading_history()
-- ที่มีอยู่แล้วในระบบ)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ratings: คะแนนดาว (1-5) ที่ user ให้กับงานวิจัยแต่ละชิ้น — 1 คะแนนต่อ 1 คน ต่อ 1 เรื่อง
-- ----------------------------------------------------------------------------
create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  research_id uuid not null references public.research_items (id) on delete cascade,
  score smallint not null check (score between 1 and 5),
  created_at timestamptz not null default now(),
  unique (user_id, research_id)
);

comment on table public.ratings is 'คะแนนดาว (1-5) ที่ user ให้กับงานวิจัยแต่ละชิ้น — unique ต่อ user+research รองรับ upsert เมื่อให้คะแนนซ้ำ';

create index ratings_research_id_idx on public.ratings (research_id);

alter table public.ratings enable row level security;

grant select, insert, update, delete on public.ratings to authenticated;

-- เจ้าของเห็น/แก้/ลบคะแนนของตัวเองเท่านั้น — ไม่มี public "select all" ตรงๆ บนตารางดิบ
-- เพราะจะเปิดให้เห็นว่า user_id ไหนให้กี่ดาว, ค่าเฉลี่ยรวมเข้าถึงผ่าน get_rating_stats() แทน
create policy "ratings_select_own" on public.ratings
  for select using (user_id = auth.uid());
create policy "ratings_insert_own" on public.ratings
  for insert with check (user_id = auth.uid() and public.user_max_role_rank() >= 10);
create policy "ratings_update_own" on public.ratings
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "ratings_delete_own" on public.ratings
  for delete using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- comments: ความคิดเห็นสาธารณะต่องานวิจัยแต่ละชิ้น
-- ----------------------------------------------------------------------------
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  research_id uuid not null references public.research_items (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

comment on table public.comments is 'ความคิดเห็นสาธารณะต่องานวิจัยแต่ละชิ้น — เนื้อหาไม่ sensitive จึงเปิด select ให้ทุกคนเห็นได้ตรงๆ';

create index comments_research_id_idx on public.comments (research_id, created_at desc);

alter table public.comments enable row level security;

grant select, insert, delete on public.comments to authenticated;
grant select on public.comments to anon;

-- content/user_id ไม่ sensitive (เป็น public comment thread โดยธรรมชาติ) จึงเปิด select ทุกคนได้
-- แต่ยังต้องใช้ get_comments() ฝั่ง client เพราะการ join profiles ตรงๆ จะโดน RLS ของ
-- profiles (เห็นได้แค่ของตัวเอง/staff) บล็อกจนชื่อผู้แสดงความเห็นคนอื่นหายไป
create policy "comments_select_all" on public.comments
  for select using (true);
create policy "comments_insert_own" on public.comments
  for insert with check (user_id = auth.uid() and public.user_max_role_rank() >= 10);
create policy "comments_delete_own_or_staff" on public.comments
  for delete using (user_id = auth.uid() or public.user_max_role_rank() >= 30);

-- ----------------------------------------------------------------------------
-- get_favorites_count(): จำนวนคนที่กดถูกใจงานวิจัยชิ้นหนึ่ง (รวมทุกคน)
-- ต้องใช้ security definer เพราะ favorites_select_own จำกัดให้เห็นแค่แถวของตัวเอง
-- (raw count(*) จากฝั่ง client จะได้แค่ 0 หรือ 1 ไม่ใช่ยอดรวมจริง)
-- ----------------------------------------------------------------------------
create or replace function public.get_favorites_count(p_research_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer from public.favorites where research_id = p_research_id;
$$;

grant execute on function public.get_favorites_count(uuid) to authenticated, anon;

-- ----------------------------------------------------------------------------
-- get_rating_stats(): ค่าเฉลี่ย + จำนวนคะแนนทั้งหมดของงานวิจัยชิ้นหนึ่ง
-- ต้องใช้ security definer ด้วยเหตุผลเดียวกับ get_favorites_count — เพื่อไม่ต้องเปิด
-- raw select policy บน ratings ที่จะทำให้เห็น user_id ของคนอื่นที่ให้คะแนน
-- ----------------------------------------------------------------------------
create or replace function public.get_rating_stats(p_research_id uuid)
returns table(avg_score numeric, rating_count integer)
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(avg(score), 0)::numeric, count(*)::integer
  from public.ratings
  where research_id = p_research_id;
$$;

grant execute on function public.get_rating_stats(uuid) to authenticated, anon;

-- ----------------------------------------------------------------------------
-- get_comments(): ดึงความคิดเห็นพร้อมชื่อ/รูปผู้เขียน โดยไม่โดน profiles RLS บล็อก
-- (profiles_select_own_or_staff เปิดให้เห็นแค่โปรไฟล์ตัวเอง/staff ขึ้นไป — join ตรงๆ
-- จากฝั่ง client จะได้ profiles เป็น null สำหรับความเห็นของคนอื่น)
-- ----------------------------------------------------------------------------
create or replace function public.get_comments(p_research_id uuid, p_limit integer default 20)
returns table(
  id uuid,
  content text,
  created_at timestamptz,
  user_id uuid,
  author_name text,
  author_avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id, c.content, c.created_at, c.user_id,
    coalesce(p.full_name, p.email, 'ຜູ້ໃຊ້') as author_name,
    p.avatar_url as author_avatar_url
  from public.comments c
  left join public.profiles p on p.id = c.user_id
  where c.research_id = p_research_id
  order by c.created_at desc
  limit p_limit;
$$;

grant execute on function public.get_comments(uuid, integer) to authenticated, anon;
