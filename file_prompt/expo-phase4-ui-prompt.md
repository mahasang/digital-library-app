# Digital Library Mobile — UI Enhancement Phase: Dark Mode + Animations + UX

## Context

- Project: `/c/Project/digital-library-app` (Expo SDK 54)
- Theme: `constants/theme.ts` มี colors, spacing, radius, typography, shadows
- Current accent: `#185ff2`, background: `#FAFAF7`
- OS: Windows, shell: Git Bash

## Scope

1. Dark mode — ตรวจสอบ system theme แล้วสลับ colors อัตโนมัติ
2. Home screen — เพิ่ม Hero/Banner section
3. Account screen — avatar จากรูปจริง (ถ้ามี) หรือ initials
4. Splash screen — ตั้งค่าใน app.json
5. Skeleton loading — แทน ActivityIndicator ใน Research list
6. Page transition animation
7. Tab badge — แสดงจำนวน favorites

## ห้ามทำ

- ห้ามแตะ Next.js project ใน `/c/Project/Ebooks/`
- ห้ามแตะ Supabase production settings
- ห้ามแตะ RLS policies

---

## Step 1 — ตรวจไฟล์ก่อนทำ

```bash
cat constants/theme.ts
cat app/\(tabs\)/index.tsx
cat app/\(tabs\)/_layout.tsx
cat app.json
ls assets/
```

รายงานสิ่งที่พบก่อนดำเนินการต่อ

---

## Step 2 — Dark Mode

### 2.1 อัปเดต `constants/theme.ts`

เพิ่ม dark colors:

```typescript
export const darkColors = {
  background: '#0f172a',
  surface: '#1e293b',
  primary: '#3b82f6',
  primaryLight: '#1e3a5f',
  primaryDark: '#2563eb',
  text: {
    primary: '#f1f5f9',
    secondary: '#94a3b8',
    muted: '#64748b',
    inverse: '#0f172a',
  },
  border: '#334155',
  error: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
};
```

### 2.2 สร้าง `hooks/useTheme.ts`

```typescript
import { useColorScheme } from 'react-native';
import { colors, darkColors } from '@/constants/theme';

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return {
    isDark,
    colors: isDark ? darkColors : colors,
  };
}
```

### 2.3 อัปเดตทุก screen ให้ใช้ `useTheme()`

ทุก screen ที่ใช้ `colors` จาก theme ให้เปลี่ยนเป็น:

```typescript
// ก่อน
import { colors } from '@/constants/theme';

// หลัง
import { useTheme } from '@/hooks/useTheme';
const { colors } = useTheme();
```

**ไฟล์ที่ต้องอัปเดต:**
- `app/(tabs)/index.tsx`
- `app/(tabs)/research.tsx`
- `app/(tabs)/account.tsx`
- `app/(auth)/login.tsx`
- `app/(auth)/register.tsx`
- `app/research/[slug].tsx`
- `app/research/[slug]/pdf.tsx`
- `components/ui/Button.tsx`
- `components/ui/Input.tsx`
- `components/ui/Card.tsx`

---

## Step 3 — Hero/Banner Section ใน Home Screen

เพิ่ม hero section ก่อน stats cards ใน `app/(tabs)/index.tsx`:

```tsx
{/* Hero Banner */}
<LinearGradient
  colors={isDark 
    ? ['#1e3a5f', '#0f172a'] 
    : ['#185ff2', '#1248c4']
  }
  style={styles.hero}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
>
  <View style={styles.heroContent}>
    <Text style={styles.heroTitle}>ຍິນດີຕ້ອນຮັບ 👋</Text>
    <Text style={styles.heroSubtitle}>
      ຄົ້ນຫາງານວິໄຈກວ່າ {stats.research} ລາຍການ
    </Text>
    <TouchableOpacity
      style={styles.heroBtn}
      onPress={() => router.push('/(tabs)/research')}
    >
      <Text style={styles.heroBtnText}>ຄົ້ນຫາງານວິໄຈ →</Text>
    </TouchableOpacity>
  </View>
  <Ionicons 
    name="library" 
    size={80} 
    color="rgba(255,255,255,0.15)" 
    style={styles.heroIcon}
  />
</LinearGradient>
```

เพิ่ม styles:
```typescript
hero: {
  borderRadius: radius.xl,
  padding: spacing.lg,
  marginHorizontal: spacing.lg,
  marginTop: spacing.md,
  overflow: 'hidden',
  position: 'relative',
},
heroContent: { gap: spacing.sm },
heroTitle: { ...typography.h2, color: '#fff' },
heroSubtitle: { ...typography.body, color: 'rgba(255,255,255,0.8)' },
heroBtn: {
  alignSelf: 'flex-start',
  backgroundColor: 'rgba(255,255,255,0.2)',
  borderRadius: radius.md,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  marginTop: spacing.xs,
},
heroBtnText: { ...typography.label, color: '#fff' },
heroIcon: {
  position: 'absolute',
  right: -10,
  top: -10,
},
```

---

## Step 4 — Avatar จากรูปจริง ใน Account Screen

เพิ่ม avatar_url support ใน `app/(tabs)/account.tsx`:

```tsx
{/* Avatar */}
{profile?.avatar_url ? (
  <Image
    source={{ uri: profile.avatar_url }}
    style={styles.avatarImage}
  />
) : (
  <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
    <Text style={styles.avatarText}>{initials}</Text>
  </View>
)}
```

