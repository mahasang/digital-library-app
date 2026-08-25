# Digital Library Mobile — Expo Phase 3: Account + Profile + Favorites

## Context

- Project: `/c/Project/digital-library-app` (Expo SDK 54)
- `app/(tabs)/account.tsx` มีอยู่แล้ว — แสดง email + logout
- `lib/auth.ts` มี `signOut()` แล้ว
- Supabase production: `wpiaynjqnmqimcuhexaq`
- Theme: background `#FAFAF7`, accent `#185ff2`
- OS: Windows, shell: Git Bash

## Scope Phase 3

1. Account screen — แสดงข้อมูล profile จริง (ชื่อ, email, role, organization)
2. Favorites — บันทึก/ยกเลิก favorite จากหน้า Research Detail
3. Reading History — บันทึกประวัติการเปิดอ่านงานวิจัย
4. Profile data layer — ดึงข้อมูลจาก `profiles` table

## ห้ามทำ

- ห้ามแตะ Next.js project ใน `/c/Project/Ebooks/`
- ห้ามแตะ Supabase production settings
- ห้ามแตะ RLS policies

---

## Step 1 — ตรวจ Schema ก่อน

ตรวจ tables ที่จะใช้:

```bash
# ตรวจ columns ของ profiles
# ตรวจ favorites และ reading_history tables
```

รัน SQL ใน Supabase Dashboard:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'profiles' ORDER BY ordinal_position;

SELECT column_name FROM information_schema.columns
WHERE table_name = 'reading_history' ORDER BY ordinal_position;

SELECT column_name FROM information_schema.columns  
WHERE table_name = 'favorites' ORDER BY ordinal_position;

-- ตรวจ user_roles
SELECT column_name FROM information_schema.columns
WHERE table_name = 'user_roles' ORDER BY ordinal_position;
```

รายงาน columns ที่พบก่อนดำเนินการต่อ

---

## Step 2 — Data Layer

สร้าง `lib/profile.ts`:

```typescript
import { supabase } from './supabase';

export type UserProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  organization_name: string | null;
  avatar_url: string | null;
  role: string | null;
};

// ดึงข้อมูล profile + role ของ user ที่ login อยู่
export async function getMyProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id, full_name, email,
      organization_name, avatar_url
    `)
    .eq('id', user.id)
    .single();

  if (error || !data) return null;

  // ดึง role จาก user_roles
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('roles ( name )')
    .eq('user_id', user.id)
    .single();

  return {
    ...data,
    email: user.email ?? null,
    role: (roleData?.roles as any)?.name ?? 'member',
  };
}

// Favorites
export async function getFavorites(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('favorites')
    .select('research_item_id')
    .eq('user_id', user.id);

  if (error || !data) return [];
  return data.map((f: any) => f.research_item_id);
}

export async function toggleFavorite(researchId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('research_item_id', researchId)
    .single();

  if (existing) {
    // ลบออก
    await supabase.from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('research_item_id', researchId);
    return false;
  } else {
    // เพิ่ม
    await supabase.from('favorites')
      .insert({ user_id: user.id, research_item_id: researchId });
    return true;
  }
}

// Reading History
export async function addReadingHistory(researchId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('reading_history').upsert({
    user_id: user.id,
    research_item_id: researchId,
    last_read_at: new Date().toISOString(),
  }, { onConflict: 'user_id,research_item_id' });
}
```

**หมายเหตุ:** ตรวจ column names จาก Step 1 ก่อน ถ้าต่างให้ปรับตาม schema จริง

---

## Step 3 — Account Screen

แทนที่ `app/(tabs)/account.tsx` ทั้งหมด:

```typescript
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { signOut } from '@/lib/auth';
import { getMyProfile, UserProfile } from '@/lib/profile';
import { useState, useEffect } from 'react';

const ROLE_LABELS: Record<string, string> = {
  guest: 'ຜູ້ຢ້ຽມຊົມ',
  member: 'ສະມາຊິກ',
  staff: 'ບຸກຄະລາກອນ',
  librarian: 'ບັນນາຮັກ',
  admin: 'ຜູ້ດູແລລະບົບ',
  super_admin: 'ຜູ້ດູແລລະບົບສູງສຸດ',
};

export default function AccountScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getMyProfile().then(setProfile);
  }, []);

  async function handleLogout() {
    Alert.alert(
      'ອອກຈາກລະບົບ',
      'ທ່ານຕ້ອງການອອກຈາກລະບົບບໍ?',
      [
        { text: 'ຍົກເລີກ', style: 'cancel' },
        {
          text: 'ອອກຈາກລະບົບ',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const { error } = await signOut();
            setLoading(false);
            if (error) Alert.alert('ຜິດພາດ', error.message);
          },
        },
      ]
    );
  }

  const initials = profile?.full_name
    ? profile.full_name.slice(0, 2).toUpperCase()
    : profile?.email?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ບັນຊີຂອງຂ້ອຍ</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.fullName}>
              {profile?.full_name ?? 'ບໍ່ລະບຸຊື່'}
            </Text>
            <Text style={styles.email}>{profile?.email ?? '—'}</Text>
            {profile?.role && (
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  {ROLE_LABELS[profile.role] ?? profile.role}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Organization */}
        {profile?.organization_name && (
          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={18} color={colors.primary} />
            <Text style={styles.infoText}>{profile.organization_name}</Text>
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="heart-outline" size={20} color={colors.primary} />
            <Text style={styles.menuText}>ລາຍການທີ່ມັກ</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={styles.menuText}>ປະຫວັດການອ່ານ</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <Button
          title="ອອກຈາກລະບົບ"
          onPress={handleLogout}
          loading={loading}
          variant="outline"
          style={styles.logoutBtn}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { ...typography.h3, color: colors.text.primary },
  scroll: { padding: spacing.lg, gap: spacing.md },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  avatar: {
    width: 64, height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.h2, color: '#fff' },
  profileInfo: { flex: 1, gap: 4 },
  fullName: { ...typography.h3, color: colors.text.primary },
  email: { ...typography.bodySmall, color: colors.text.secondary },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginTop: 4,
  },
  roleText: { ...typography.caption, color: colors.primary },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: { ...typography.body, color: colors.text.secondary, flex: 1 },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  menuText: { ...typography.body, color: colors.text.primary, flex: 1 },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
  logoutBtn: { borderColor: colors.error },
});
```

---

## Step 4 — เพิ่ม Favorite Button ใน Research Detail

เปิด `app/research/[slug].tsx` เพิ่ม favorite toggle:

```typescript
// เพิ่ม imports
import { getFavorites, toggleFavorite, addReadingHistory } from '@/lib/profile';

// เพิ่ม state
const [isFavorite, setIsFavorite] = useState(false);

// เพิ่มใน useEffect หลัง load item
useEffect(() => {
  if (item) {
    getFavorites().then((favs) => setIsFavorite(favs.includes(item.id)));
    addReadingHistory(item.id); // บันทึกประวัติการอ่าน
  }
}, [item]);

// เพิ่ม handler
async function handleFavorite() {
  if (!item) return;
  const nowFav = await toggleFavorite(item.id);
  setIsFavorite(nowFav);
}
```

เพิ่มปุ่ม favorite ใน header:

```tsx
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
```

เพิ่ม style:
```typescript
favBtn: { padding: 4 },
```

---

## Step 5 — รัน และทดสอบ

```bash
npx expo start --go
```

ทดสอบ:
- [ ] Account screen แสดงชื่อ, email, role ถูกต้อง
- [ ] กดปุ่ม ❤️ ใน Research Detail — เปลี่ยนสีได้
- [ ] Logout แล้วกลับมาหน้า Login
- [ ] กด Logout มี confirm dialog ก่อน

---

## รายงานผลที่ต้องการ

1. ผล SQL จาก Step 1 (columns ของ profiles, favorites, reading_history)
2. ไฟล์ที่สร้าง/แก้ไข
3. ผลการทดสอบบนมือถือ
4. ปัญหาที่พบ + วิธีแก้

---

## ตารางความเสี่ยง

| ความเสี่ยง | การป้องกัน |
|---|---|
| `profiles` column names ต่างจาก prompt | ตรวจจาก Step 1 ก่อนเขียนโค้ด |
| `favorites` ไม่มี RLS สำหรับ user ของตัวเอง | ตรวจ RLS policies ถ้า query ล้มเหลว |
| `reading_history` upsert conflict key ผิด | ตรวจ unique constraint จาก Step 1 |
| Logout แล้ว navigation ไม่ redirect | auth guard ใน `(tabs)/_layout.tsx` จัดการให้อัตโนมัติ |
