# Mobile App — Phase 2: Auth & Profile UI

## ขอบเขต
- `app/(auth)/login.tsx` — full replace
- `app/(auth)/register.tsx` — full replace
- `app/(tabs)/account.tsx` — เพิ่ม edit profile + change password modal
- ห้ามแตะไฟล์อื่น

---

## สิ่งที่เปลี่ยน

### login.tsx + register.tsx
1. **Validation messages → ภาษาลาว** ทั้งหมด
2. **Alert messages → ภาษาลาว** ทั้งหมด
3. **เพิ่มปุ่ม back** ← ที่ header (กด back ออกจาก auth screen)
4. **forgot password** — ปุ่ม "ລືມລະຫັດຜ່ານ?" ใน login → Alert บอกให้ติดต่อ admin

### account.tsx
1. **Edit profile modal** — กด edit ที่ profile card → modal มี field `full_name` + `organization_name` + บันทึก
2. **Change password modal** — menu item ใหม่ "ປ່ຽນລະຫັດຜ່ານ" → modal มี current/new/confirm password
3. **update profile** — เรียก `supabase.from('profiles').update(...)` ตรงๆ ใน modal (ไม่ต้องสร้าง lib function ใหม่)
4. **change password** — เรียก `supabase.auth.updateUser({ password: newPassword })` ตรงๆ

---

## โค้ดเต็ม `app/(auth)/login.tsx`

```tsx
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert, TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { spacing, typography, radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'ກະລຸນາປ້ອນອີເມວ';
    else if (!email.includes('@')) e.email = 'ຮູບແບບອີເມວບໍ່ຖືກຕ້ອງ';
    if (!password) e.password = 'ກະລຸນາປ້ອນລະຫັດຜ່ານ';
    return e;
  }

  async function handleLogin() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setLoading(true);
    setErrors({});
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      Alert.alert('ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ', 'ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ');
      return;
    }
    router.replace('/(tabs)');
  }

  function handleForgotPassword() {
    Alert.alert(
      'ລືມລະຫັດຜ່ານ',
      'ກະລຸນາຕິດຕໍ່ຜູ້ດູແລລະບົບ ຫຼື ສົ່ງອີເມວມາທີ່ info@digitallibrary.la',
      [{ text: 'ຕົກລົງ' }]
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Back button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoArea}>
          <View style={styles.logoIcon}>
            <Ionicons name="library" size={36} color={colors.primary} />
          </View>
          <Text style={styles.appName}>Digital Library Plus</Text>
          <Text style={styles.appNameLao}>ຫ້ອງສະໝຸດດິຈິຕອນ</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>ເຂົ້າສູ່ລະບົບ</Text>
          <Text style={styles.subtitle}>ເຂົ້າສູ່ລະບົບເພື່ອເຂົ້າເຖິງງານວິໄຈ</Text>

          <Input
            label="ອີເມວ"
            placeholder="your@email.com"
            value={email}
            onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email: undefined })); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
          />

          <Input
            label="ລະຫັດຜ່ານ"
            placeholder="••••••••"
            value={password}
            onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }}
            secureToggle
            error={errors.password}
          />

          {/* Forgot password */}
          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
            <Text style={styles.forgotText}>ລືມລະຫັດຜ່ານ?</Text>
          </TouchableOpacity>

          <Button
            title="ເຂົ້າສູ່ລະບົບ"
            onPress={handleLogin}
            loading={loading}
            style={styles.mainBtn}
          />

          <Button
            title="ຍັງບໍ່ມີບັນຊີ? ສະໝັກສະມາຊິກ"
            onPress={() => router.push('/(auth)/register' as any)}
            variant="ghost"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    backBtn: {
      position: 'absolute',
      top: spacing.xxl,
      left: spacing.md,
      zIndex: 10,
      padding: spacing.xs,
    },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl + spacing.lg,
      paddingBottom: spacing.xl,
    },
    logoArea: { alignItems: 'center', marginBottom: spacing.xxl },
    logoIcon: {
      width: 80, height: 80,
      borderRadius: radius.xl,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    appName: { ...typography.h3, color: colors.primary },
    appNameLao: { ...typography.bodySmall, color: colors.text.secondary, marginTop: 2 },
    form: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: { ...typography.h2, color: colors.text.primary, marginBottom: spacing.xs },
    subtitle: { ...typography.body, color: colors.text.secondary, marginBottom: spacing.lg },
    forgotBtn: { alignSelf: 'flex-end', marginTop: -spacing.xs, marginBottom: spacing.sm },
    forgotText: { ...typography.caption, color: colors.primary },
    mainBtn: { marginTop: spacing.xs, marginBottom: spacing.sm },
  });
}
```

