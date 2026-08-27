# Mobile App — Fix: Category Param + Expo Router Href Types

## ขอบเขต
- `app/search.tsx` — อ่าน `category` query param จาก URL
- `app/(tabs)/research.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/favorites.tsx`, `app/research/[slug].tsx`, `app/research/[slug]/pdf.tsx` — fix typed-routes Href warning

---

## Fix 1: wire category param ใน `search.tsx`

### ปัญหา
`router.push('/search?category=it')` จาก research.tsx ไม่มีผล เพราะ search.tsx ไม่ได้อ่าน query param

### วิธีแก้
เพิ่ม `useLocalSearchParams` แล้ว initialize `selectedCategory` จาก param

เพิ่ม import:
```ts
import { useLocalSearchParams } from 'expo-router';
```

เพิ่มใต้ `const { colors } = useTheme();`:
```ts
const { category: categoryParam } = useLocalSearchParams<{ category?: string }>();
```

เปลี่ยน state initialization:
```ts
// เดิม
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

// ใหม่
const [selectedCategory, setSelectedCategory] = useState<string | null>(
  categoryParam ?? null
);
```

เปลี่ยน useEffect โหลดครั้งแรก:
```ts
// เดิม
useEffect(() => {
  load('', null, 1);
}, [load]);

// ใหม่ — โหลดด้วย category จาก param ถ้ามี
useEffect(() => {
  load('', categoryParam ?? null, 1);
}, [load, categoryParam]);
```

---

## Fix 2: Expo Router typed-routes Href warning

### ปัญหา
`router.push(\`/research/${item.slug}\`)` ไม่ตรงกับ Expo Router generated `Href` type
เกิดใน 5 ไฟล์: `index.tsx`, `research.tsx`, `favorites.tsx`, `search.tsx`, `[slug].tsx`

### วิธีแก้
Cast เป็น `any` เฉพาะจุด dynamic route — วิธีนี้ minimal และไม่ต้อง regenerate cache:

```ts
// เดิม
router.push(`/research/${item.slug}`)

// ใหม่
router.push(`/research/${item.slug}` as any)
```

ทำแบบนี้ทุกจุดใน 5 ไฟล์ที่มี dynamic route push:
- `app/(tabs)/index.tsx` — `router.push(\`/research/${item.slug}\`)`
- `app/(tabs)/research.tsx` — `router.push(\`/research/${item.slug}\`)`
- `app/search.tsx` — `router.push(\`/research/${item.slug}\`)`
- `app/(tabs)/favorites.tsx` — ดูว่ามี router.push dynamic route ไหน ถ้ามีให้ cast as any
- `app/research/[slug].tsx` — ดูว่ามี router.push dynamic route ไหน ถ้ามีให้ cast as any

---

## วิธีใช้ใน Cursor

```
@app/search.tsx @app/(tabs)/index.tsx @app/(tabs)/research.tsx @app/(tabs)/favorites.tsx @app/research/[slug].tsx

Fix 2 เรื่อง:
1. search.tsx: อ่าน useLocalSearchParams category param แล้ว initialize selectedCategory และ load ด้วย param นั้น
2. ทุกไฟล์: cast dynamic router.push เป็น `as any` เพื่อ fix Expo Router Href type warning

ห้ามแตะ logic อื่น
```

## ตรวจสอบหลังรัน

1. กด `ເບິ່ງທັງໝົດ` ใต้ section IT ใน research.tsx
   → เปิด search screen → tab IT active → แสดงผลกรอง IT
2. `npx tsc --noEmit` — ไม่มี Href warning อีก
