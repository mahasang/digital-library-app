# Mobile App — Push Notifications (expo-notifications)

## ขอบเขต
- `lib/notifications.ts` — สร้างใหม่: register push token + send local notification
- `app/_layout.tsx` — เพิ่ม notification setup on mount
- `app/(tabs)/account.tsx` — เพิ่ม notification preferences toggle
- `constants/translations.ts` — เพิ่ม keys ใหม่
- ห้ามแตะไฟล์อื่น

---

## Part 1: สร้าง `lib/notifications.ts`

```ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

// ตั้งค่า notification handler — แสดงเมื่อ app เปิดอยู่
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerPushToken(): Promise<string | null> {
  // ต้องเป็น physical device เท่านั้น
  if (!Device.isDevice) return null;

  // ขอ permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  // Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'ການແຈ້ງເຕືອນ',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#185ff2',
    });
  }

  // ดึง Expo Push Token
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: 'digital-library-app', // ใช้ slug จาก app.json
  });

  return token.data;
}

export async function savePushToken(token: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('profiles')
    .update({ push_token: token })
    .eq('id', user.id);
}

export async function clearPushToken(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('profiles')
    .update({ push_token: null })
    .eq('id', user.id);
}

export async function getNotificationPreferences() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('notification_preferences')
    .select('new_research_push_enabled, comment_push_enabled, system_push_enabled')
    .eq('user_id', user.id)
    .single();

  return data;
}

export async function updateNotificationPreference(
  key: 'new_research_push_enabled' | 'comment_push_enabled' | 'system_push_enabled',
  value: boolean
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('notification_preferences')
    .upsert({ user_id: user.id, [key]: value }, { onConflict: 'user_id' });
}
```

---

## Part 2: แก้ `app/_layout.tsx`

เพิ่ม imports:
```ts
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { registerPushToken, savePushToken } from '@/lib/notifications';
import { router } from 'expo-router';
```

แก้ RootLayout component:
```tsx
export default function RootLayout() {
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    SplashScreen.hideAsync();

    // Register push token
    registerPushToken().then(token => {
      if (token) savePushToken(token);
    });

    // Listener: notification received ขณะ app เปิด
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listener: user กด notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      // navigate ตาม data
      if (data?.research_slug) {
        router.push(`/research/${data.research_slug}` as any);
      } else if (data?.screen === 'notifications') {
        router.push('/notifications' as any);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <LanguageProvider>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="research/[slug]" />
          <Stack.Screen name="research/[slug]/pdf" />
          <Stack.Screen name="search" />
          <Stack.Screen name="history" />
          <Stack.Screen name="notifications" />
        </Stack>
      </ThemeProvider>
    </LanguageProvider>
  );
}
```

---

## Part 3: แก้ `app/(tabs)/account.tsx`

เพิ่ม imports:
```ts
import { getNotificationPreferences, updateNotificationPreference } from '@/lib/notifications';
import { Switch } from 'react-native';
```

เพิ่ม state ใน AccountScreen:
```ts
const [notifPrefs, setNotifPrefs] = useState<{
  new_research_push_enabled: boolean;
  comment_push_enabled: boolean;
  system_push_enabled: boolean;
} | null>(null);
```

เพิ่มใน useEffect ที่โหลด profile:
```ts
getNotificationPreferences().then(setNotifPrefs);
```

เพิ่ม notification settings section ใน menuCard (logged-in view) — หลัง theme/language section:

```tsx
{/* Notification settings */}
{notifPrefs && (
  <>
    <View style={styles.divider} />
    <View style={styles.menuItem}>
      <Ionicons name="notifications-outline" size={20} color={colors.primary} />
      <Text style={styles.menuText}>{t('notif_settings')}</Text>
    </View>
    {[
      { key: 'new_research_push_enabled' as const, label: t('notif_new_research') },
      { key: 'comment_push_enabled' as const, label: t('notif_comment') },
      { key: 'system_push_enabled' as const, label: t('notif_system') },
    ].map(item => (
      <View key={item.key} style={[styles.menuItem, { paddingLeft: spacing.xl }]}>
        <Text style={[styles.menuText, { flex: 1, color: colors.text.secondary }]}>
          {item.label}
        </Text>
        <Switch
          value={notifPrefs[item.key]}
          onValueChange={async (val) => {
            setNotifPrefs(prev => prev ? { ...prev, [item.key]: val } : prev);
            await updateNotificationPreference(item.key, val);
          }}
          trackColor={{ false: colors.border, true: colors.primary + '80' }}
          thumbColor={notifPrefs[item.key] ? colors.primary : colors.text.muted}
        />
      </View>
    ))}
  </>
)}
```

---

## Part 4: เพิ่ม translations

เพิ่มใน `constants/translations.ts`:
```ts
notif_settings:     { lo: 'ການຕັ້ງຄ່າການແຈ້ງເຕືອນ', th: 'การตั้งค่าการแจ้งเตือน', en: 'Notification settings', vi: 'Cài đặt thông báo' },
notif_new_research: { lo: 'ງານວິໄຈໃໝ່ໃນໝວດທີ່ຕິດຕາມ', th: 'งานวิจัยใหม่ในหมวดที่ติดตาม', en: 'New research in followed categories', vi: 'Nghiên cứu mới trong danh mục theo dõi' },
notif_comment:      { lo: 'ມີຄຳເຫັນໃໝ່',              th: 'มีความคิดเห็นใหม่',        en: 'New comments',                       vi: 'Bình luận mới' },
notif_system:       { lo: 'ແຈ້ງເຕືອນຈາກລະບົບ',        th: 'แจ้งเตือนจากระบบ',         en: 'System notifications',               vi: 'Thông báo hệ thống' },
```

---

## Part 5: เพิ่ม plugin ใน `app.json`

เพิ่มใน plugins array:
```json
"expo-notifications"
```

---

## วิธีใช้ใน Cursor

```
@lib/notifications.ts @app/_layout.tsx @app/(tabs)/account.tsx @constants/translations.ts @app.json

Push Notifications setup:
1. สร้าง lib/notifications.ts ใหม่
2. _layout.tsx: register push token on mount + notification listeners
3. account.tsx: notification preferences toggles
4. translations.ts: เพิ่ม notif_* keys
5. app.json: เพิ่ม expo-notifications plugin
ห้ามแตะไฟล์อื่น
```

## ตรวจสอบหลังรัน

1. `npx tsc --noEmit` — 0 errors
2. หน้า ຕັ້ງຄ່າ — แสดง notification toggles (ต้อง login)
3. Toggle เปลี่ยน → บันทึกใน DB
4. build APK → ติดตั้งบนมือถือจริง → ขอ permission notification

## หมายเหตุ

- Push token จะได้จากมือถือจริงเท่านั้น (ไม่ได้จาก emulator)
- Expo Push Token format: `ExponentPushToken[...]`
- ขั้นตอนถัดไป: สร้าง Supabase Edge Function เพื่อส่ง push จริงๆ
