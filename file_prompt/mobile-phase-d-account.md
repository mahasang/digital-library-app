# Mobile App — Phase D: Account (theme always visible + language switcher)

## ขอบเขต
- `app/(tabs)/account.tsx` — แก้เฉพาะส่วนที่ระบุ (ไม่ full replace)
- `contexts/ThemeContext.tsx` — ดูก่อนว่ามี language context ไหม ถ้าไม่มีให้สร้าง `contexts/LanguageContext.tsx`
- ห้ามแตะไฟล์อื่น

---

## สิ่งที่เปลี่ยน

### 1. Theme toggle — แสดงเสมอ ไม่ว่า login หรือไม่
ย้าย theme menu item ออกจาก logged-in section → ใส่ใน guest view ด้วย

### 2. Language switcher — เพิ่ม menu item ใหม่
- ภาษาที่รองรับ: `ລາວ` / `ไทย` / `English`
- บันทึกใน `AsyncStorage` key: `app_language`
- ใช้ `LanguageContext` share state ทั่ว app
- ตอนนี้ยังไม่ต้องแปลทุก string — แค่บันทึกค่าและแสดง label ที่เลือกอยู่

---

## ขั้นตอนที่ 1: สร้าง `contexts/LanguageContext.tsx`

```tsx
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppLanguage = 'lo' | 'th' | 'en';

const LANG_KEY = 'app_language';

const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  lo: 'ລາວ',
  th: 'ไทย',
  en: 'English',
};

type LanguageContextType = {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  languageLabel: string;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'lo',
  setLanguage: () => {},
  languageLabel: 'ລາວ',
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('lo');

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((val) => {
      if (val === 'lo' || val === 'th' || val === 'en') {
        setLanguageState(val);
      }
    });
  }, []);

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang);
    AsyncStorage.setItem(LANG_KEY, lang);
  }, []);

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      languageLabel: LANGUAGE_LABELS[language],
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export { LANGUAGE_LABELS };
```

---

## ขั้นตอนที่ 2: เพิ่ม `LanguageProvider` ใน `app/_layout.tsx`

เปิด `app/_layout.tsx` แล้วแก้:

```tsx
// เพิ่ม import
import { LanguageProvider } from '@/contexts/LanguageContext';

// wrap ThemeProvider ด้วย LanguageProvider
return (
  <LanguageProvider>
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        ...
      </Stack>
    </ThemeProvider>
  </LanguageProvider>
);
```

---

## ขั้นตอนที่ 3: แก้ `app/(tabs)/account.tsx`

### เพิ่ม import
```ts
import { useLanguage, AppLanguage, LANGUAGE_LABELS } from '@/contexts/LanguageContext';
```

### เพิ่ม hook ใน component
```ts
const { language, setLanguage } = useLanguage();
```

### แก้ guest view — เพิ่ม theme + language card

ใน `if (!session)` return block เพิ่ม settings card ก่อน login/register buttons:

```tsx
if (!session) {
  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ຕັ້ງຄ່າ</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Settings card สำหรับ guest */}
        <View style={styles.menuCard}>
          {/* Theme toggle */}
          <View style={styles.menuItem}>
            <Ionicons name="moon-outline" size={20} color={colors.primary} />
            <Text style={styles.menuText}>ຮູບແບບສີ</Text>
            <View style={styles.themeButtons}>
              {(['light', 'system', 'dark'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setTheme(m)}
                  style={[styles.themeBtn, mode === m && { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.themeBtnText, mode === m && { color: '#fff' }]}>
                    {m === 'light' ? '☀️' : m === 'dark' ? '🌙' : '⚙️'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.divider} />
          {/* Language switcher */}
          <View style={styles.menuItem}>
            <Ionicons name="language-outline" size={20} color={colors.primary} />
            <Text style={styles.menuText}>ພາສາ</Text>
            <View style={styles.themeButtons}>
              {(['lo', 'th', 'en'] as AppLanguage[]).map((lang) => (
                <TouchableOpacity
                  key={lang}
                  onPress={() => setLanguage(lang)}
                  style={[styles.langBtn, language === lang && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                >
                  <Text style={[styles.langBtnText, language === lang && { color: '#fff' }]}>
                    {lang === 'lo' ? 'ລາວ' : lang === 'th' ? 'ไทย' : 'EN'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Guest login prompt */}
        <View style={styles.center}>
          <Ionicons name="person-circle-outline" size={80} color={colors.text.muted} />
          <Text style={styles.guestTitle}>ຍັງບໍ່ໄດ້ເຂົ້າສູ່ລະບົບ</Text>
          <Text style={styles.guestSub}>ເຂົ້າສູ່ລະບົບເພື່ອເຂົ້າເຖິງລາຍການທີ່ມັກ ແລະ ປະຫວັດການອ່ານ</Text>
          <Button title="ເຂົ້າສູ່ລະບົບ" onPress={() => router.push('/(auth)/login' as any)} style={styles.loginBtn} />
          <Button title="ສະໝັກສະມາຊິກ" onPress={() => router.push('/(auth)/register' as any)} variant="outline" style={styles.registerBtn} />
        </View>
      </ScrollView>
    </View>
  );
}
```

### แก้ logged-in menuCard — เพิ่ม language item หลัง theme item

ใน menuCard ของ logged-in view เพิ่มหลัง theme menu item:
```tsx
<View style={styles.divider} />
<View style={styles.menuItem}>
  <Ionicons name="language-outline" size={20} color={colors.primary} />
  <Text style={styles.menuText}>ພາສາ</Text>
  <View style={styles.themeButtons}>
    {(['lo', 'th', 'en'] as AppLanguage[]).map((lang) => (
      <TouchableOpacity
        key={lang}
        onPress={() => setLanguage(lang)}
        style={[styles.langBtn, language === lang && { backgroundColor: colors.primary, borderColor: colors.primary }]}
      >
        <Text style={[styles.langBtnText, language === lang && { color: '#fff' }]}>
          {lang === 'lo' ? 'ລາວ' : lang === 'th' ? 'ไทย' : 'EN'}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
</View>
```

### เพิ่ม styles ใน `createStyles`
```ts
langBtn: {
  paddingHorizontal: spacing.sm,
  paddingVertical: 6,
  borderRadius: radius.sm,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.background,
  minWidth: 36,
  alignItems: 'center',
},
langBtnText: {
  fontSize: 12,
  fontWeight: '600',
  color: colors.text.secondary,
},
```

---

## วิธีใช้ใน Cursor

```
@contexts/LanguageContext.tsx @app/_layout.tsx @app/(tabs)/account.tsx

Phase D:
1. สร้าง contexts/LanguageContext.tsx ใหม่ตามโค้ดด้านบน
2. app/_layout.tsx: wrap ด้วย LanguageProvider
3. account.tsx: เพิ่ม language hook + language switcher ทั้งใน guest และ logged-in view,
   theme toggle แสดงใน guest view ด้วย
ห้ามแตะไฟล์อื่น
```

## ตรวจสอบหลังรัน

1. `npx tsc --noEmit` — 0 errors
2. ไม่ login → หน้า ຕັ້ງຄ່າ แสดง theme toggle + language switcher
3. login แล้ว → menu มีทั้ง theme + language
4. กดเปลี่ยนภาษา → ปุ่มที่เลือก highlight สีฟ้า
5. ปิด app แล้วเปิดใหม่ → ภาษาที่เลือกยังคงอยู่ (AsyncStorage)
6. theme toggle ทำงานทั้ง guest และ logged-in
