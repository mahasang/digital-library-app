# Mobile App — Phase 4: expo-image Migration + EAS Build

## ขอบเขต
- แก้ 7 ไฟล์: เปลี่ยน `Image` จาก `react-native` → `Image` จาก `expo-image`
- ไม่เปลี่ยน logic อื่น
- ห้ามแตะไฟล์อื่น

---

## ทำไมต้อง expo-image

`expo-image` ดีกว่า `react-native`'s `Image` ตรงนี้:
- **Disk + memory cache** — โหลดรูปซ้ำจาก cache ทันที ไม่ fetch ใหม่
- **Blurhash placeholder** — แสดง placeholder สีขณะโหลด
- **Better performance** — ใช้ SDWebImage (iOS) / Glide (Android) ใต้ hood

---

## การเปลี่ยนแปลงในแต่ละไฟล์

### Pattern การเปลี่ยน (เหมือนกันทุกไฟล์)

**Import — เพิ่ม/แก้:**
```ts
// ลบ Image ออกจาก react-native import
import { View, Text, ... } from 'react-native'; // ไม่มี Image แล้ว

// เพิ่ม import ใหม่
import { Image } from 'expo-image';
```

**JSX — เพิ่ม props:**
```tsx
// เดิม
<Image source={{ uri: item.cover_image }} style={styles.cover} resizeMode="cover" />

// ใหม่ — เพิ่ม contentFit, cachePolicy, placeholder
<Image
  source={{ uri: item.cover_image }}
  style={styles.cover}
  contentFit="cover"
  cachePolicy="memory-disk"
  placeholder={{ color: colors.primaryLight }}
  transition={200}
/>
```

> หมายเหตุ: `expo-image` ใช้ `contentFit` แทน `resizeMode` และ `source` รับ string URI ตรงๆ ได้ด้วย แต่ `{ uri: ... }` ก็ยังใช้ได้

---

## ไฟล์ที่ต้องแก้ทั้ง 7 ไฟล์

### 1. `app/(tabs)/research.tsx`
- ลบ `Image` จาก react-native import
- เพิ่ม `import { Image } from 'expo-image';`
- เปลี่ยน `<Image source={{ uri: item.cover_image }} style={[styles.bookCover, { height: COVER_HEIGHT }]} resizeMode="cover" />`
  → เพิ่ม `contentFit="cover"`, `cachePolicy="memory-disk"`, `placeholder={{ color: colors.primaryLight }}`, `transition={200}`
  → ลบ `resizeMode` prop

### 2. `app/(tabs)/index.tsx`
- ลบ `Image` จาก react-native import (ถ้ามี)
- เพิ่ม `import { Image } from 'expo-image';`
- เปลี่ยน `<Image source={{ uri: item.cover_image }} style={styles.hCover} resizeMode="cover" />`
  → เพิ่ม `contentFit="cover"`, `cachePolicy="memory-disk"`, `placeholder={{ color: colors.primaryLight }}`, `transition={200}`

### 3. `app/search.tsx`
- ลบ `Image` จาก react-native import
- เพิ่ม `import { Image } from 'expo-image';`
- เปลี่ยน `<Image source={{ uri: item.cover_image }} style={[styles.cover, { height: COVER_HEIGHT }]} resizeMode="cover" />`
  → เพิ่ม `contentFit="cover"`, `cachePolicy="memory-disk"`, `placeholder={{ color: colors.primaryLight }}`, `transition={200}`

### 4. `app/(tabs)/favorites.tsx`
- ลบ `Image` จาก react-native import ใน SwipeableCard component
- เพิ่ม `import { Image } from 'expo-image';` ที่หัวไฟล์
- เปลี่ยน `<Image source={{ uri: item.cover_image }} style={styles.cover} />`
  → เพิ่ม `contentFit="cover"`, `cachePolicy="memory-disk"`, `placeholder={{ color: '#EEF3FF' }}`, `transition={200}`
  > หมายเหตุ: ใน SwipeableCard ไม่มี `colors` โดยตรง ใช้ hardcode `'#EEF3FF'` (primaryLight) หรือรับ colors เป็น prop

