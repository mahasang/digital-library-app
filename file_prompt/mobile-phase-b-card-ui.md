# Mobile App — Phase B: Card UI (stars + views + relative time)

## ขอบเขต
- `app/(tabs)/research.tsx` — แก้ card info ใน hCard และ grid card
- `app/search.tsx` — แก้ card info ใน renderBook
- `app/(tabs)/index.tsx` — แก้ card info ใน renderHCard
- ห้ามแตะไฟล์อื่น

---

## สิ่งที่เปลี่ยนใน card ทุก card

### ลบออก
- `{item.year}` / `toAD(item.year)` — ไม่แสดงปีแล้ว
- styles `hYear`, `bookYear`, `cardYear` — ลบ style เหล่านี้ออก
- function `toAD` — ลบออก (ไม่ใช้แล้ว)

### เพิ่มเข้า
1. **5 ดาว** — แสดง avg rating จาก `ratings` table (ดึงแบบ lazy ไม่ได้ดึงพร้อม list เพราะ ResearchItem ไม่มี field นี้)
   → ใช้ static ★★★★☆ แบบ visual โดยดึง avg rating จาก supabase ratings table แบบ batch ในอนาคต
   → **Phase B นี้**: แสดง placeholder ★★★★★ สีเทา (ยังไม่มีข้อมูล) ไว้ก่อน จะ wire จริงใน Phase C
   → ขนาด 10px สีทอง/เทา

2. **จำนวน views** — แสดง `👁 {item.views}` หรือ icon eye + จำนวน ขนาด 10px

3. **Relative time** — แทน `published_at` ด้วยเวลาสัมพัทธ์:
   ```ts
   function relativeTime(dateStr: string | null): string {
     if (!dateStr) return '';
     const diff = Date.now() - new Date(dateStr).getTime();
     const days = Math.floor(diff / 86400000);
     if (days === 0) return 'ມື້ນີ້';
     if (days < 30) return `${days} ວັນ`;
     const months = Math.floor(days / 30);
     if (months < 12) return `${months} ເດືອນ`;
     return `${Math.floor(months / 12)} ປີ`;
   }
   ```

---

## Layout ใต้ปก (cardInfo) ที่ต้องการ

```
[ชื่อหนังสือ 2 บรรทัด]
[★★★★☆]  [👁 142]
[3 ວັນ]
```

ขนาด card เล็ก (H_CARD_WIDTH=110) — ใช้ font 10-11px, padding xs

---

## การแก้แต่ละไฟล์

### `app/(tabs)/index.tsx`

**ลบ:**
- `function toAD`
- `<Text style={styles.hYear}>{toAD(item.year)}</Text>`
- style `hYear`

**เพิ่ม function ก่อน component:**
```ts
function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'ມື້ນີ້';
  if (days < 30) return `${days} ວັນ`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ເດືອນ`;
  return `${Math.floor(months / 12)} ປີ`;
}

function StarRow({ score = 0 }: { score?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1, marginTop: 2 }}>
      {[1,2,3,4,5].map(i => (
        <Text key={i} style={{ fontSize: 9, color: i <= Math.round(score) ? '#f59e0b' : '#d1d5db' }}>★</Text>
      ))}
    </View>
  );
}
```

**แก้ hInfo ใน renderHCard:**
```tsx
<View style={styles.hInfo}>
  <Text style={styles.hTitle} numberOfLines={2}>{item.title_th}</Text>
  <StarRow score={0} />
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
    <Ionicons name="eye-outline" size={9} color={colors.text.muted} />
    <Text style={styles.hMeta}>{item.views}</Text>
    {item.published_at ? (
      <Text style={[styles.hMeta, { marginLeft: 2 }]}>{relativeTime(item.published_at)}</Text>
    ) : null}
  </View>
</View>
```

**เพิ่ม style:**
```ts
hMeta: { fontSize: 9, color: colors.text.muted },
```

---

### `app/(tabs)/research.tsx`

**ลบ:**
- `function toAD`
- `{item.year ? <Text style={styles.hYear}>{toAD(item.year)}</Text> : null}` (ทั้ง hCard และ grid)
- `{item.year ? <Text style={styles.bookYear}>{toAD(item.year)}</Text> : null}`
- styles `hYear`, `bookYear`

**เพิ่ม function ก่อน FEATURED_CATEGORIES:**
```ts
function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'ມື້ນີ້';
  if (days < 30) return `${days} ວັນ`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ເດືອນ`;
  return `${Math.floor(months / 12)} ປີ`;
}

function StarRow({ score = 0, colors }: { score?: number; colors: any }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1, marginTop: 2 }}>
      {[1,2,3,4,5].map(i => (
        <Text key={i} style={{ fontSize: 9, color: i <= Math.round(score) ? '#f59e0b' : colors.border }}>★</Text>
      ))}
    </View>
  );
}
```