---

## โค้ดเต็ม `app/(auth)/register.tsx`

```tsx
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert, TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { spacing, typography, radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export default function RegisterScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string; password?: string; confirmPassword?: string;
  }>({});

  function validate() {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'ກະລຸນາປ້ອນອີເມວ';
    else if (!email.includes('@')) e.email = 'ຮູບແບບອີເມວບໍ່ຖືກຕ້ອງ';
    if (!password) e.password = 'ກະລຸນາປ້ອນລະຫັດຜ່ານ';
    else if (password.length < 8) e.password = 'ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 8 ຕົວອັກສອນ';
    if (password && confirmPassword !== password) e.confirmPassword = 'ລະຫັດຜ່ານບໍ່ຕົງກັນ';
    return e;
  }

  async function handleRegister() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setLoading(true);
    setErrors({});
    const { error } = await supabase.auth.signUp({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      Alert.alert('ສະໝັກສະມາຊິກບໍ່ສຳເລັດ', 'ອີເມວນີ້ອາດຖືກໃຊ້ແລ້ວ ຫຼື ເກີດຂໍ້ຜິດພາດ');
      return;
    }
    Alert.alert(
      'ສະໝັກສະມາຊິກສຳເລັດ',
      'ກະລຸນາກວດສອບອີເມວຂອງທ່ານເພື່ອຢືນຢັນບັນຊີ',
      [{ text: 'ຕົກລົງ', onPress: () => router.replace('/(auth)/login') }]
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Back button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoArea}>
          <View style={styles.logoIcon}>
            <Ionicons name="library" size={36} color={colors.primary} />
          </View>
          <Text style={styles.appName}>Digital Library Plus</Text>
          <Text style={styles.appNameLao}>ຫ້ອງສະໝຸດດິຈິຕອນ</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>ສະໝັກສະມາຊິກ</Text>
          <Text style={styles.subtitle}>ສະໝັກສະມາຊິກເພື່ອເຂົ້າເຖິງງານວິໄຈ ແລະ ຟີເຈີເພີ່ມເຕີມ</Text>

          <Input
            label="ອີເມວ"
            placeholder="your@email.com"
            value={email}
            onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email: undefined })); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
          />

          <Input
            label="ລະຫັດຜ່ານ"
            placeholder="••••••••"
            value={password}
            onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }}
            secureToggle
            error={errors.password}
          />

          <Input
            label="ຢືນຢັນລະຫັດຜ່ານ"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={t => { setConfirmPassword(t); setErrors(e => ({ ...e, confirmPassword: undefined })); }}
            secureToggle
            error={errors.confirmPassword}
          />

          <Button
            title="ສະໝັກສະມາຊິກ"
            onPress={handleRegister}
            loading={loading}
            style={styles.mainBtn}
          />

          <Button
            title="ມີບັນຊີຢູ່ແລ້ວ? ເຂົ້າສູ່ລະບົບ"
            onPress={() => router.push('/(auth)/login' as any)}
            variant="ghost"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    backBtn: {
      position: 'absolute',
      top: spacing.xxl,
      left: spacing.md,
      zIndex: 10,
      padding: spacing.xs,
    },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl + spacing.lg,
      paddingBottom: spacing.xl,
    },
    logoArea: { alignItems: 'center', marginBottom: spacing.xxl },
    logoIcon: {
      width: 80, height: 80,
      borderRadius: radius.xl,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    appName: { ...typography.h3, color: colors.primary },
    appNameLao: { ...typography.bodySmall, color: colors.text.secondary, marginTop: 2 },
    form: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: { ...typography.h2, color: colors.text.primary, marginBottom: spacing.xs },
    subtitle: { ...typography.body, color: colors.text.secondary, marginBottom: spacing.lg },
    mainBtn: { marginTop: spacing.sm, marginBottom: spacing.sm },
  });
}
```

