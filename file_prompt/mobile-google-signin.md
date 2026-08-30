# Mobile App — Google Sign-In with Supabase

## ขอบเขต
- `lib/auth.ts` — เพิ่ม `signInWithGoogle()`
- `app/(auth)/login.tsx` — เพิ่มปุ่ม Google Sign-In
- `constants/translations.ts` — เพิ่ม key `login_google`
- ห้ามแตะไฟล์อื่น

---

## หลักการทำงาน

ใช้ `expo-auth-session` + `expo-web-browser` เปิด browser สำหรับ Google OAuth
แล้วส่ง token ให้ Supabase authenticate ต่อ

Flow:
1. User กดปุ่ม "เข้าสู่ระบบด้วย Google"
2. เปิด browser ไปที่ Supabase OAuth URL
3. User login กับ Google
4. Redirect กลับมาที่ app ผ่าน scheme `digitallibraryapp://`
5. Supabase สร้าง session

---

## Part 1: `lib/auth.ts`

```ts
import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export async function signOut() {
  return supabase.auth.signOut();
}

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  try {
    // redirect URI ที่ Supabase จะส่งกลับมา
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'digitallibraryapp',
      path: 'auth/callback',
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data?.url) {
      return { error: error?.message ?? 'OAuth URL not found' };
    }

    // เปิด browser
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

    if (result.type !== 'success') {
      return { error: null }; // user ปิด browser เอง ไม่ใช่ error
    }

    // ดึง tokens จาก URL
    const url = new URL(result.url);
    const accessToken = url.searchParams.get('access_token')
      ?? new URLSearchParams(url.hash.slice(1)).get('access_token');
    const refreshToken = url.searchParams.get('refresh_token')
      ?? new URLSearchParams(url.hash.slice(1)).get('refresh_token');

    if (!accessToken) {
      return { error: 'No access token received' };
    }

    // set session ใน Supabase
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken ?? '',
    });

    if (sessionError) return { error: sessionError.message };

    return { error: null };
  } catch (e: any) {
    return { error: e?.message ?? 'Unknown error' };
  }
}
```

---

## Part 2: เพิ่ม key ใน `constants/translations.ts`

เพิ่มใน translations object:
```ts
login_google: { lo: 'ເຂົ້າສູ່ລະບົບດ້ວຍ Google', th: 'เข้าสู่ระบบด้วย Google', en: 'Continue with Google', vi: 'Đăng nhập với Google' },
login_or:     { lo: 'ຫຼື',                        th: 'หรือ',                  en: 'or',                  vi: 'hoặc' },
```

---

## Part 3: `app/(auth)/login.tsx`

### เพิ่ม imports
```ts
import { signInWithGoogle } from '@/lib/auth';
```

### เพิ่ม state
```ts
const [googleLoading, setGoogleLoading] = useState(false);
```

### เพิ่ม function
```ts
async function handleGoogleLogin() {
  setGoogleLoading(true);
  const { error } = await signInWithGoogle();
  setGoogleLoading(false);
  if (error) {
    Alert.alert(t('common_error'), error);
    return;
  }
  // session จะถูก set อัตโนมัติ useSession hook จะ detect และ redirect
}
```

### เพิ่ม UI ใน form — ต่อจากปุ่ม login_btn และก่อน login_no_account

```tsx
{/* Divider */}
<View style={styles.divider}>
  <View style={styles.dividerLine} />
  <Text style={styles.dividerText}>{t('login_or')}</Text>
  <View style={styles.dividerLine} />
</View>

{/* Google Sign-In */}
<TouchableOpacity
  style={styles.googleBtn}
  onPress={handleGoogleLogin}
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
      <Text style={styles.googleBtnText}>{t('login_google')}</Text>
    </>
  )}
</TouchableOpacity>
```

### เพิ่ม imports ที่หัวไฟล์
```ts
import { ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
```

### เพิ่ม styles ใน createStyles
```ts
divider: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.sm,
  marginVertical: spacing.sm,
},
dividerLine: {
  flex: 1,
  height: 1,
  backgroundColor: colors.border,
},
dividerText: {
  ...typography.caption,
  color: colors.text.muted,
},
googleBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.sm,
  height: 48,
  borderRadius: radius.md,
  borderWidth: 1.5,
  borderColor: colors.border,
  backgroundColor: colors.surface,
  marginBottom: spacing.sm,
},
googleIcon: {
  width: 20,
  height: 20,
},
googleBtnText: {
  ...typography.label,
  color: colors.text.primary,
},
```

---

## Part 4: ตั้งค่า app.json scheme

ตรวจสอบว่า `app.json` มี scheme แล้ว:
```json
"scheme": "digitallibraryapp"
```
ถ้ามีอยู่แล้ว ไม่ต้องแก้

---

## วิธีใช้ใน Cursor

```
@lib/auth.ts @app/(auth)/login.tsx @constants/translations.ts

Google Sign-In:
1. lib/auth.ts: full replace ตามโค้ดด้านบน
2. translations.ts: เพิ่ม login_google และ login_or keys
3. login.tsx: เพิ่ม Google button, divider, styles, function, imports
ห้ามแตะไฟล์อื่น
```

## ตรวจสอบหลังรัน

1. `npx tsc --noEmit` — 0 errors
2. หน้า login แสดงปุ่ม Google ใต้ปุ่ม login ปกติ
3. มี divider "ຫຼື" / "หรือ" / "or" คั่น
4. กดปุ่ม Google → เปิด browser → login → กลับมา app → session active

## หมายเหตุ

- Google icon ใช้ favicon ของ Google (ไม่ติดลิขสิทธิ์สำหรับ OAuth button)
- ถ้า user ปิด browser เอง → ไม่แสดง error (เป็น behavior ปกติ)
- session จะถูก detect โดย `useSession` hook อัตโนมัติ → redirect ไป home
