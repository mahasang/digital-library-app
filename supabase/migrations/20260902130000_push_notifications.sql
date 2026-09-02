-- Push notifications support สำหรับ mobile app:
-- 1. profiles.push_token — เก็บ Expo push token ล่าสุดของแต่ละ device/user
-- 2. notification_preferences — เพิ่ม toggle เฉพาะ push แยกจาก in_app/email เดิม
--    (new_research_in_app_enabled/new_research_email_enabled มีอยู่แล้วจาก
--    20260808100000_document_access_requests.sql — คนละช่องทางกับ push จึงต้อง
--    เพิ่มคอลัมน์ใหม่ ไม่ใช้ร่วมกับของเดิม)

alter table public.profiles
  add column push_token text;

comment on column public.profiles.push_token is 'Expo push token (ExponentPushToken[...]) จาก mobile app — null หมายถึงยังไม่ได้ลงทะเบียนหรือถูกล้างตอน sign out';

alter table public.notification_preferences
  add column new_research_push_enabled boolean not null default true,
  add column comment_push_enabled boolean not null default true,
  add column system_push_enabled boolean not null default true;

comment on column public.notification_preferences.new_research_push_enabled is 'ส่ง push แจ้งงานวิจัยใหม่ในหมวดที่ผู้ใช้ติดตาม';
comment on column public.notification_preferences.comment_push_enabled is 'ส่ง push เมื่อมีคำเห็นใหม่ที่เกี่ยวข้องกับผู้ใช้';
comment on column public.notification_preferences.system_push_enabled is 'ส่ง push สำหรับประกาศ/แจ้งเตือนทั่วไปจากระบบ';