---

## การแก้ `app/(tabs)/account.tsx`

แก้เฉพาะส่วนที่เพิ่ม — ไม่ full replace เพราะไฟล์ใหญ่

### เพิ่ม imports ที่หัวไฟล์
```tsx
import { Modal, TextInput as RNTextInput } from 'react-native';
import { supabase } from '@/lib/supabase';
```

### เพิ่ม state ใน AccountScreen component
```tsx
const [editVisible, setEditVisible] = useState(false);
const [editName, setEditName] = useState('');
const [editOrg, setEditOrg] = useState('');
const [editLoading, setEditLoading] = useState(false);

const [pwVisible, setPwVisible] = useState(false);
const [pwCurrent, setPwCurrent] = useState('');
const [pwNew, setPwNew] = useState('');
const [pwConfirm, setPwConfirm] = useState('');
const [pwLoading, setPwLoading] = useState(false);
```

### เพิ่ม functions ใน AccountScreen component
```tsx
function openEdit() {
  setEditName(profile?.full_name ?? '');
  setEditOrg(profile?.organization_name ?? '');
  setEditVisible(true);
}

async function saveProfile() {
  setEditLoading(true);
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('profiles').update({
      full_name: editName.trim(),
      organization_name: editOrg.trim(),
    }).eq('id', user.id);
    setProfile(p => p ? { ...p, full_name: editName.trim(), organization_name: editOrg.trim() } : p);
  }
  setEditLoading(false);
  setEditVisible(false);
}

async function changePassword() {
  if (!pwNew || pwNew.length < 8) {
    Alert.alert('ຜິດພາດ', 'ລະຫັດຜ່ານໃໝ່ຕ້ອງມີຢ່າງໜ້ອຍ 8 ຕົວອັກສອນ');
    return;
  }
  if (pwNew !== pwConfirm) {
    Alert.alert('ຜິດພາດ', 'ລະຫັດຜ່ານໃໝ່ບໍ່ຕົງກັນ');
    return;
  }
  setPwLoading(true);
  const { error } = await supabase.auth.updateUser({ password: pwNew });
  setPwLoading(false);
  if (error) {
    Alert.alert('ຜິດພາດ', 'ບໍ່ສາມາດປ່ຽນລະຫັດຜ່ານໄດ້');
    return;
  }
  Alert.alert('ສຳເລັດ', 'ປ່ຽນລະຫັດຜ່ານສຳເລັດ');
  setPwVisible(false);
  setPwCurrent(''); setPwNew(''); setPwConfirm('');
}
```

### เพิ่ม edit button ใน profile card
ใน JSX ของ `profileCard` เพิ่มปุ่ม edit มุมขวาบน:
```tsx
<View style={styles.profileCard}>
  {/* ... เนื้อหาเดิม ... */}
  {/* ปุ่ม edit */}
  <TouchableOpacity
    style={styles.editProfileBtn}
    onPress={openEdit}
  >
    <Ionicons name="pencil-outline" size={18} color={colors.primary} />
  </TouchableOpacity>
</View>
```

### เพิ่ม menu item "ປ່ຽນລະຫັດຜ່ານ" ใน menuCard
เพิ่มหลัง divider ของ ປະຫວັດການອ່ານ:
```tsx
<View style={styles.divider} />
<TouchableOpacity
  style={styles.menuItem}
  onPress={() => setPwVisible(true)}
>
  <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
  <Text style={styles.menuText}>ປ່ຽນລະຫັດຜ່ານ</Text>
  <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
</TouchableOpacity>
```