เพิ่ม style:
```typescript
avatarImage: {
  width: 64,
  height: 64,
  borderRadius: radius.full,
},
```

---

## Step 5 — Splash Screen

แก้ `app.json` ส่วน splash:

```json
"splash": {
  "image": "./assets/splash-icon.png",
  "resizeMode": "contain",
  "backgroundColor": "#185ff2"
},
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/adaptive-icon.png",
    "backgroundColor": "#185ff2"
  },
  "package": "la.org.digitallibrary.mobile"
}
```

ติดตั้ง expo-splash-screen:
```bash
npx expo install expo-splash-screen
```

เพิ่มใน `app/_layout.tsx`:
```typescript
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // ซ่อน splash หลังโหลดเสร็จ
    SplashScreen.hideAsync();
  }, []);
  // ...
}
```

---

## Step 6 — Skeleton Loading

สร้าง `components/ui/Skeleton.tsx`:

```typescript
import { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
  borderRadius?: number;
}

export function Skeleton({ width = '100%', height = 16, style, borderRadius = radius.sm }: SkeletonProps) {
  const { isDark } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: isDark ? '#334155' : '#e2e8f0',
          opacity,
        },
        style,
      ]}
    />
  );
}

// Skeleton สำหรับ Research Card
export function ResearchCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[skStyles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Skeleton width={80} height={110} borderRadius={0} />
      <View style={skStyles.content}>
        <Skeleton height={16} width="90%" />
        <Skeleton height={12} width="60%" style={{ marginTop: 6 }} />
        <Skeleton height={12} width="40%" style={{ marginTop: 6 }} />
        <View style={skStyles.meta}>
          <Skeleton height={10} width={40} />
          <Skeleton height={10} width={60} />
        </View>
      </View>
    </View>
  );
}

const skStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});
```

ใช้ใน `app/(tabs)/research.tsx` แทน ActivityIndicator:

```tsx
// ก่อน
{loading ? (
  <View style={styles.center}>
    <ActivityIndicator size="large" color={colors.primary} />
  </View>
) : ...}

// หลัง
{loading ? (
  <View style={styles.list}>
    {[1,2,3,4,5].map((i) => <ResearchCardSkeleton key={i} />)}
  </View>
) : ...}
```

---

## Step 7 — Page Transition Animation

ติดตั้ง reanimated:
```bash
npx expo install react-native-reanimated
```

เพิ่ม plugin ใน `app.json`:
```json
"plugins": [
  "expo-router",
  "react-native-reanimated/plugin"
]
```

สร้าง `components/ui/FadeInView.tsx`:

```typescript
import { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

export function FadeInView({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    setTimeout(() => {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withTiming(0, { duration: 300 });
    }, delay);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}
```

ใช้ใน Research Detail และ Account screen:
```tsx
import { FadeInView } from '@/components/ui/FadeInView';

// ห่อ content ด้วย FadeInView
<FadeInView>
  {/* content */}
</FadeInView>
```

---

## Step 8 — Tab Badge (จำนวน Favorites)

เปิด `app/(tabs)/_layout.tsx` เพิ่ม favorites count:

```typescript
import { getFavoritesCount } from '@/lib/profile';
const [favCount, setFavCount] = useState(0);

useEffect(() => {
  if (session) {
    getFavoritesCount().then(setFavCount);
  }
}, [session]);
```

เพิ่มใน `lib/profile.ts`:
```typescript
export async function getFavoritesCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count } = await supabase
    .from('favorites')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  return count ?? 0;
}
```

เพิ่ม badge ใน Research tab (หรือสร้าง Favorites tab ใหม่):
```tsx
<Tabs.Screen
  name="research"
  options={{
    title: 'ງານວິໄຈ',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="search-outline" size={size} color={color} />
    ),
    tabBarBadge: favCount > 0 ? favCount : undefined,
    tabBarBadgeStyle: { backgroundColor: colors.error },
  }}
/>
```

---

## Step 9 — รัน และทดสอบ

```bash
npx expo start --go --clear
```

ทดสอบ:
- [ ] Dark mode เปลี่ยนตาม system settings
- [ ] Hero banner แสดงใน Home
- [ ] Skeleton แสดงตอนโหลด Research list
- [ ] Animation เมื่อเปิดหน้า Detail
- [ ] Badge แสดงจำนวน favorites บน tab
- [ ] Avatar รูปจริง (ถ้ามี url)

---

## รายงานผลที่ต้องการ

1. ผล Step 1 (โครงสร้างไฟล์)
2. ไฟล์ที่สร้าง/แก้ไข
3. ผลการทดสอบบนมือถือ
4. ปัญหาที่พบ + วิธีแก้

---

## ตารางความเสี่ยง

| ความเสี่ยง | การป้องกัน |
|---|---|
| `useColorScheme` ไม่ update realtime | ใช้ `Appearance.addChangeListener` ถ้าจำเป็น |
| `react-native-reanimated` ต้อง rebuild | ต้องรัน `npx expo start --go --clear` |
| LinearGradient ใน Expo Go | `expo-linear-gradient` มีอยู่แล้ว — ไม่มีปัญหา |
| Tab badge ไม่ update real-time | ใช้ `useFocusEffect` reload count เมื่อ tab focus |