**แก้ hInfo ใน renderHCard:**
```tsx
<View style={styles.hInfo}>
  <Text style={styles.hTitle} numberOfLines={2}>{item.title_th}</Text>
  <StarRow score={0} colors={colors} />
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
    <Ionicons name="eye-outline" size={9} color={colors.text.muted} />
    <Text style={styles.hMeta}>{item.views}</Text>
    {item.published_at ? (
      <Text style={[styles.hMeta, { marginLeft: 2 }]}>{relativeTime(item.published_at)}</Text>
    ) : null}
  </View>
</View>
```

**แก้ cardInfo ใน grid (map ด้านล่าง):**
```tsx
<View style={styles.cardInfo}>
  <Text style={styles.bookTitle} numberOfLines={2}>{item.title_th}</Text>
  <StarRow score={0} colors={colors} />
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
    <Ionicons name="eye-outline" size={9} color={colors.text.muted} />
    <Text style={styles.hMeta}>{item.views}</Text>
  </View>
</View>
```

**เพิ่ม style:**
```ts
hMeta: { fontSize: 9, color: colors.text.muted },
```

---

### `app/search.tsx`

**ลบ:**
- `function toAD`
- `{item.year ? (<Text style={styles.cardYear}>{toAD(item.year)}</Text>) : null}`
- style `cardYear`

**เพิ่ม function ก่อน component:**
```ts
function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'ມື້ນີ້';
  if (days < 30) return `${days} ວັນ`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ເດືອນ`;
  return `${Math.floor(months / 12)} ປີ`;
}

function StarRow({ score = 0, colors }: { score?: number; colors: any }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1, marginTop: 2 }}>
      {[1,2,3,4,5].map(i => (
        <Text key={i} style={{ fontSize: 9, color: i <= Math.round(score) ? '#f59e0b' : colors.border }}>★</Text>
      ))}
    </View>
  );
}
```

**แก้ cardInfo ใน renderBook:**
```tsx
<View style={styles.cardInfo}>
  <Text style={styles.cardTitle} numberOfLines={2}>{item.title_th}</Text>
  <StarRow score={0} colors={colors} />
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
    <Ionicons name="eye-outline" size={9} color={colors.text.muted} />
    <Text style={styles.cardMeta}>{item.views}</Text>
    {item.published_at ? (
      <Text style={[styles.cardMeta, { marginLeft: 2 }]}>{relativeTime(item.published_at)}</Text>
    ) : null}
  </View>
</View>
```

**เพิ่ม style:**
```ts
cardMeta: { fontSize: 9, color: colors.text.muted },
```

---

## หมายเหตุ

- `StarRow` แสดง placeholder score=0 (ดาวทั้งหมดสีเทา) เพราะยังไม่มีข้อมูล ratings จริง
- Phase C จะ wire ratings จริงจาก DB ตอนเปิดหน้า detail
- `relativeTime` ใช้ `published_at` จาก ResearchItem (มีอยู่แล้วใน type)
- ถ้า `published_at` เป็น null (seed data เก่า) จะไม่แสดง relative time

---

## วิธีใช้ใน Cursor

```
@app/(tabs)/index.tsx @app/(tabs)/research.tsx @app/search.tsx

Phase B: ปรับ card info ทุก card
- ลบปีออกทั้งหมด (toAD, hYear, bookYear, cardYear)
- เพิ่ม StarRow component (placeholder score=0)
- เพิ่ม views count พร้อม eye icon
- เพิ่ม relativeTime จาก published_at
ห้ามแตะ logic อื่น
```

## ตรวจสอบหลังรัน

1. `npx tsc --noEmit` — 0 errors
2. card ทุกอัน: ชื่อ → ★★★★★ (เทาทั้งหมด) → 👁 142 · 5 ວັນ
3. ไม่มีปีแสดงที่ไหนเลย
4. seed data ที่ published_at เป็น null → ไม่แสดง relative time (ไม่ crash)