### เพิ่ม Modals ก่อน closing `</View>` ของ container
```tsx
{/* Edit Profile Modal */}
<Modal visible={editVisible} animationType="slide" transparent>
  <View style={styles.modalOverlay}>
    <View style={styles.modalCard}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>ແກ້ໄຂໂປຣໄຟລ</Text>
        <TouchableOpacity onPress={() => setEditVisible(false)}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.modalLabel}>ຊື່ເຕັມ</Text>
      <RNTextInput
        style={styles.modalInput}
        value={editName}
        onChangeText={setEditName}
        placeholder="ຊື່ເຕັມ"
        placeholderTextColor={colors.text.muted}
      />
      <Text style={styles.modalLabel}>ໜ່ວຍງານ</Text>
      <RNTextInput
        style={styles.modalInput}
        value={editOrg}
        onChangeText={setEditOrg}
        placeholder="ໜ່ວຍງານ"
        placeholderTextColor={colors.text.muted}
      />
      <Button title="ບັນທຶກ" onPress={saveProfile} loading={editLoading} style={{ marginTop: spacing.md }} />
    </View>
  </View>
</Modal>

{/* Change Password Modal */}
<Modal visible={pwVisible} animationType="slide" transparent>
  <View style={styles.modalOverlay}>
    <View style={styles.modalCard}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>ປ່ຽນລະຫັດຜ່ານ</Text>
        <TouchableOpacity onPress={() => setPwVisible(false)}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.modalLabel}>ລະຫັດຜ່ານໃໝ່</Text>
      <RNTextInput
        style={styles.modalInput}
        value={pwNew}
        onChangeText={setPwNew}
        placeholder="ຢ່າງໜ້ອຍ 8 ຕົວອັກສອນ"
        placeholderTextColor={colors.text.muted}
        secureTextEntry
      />
      <Text style={styles.modalLabel}>ຢືນຢັນລະຫັດຜ່ານໃໝ່</Text>
      <RNTextInput
        style={styles.modalInput}
        value={pwConfirm}
        onChangeText={setPwConfirm}
        placeholder="ຢືນຢັນລະຫັດຜ່ານ"
        placeholderTextColor={colors.text.muted}
        secureTextEntry
      />
      <Button title="ປ່ຽນລະຫັດຜ່ານ" onPress={changePassword} loading={pwLoading} style={{ marginTop: spacing.md }} />
    </View>
  </View>
</Modal>
```

### เพิ่ม styles ใน `createStyles`
```tsx
editProfileBtn: {
  position: 'absolute',
  top: spacing.md,
  right: spacing.md,
  padding: spacing.xs,
},
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'flex-end',
},
modalCard: {
  backgroundColor: colors.surface,
  borderTopLeftRadius: radius.xl,
  borderTopRightRadius: radius.xl,
  padding: spacing.lg,
  gap: spacing.xs,
  paddingBottom: spacing.xxl,
},
modalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: spacing.md,
},
modalTitle: { ...typography.h3, color: colors.text.primary },
modalLabel: { ...typography.label, color: colors.text.primary, marginTop: spacing.sm },
modalInput: {
  borderWidth: 1.5,
  borderColor: colors.border,
  borderRadius: radius.md,
  paddingHorizontal: spacing.md,
  height: 52,
  ...typography.body,
  color: colors.text.primary,
  backgroundColor: colors.background,
},
```

---

## วิธีใช้ใน Cursor

```
@app/(auth)/login.tsx @app/(auth)/register.tsx @app/(tabs)/account.tsx

Phase 2:
1. login.tsx: full replace ตามโค้ดด้านบน
2. register.tsx: full replace ตามโค้ดด้านบน
3. account.tsx: เพิ่ม edit profile modal + change password modal ตาม spec
ห้ามแตะไฟล์อื่น
```

## ตรวจสอบหลังรัน

1. `npx tsc --noEmit` — 0 errors
2. Login — validation เป็นภาษาลาว, error หายเมื่อพิมพ์ใหม่
3. Login — ปุ่มลืมรหัสผ่าน → Alert ภาษาลาว
4. Login/Register — ปุ่ม back ← ซ้ายบน
5. Account — กดปุ่ม ✏️ ที่ profile card → modal เปิดจากล่าง
6. Account — กด ປ່ຽນລະຫັດຜ່ານ ใน menu → modal เปิดจากล่าง
7. Modal กด X → ปิด
