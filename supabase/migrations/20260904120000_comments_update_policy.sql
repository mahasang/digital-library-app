-- เพิ่ม update policy ให้ comments — ก่อนหน้านี้มีแค่ select/insert/delete
-- (delete_own_or_staff มีอยู่แล้วจาก 20260828120000_ratings_and_comments.sql)
-- ต้อง grant update ควบคู่กับ policy ด้วย ไม่งั้น RLS policy ผ่านแต่ privilege
-- ระดับตารางยังบล็อกอยู่ (ตอน insert/delete ได้ grant ไปแล้วตอนสร้างตาราง แต่ update ไม่มี)

grant update on public.comments to authenticated;

create policy "comments_update_own" on public.comments
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());
