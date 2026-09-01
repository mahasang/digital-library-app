# Mobile App — Account & Auth Fixes

## ขอบเขต
- `app/(tabs)/account.tsx` — fix logout navigation + date picker + เพิ่ม menu items
- `app/(auth)/register.tsx` — เพิ่ม Google Sign-In button
- `app/(auth)/login.tsx` — fix back navigation หลัง logout
- `constants/translations.ts` — เพิ่ม keys ใหม่
- ห้ามแตะไฟล์อื่น

---

## Fix 1: Logout navigation — ล้าง stack

`app/(tabs)/account.tsx` — หา handleLogout function แล้วแก้:

```ts
async function handleLogout() {
  await signOut();
  // replace ทั้ง stack กลับไปหน้าแรก ป้องกัน back กลับมา login
  router.replace('/(tabs)' as any);
}
```

และตรวจสอบว่า logout Alert ใช้ handleLogout ถูกต้อง

---

## Fix 2: Date picker — ใช้ DateTimePicker

ติดตั้งก่อน (ถ้ายังไม่มี):
```bash
npx expo install @react-native-community/datetimepicker
```

`app/(tabs)/account.tsx`:

เพิ่ม import:
```ts
import DateTimePicker from '@react-native-community/datetimepicker';
```

เพิ่ม state:
```ts
const [showDatePicker, setShowDatePicker] = useState(false);
const [editDate, setEditDate] = useState<Date | null>(null);
```

ใน edit profile modal — แทนที่ TextInput ของวันเดือนปี ด้วย:
```tsx
<Text style={styles.modalLabel}>{t('field_dob')}</Text>
<TouchableOpacity
  style={styles.datePickerBtn}
  onPress={() => setShowDatePicker(true)}
>
  <Text style={[styles.datePickerText, !editDate && { color: colors.text.muted }]}>
    {editDate ? editDate.toLocaleDateString('lo-LA') : t('field_dob_placeholder')}
  </Text>
  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
</TouchableOpacity>

{showDatePicker && (
  <DateTimePicker
    value={editDate ?? new Date(2000, 0, 1)}
    mode="date"
    display="spinner"
    maximumDate={new Date()}
    onChange={(event, date) => {
      setShowDatePicker(false);
      if (date) setEditDate(date);
    }}
  />
)}
```

เพิ่ม styles:
```ts
datePickerBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderWidth: 1.5,
  borderColor: colors.border,
  borderRadius: radius.md,
  paddingHorizontal: spacing.md,
  height: 52,
  backgroundColor: colors.background,
},
datePickerText: {
  ...typography.body,
  color: colors.text.primary,
},
```

เพิ่ม translations:
```ts
field_dob:             { lo: 'ວັນເດືອນປີເກີດ',    th: 'วันเกิด',          en: 'Date of birth',     vi: 'Ngày sinh' },
field_dob_placeholder: { lo: 'ເລືອກວັນເດືອນປີ',    th: 'เลือกวันเกิด',     en: 'Select date',       vi: 'Chọn ngày' },
```

---

## Fix 3: เพิ่ม menu items ใน account.tsx

เพิ่ม section ใหม่ "ກ່ຽວກັບ" ใน menuCard (ทั้ง guest และ logged-in view) ก่อนปุ่ม logout:

```tsx
{/* ── About section ── */}
<View style={styles.menuCard}>
  {/* Privacy Policy */}
  <TouchableOpacity
    style={styles.menuItem}
    onPress={() => Linking.openURL('https://digital-library-sls.vercel.app/lo/privacy')}
  >
    <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
    <Text style={styles.menuText}>{t('settings_privacy')}</Text>
    <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
  </TouchableOpacity>

  <View style={styles.divider} />

  {/* Terms of Service */}
  <TouchableOpacity
    style={styles.menuItem}
    onPress={() => Linking.openURL('https://digital-library-sls.vercel.app/lo/terms')}
  >
    <Ionicons name="document-text-outline" size={20} color={colors.primary} />
    <Text style={styles.menuText}>{t('settings_terms')}</Text>
    <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
  </TouchableOpacity>

  <View style={styles.divider} />

  {/* Rate the app */}
  <TouchableOpacity
    style={styles.menuItem}
    onPress={() => Linking.openURL('market://details?id=la.org.digitallibrary.mobile')}
  >
    <Ionicons name="star-outline" size={20} color={colors.primary} />
    <Text style={styles.menuText}>{t('settings_rate')}</Text>
    <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
  </TouchableOpacity>

  <View style={styles.divider} />

  {/* Report bug */}
  <TouchableOpacity
    style={styles.menuItem}
    onPress={() => Linking.openURL('mailto:info@digitallibrary.la?subject=Bug Report')}
  >
    <Ionicons name="bug-outline" size={20} color={colors.primary} />
    <Text style={styles.menuText}>{t('settings_bug')}</Text>
    <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
  </TouchableOpacity>

  <View style={styles.divider} />

  {/* App version */}
  <View style={styles.menuItem}>
    <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
    <Text style={styles.menuText}>{t('settings_version')}</Text>
    <Text style={styles.menuVersion}>1.0.0</Text>
  </View>
</View>
```