### 5. `app/history.tsx`
- ลบ `Image` จาก react-native import ใน SwipeableHistoryCard
- เพิ่ม `import { Image } from 'expo-image';` ที่หัวไฟล์
- เปลี่ยน `<Image source={{ uri: item.cover_image }} style={styles.cover} />`
  → เพิ่ม `contentFit="cover"`, `cachePolicy="memory-disk"`, `placeholder={{ color: '#EEF3FF' }}`, `transition={200}`

### 6. `app/research/[slug].tsx`
- ลบ `Image` จาก react-native import
- เพิ่ม `import { Image } from 'expo-image';`
- เปลี่ยน cover hero และ related research images:
  ```tsx
  // cover hero
  <Image
    source={{ uri: item.cover_image }}
    style={styles.cover}
    contentFit="cover"
    cachePolicy="memory-disk"
    transition={300}
  />
  // related cards
  <Image
    source={{ uri: r.cover_image }}
    style={styles.relatedCover}
    contentFit="cover"
    cachePolicy="memory-disk"
    placeholder={{ color: colors.primaryLight }}
    transition={200}
  />
  ```

### 7. `app/(tabs)/account.tsx`
- ลบ `Image` จาก react-native import
- เพิ่ม `import { Image } from 'expo-image';`
- เปลี่ยน avatar image:
  ```tsx
  <Image
    source={{ uri: profile.avatar_url }}
    style={styles.avatarImage}
    contentFit="cover"
    cachePolicy="memory-disk"
    transition={200}
  />
  ```

---

## วิธีใช้ใน Cursor

```
@app/(tabs)/research.tsx @app/(tabs)/index.tsx @app/search.tsx
@app/(tabs)/favorites.tsx @app/history.tsx @app/research/[slug].tsx @app/(tabs)/account.tsx

Phase 4: เปลี่ยน Image จาก react-native → expo-image ในทุกไฟล์
- ลบ Image ออกจาก react-native import
- เพิ่ม import { Image } from 'expo-image'
- เปลี่ยน resizeMode="cover" → contentFit="cover"
- เพิ่ม cachePolicy="memory-disk"
- เพิ่ม placeholder={{ color: colors.primaryLight }} (หรือ '#EEF3FF' ถ้าไม่มี colors)
- เพิ่ม transition={200}
ห้ามแตะ logic อื่น
```

## ตรวจสอบหลังรัน

```bash
npx tsc --noEmit
```
ควรได้ 0 errors

---

## EAS Build — สร้าง APK Android

หลัง tsc clean แล้ว ทำตามขั้นตอนนี้:

### ขั้นตอนที่ 1: ติดตั้ง EAS CLI
```bash
npm install -g eas-cli
```

### ขั้นตอนที่ 2: Login Expo account
```bash
eas login
```

### ขั้นตอนที่ 3: สร้าง eas.json
```bash
eas build:configure
```
หรือสร้างไฟล์ `eas.json` ด้วยตนเอง:
```json
{
  "cli": {
    "version": ">= 16.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### ขั้นตอนที่ 4: Build APK (preview)
```bash
cd /c/Project/digital-library-app
eas build --platform android --profile preview
```
- Build ทำบน EAS cloud ใช้เวลา ~10-15 นาที
- เมื่อเสร็จจะได้ link download `.apk` ไปติดตั้งบน Android ได้เลย

### ขั้นตอนที่ 5: ดาวน์โหลดและติดตั้ง
- เปิด link ที่ได้จาก EAS
- ดาวน์โหลด `.apk` บน Galaxy S24 Ultra
- ติดตั้ง (ต้องเปิด "Unknown sources" ในการตั้งค่า)

---

## หมายเหตุ

- **Preview build** = APK ติดตั้งได้ทันที เหมาะสำหรับ testing
- **Production build** = AAB สำหรับ Google Play Store
- ถ้าไม่มี Expo account สมัครฟรีที่ expo.dev ก่อน
- EAS build ฟรี 30 builds/เดือน สำหรับ free tier