เพิ่ม import Linking:
```ts
import { Linking } from 'react-native';
```

เพิ่ม style:
```ts
menuVersion: {
  ...typography.caption,
  color: colors.text.muted,
  marginLeft: 'auto' as any,
},
```

เพิ่ม translations ใน constants/translations.ts:
```ts
settings_privacy: { lo: 'ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ', th: 'นโยบายความเป็นส่วนตัว', en: 'Privacy Policy',    vi: 'Chính sách bảo mật' },
settings_terms:   { lo: 'ເງື່ອນໄຂການໃຊ້ງານ',       th: 'เงื่อนไขการใช้งาน',   en: 'Terms of Service', vi: 'Điều khoản sử dụng' },
settings_rate:    { lo: 'ໃຫ້ຄະແນນແອັບ',            th: 'ให้คะแนนแอป',         en: 'Rate the app',     vi: 'Đánh giá ứng dụng' },
settings_bug:     { lo: 'ລາຍງານບັນຫາ',              th: 'รายงานปัญหา',          en: 'Report a bug',     vi: 'Báo lỗi' },
settings_version: { lo: 'ເວີຊັນແອັບ',               th: 'เวอร์ชันแอป',          en: 'App version',      vi: 'Phiên bản' },
settings_about:   { lo: 'ກ່ຽວກັບ',                  th: 'เกี่ยวกับ',            en: 'About',            vi: 'Giới thiệu' },
```

---

## Fix 4: Register — เพิ่ม Google Sign-In button

`app/(auth)/register.tsx` — เพิ่มเหมือน login.tsx:

เพิ่ม import:
```ts
import { signInWithGoogle } from '@/lib/auth';
import { ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
```

เพิ่ม state:
```ts
const [googleLoading, setGoogleLoading] = useState(false);
```

เพิ่ม function:
```ts
async function handleGoogleRegister() {
  setGoogleLoading(true);
  const { error } = await signInWithGoogle();
  setGoogleLoading(false);
  if (error) {
    Alert.alert(t('common_error'), error);
  }
}
```

เพิ่ม UI หลังปุ่ม register และก่อน "มีบัญชีอยู่แล้ว":
```tsx
{/* Divider */}
<View style={styles.divider}>
  <View style={styles.dividerLine} />
  <Text style={styles.dividerText}>{t('login_or')}</Text>
  <View style={styles.dividerLine} />
</View>

{/* Google */}
<TouchableOpacity
  style={styles.googleBtn}
  onPress={handleGoogleRegister}
  disabled={googleLoading}
  activeOpacity={0.8}
>
  {googleLoading ? (
    <ActivityIndicator size="small" color={colors.text.primary} />
  ) : (
    <>
      <Image
        source={{ uri: 'https://www.google.com/favicon.ico' }}
        style={styles.googleIcon}
        contentFit="contain"
      />
      <Text style={styles.googleBtnText}>{t('register_google')}</Text>
    </>
  )}
</TouchableOpacity>
```

เพิ่ม styles เหมือน login.tsx:
```ts
divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.sm },
dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
dividerText: { ...typography.caption, color: colors.text.muted },
googleBtn: {
  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  gap: spacing.sm, height: 48, borderRadius: radius.md,
  borderWidth: 1.5, borderColor: colors.border,
  backgroundColor: colors.surface, marginBottom: spacing.sm,
},
googleIcon: { width: 20, height: 20 },
googleBtnText: { ...typography.label, color: colors.text.primary },
```

เพิ่ม translation:
```ts
register_google: { lo: 'ສະໝັກດ້ວຍ Google', th: 'สมัครด้วย Google', en: 'Continue with Google', vi: 'Đăng ký với Google' },
```

---

## Fix 5: Login — fix back navigation

`app/(auth)/login.tsx` — หา router.replace หลัง login success แล้วตรวจสอบว่าใช้:
```ts
router.replace('/(tabs)');
```
ไม่ใช่ `router.push` — ถ้าใช้ push อยู่ให้เปลี่ยนเป็น replace

---

## วิธีใช้ใน Cursor

```
@app/(tabs)/account.tsx @app/(auth)/register.tsx @app/(auth)/login.tsx @constants/translations.ts

แก้ตาม prompt file นี้:
1. account.tsx: fix logout → router.replace, date picker, About section menu
2. register.tsx: เพิ่ม Google button
3. login.tsx: ตรวจสอบ router.replace หลัง login
4. translations.ts: เพิ่ม keys ใหม่ทั้งหมด
ห้ามแตะไฟล์อื่น
```

## ตรวจสอบหลังรัน

1. `npx tsc --noEmit` — 0 errors
2. Logout → กด back → ไม่กลับไปหน้า login
3. Register มีปุ่ม Google
4. แก้โปรไฟล์ → กดวันเกิด → DatePicker เปิด
5. หน้าตั้งค่า มี Privacy, Terms, Rate, Bug report, Version
6. กด Privacy/Terms → เปิด browser
7. กด Rate → เปิด Google Play
8. กด Bug report → เปิด email
