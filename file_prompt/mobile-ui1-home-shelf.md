# Mobile App — Phase UI-1: Home + Shelf UI improvements

## ขอบเขต
- `app/(tabs)/index.tsx` — ปรับ hero, stats, section title, card shadow
- `app/(tabs)/research.tsx` — ปรับ placeholder, ซ่อนดาวถ้าไม่มี rating, section spacing
- ห้ามแตะไฟล์อื่น

---

## `app/(tabs)/index.tsx` — 5 จุด

### จุดที่ 1: Section title — เพิ่ม accent left border
แก้ style `sectionTitle`:
```ts
sectionTitle: {
  ...typography.h3,
  color: colors.text.primary,
  paddingLeft: spacing.sm,
  borderLeftWidth: 3,
  borderLeftColor: colors.primary,
},
```

### จุดที่ 2: Stats cards — เพิ่ม tint background + icon circle
แก้ JSX ใน stats section:
```tsx
{[
  { label: t('stat_research'), value: stats.research.toString(), icon: 'document-text-outline' },
  { label: t('stat_category'), value: stats.categories.toString(), icon: 'folder-outline' },
  { label: t('stat_org'), value: stats.organizations.toString(), icon: 'business-outline' },
].map((stat) => (
  <Card key={stat.label} style={styles.statCard}>
    <View style={styles.statIconCircle}>
      <Ionicons name={stat.icon as any} size={18} color={colors.primary} />
    </View>
    <Text style={styles.statValue}>{stat.value}</Text>
    <Text style={styles.statLabel}>{stat.label}</Text>
  </Card>
))}
```

แก้ styles:
```ts
statCard: {
  flex: 1,
  alignItems: 'center',
  gap: 4,
  padding: spacing.sm,
  backgroundColor: colors.primaryLight,
  borderRadius: radius.lg,
  borderWidth: 0,
},
statIconCircle: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: colors.surface,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 2,
},
statValue: { ...typography.h3, color: colors.primary },
statLabel: { fontSize: 10, color: colors.text.secondary, textAlign: 'center' },
```

### จุดที่ 3: Card horizontal — เพิ่ม shadow md + radius lg
แก้ style `hCard`:
```ts
hCard: {
  width: H_CARD_WIDTH,
  backgroundColor: colors.surface,
  borderRadius: radius.lg,
  overflow: 'hidden',
  borderWidth: 0,
  ...shadows.md,
},
```

แก้ style `hCover`:
```ts
hCover: {
  width: H_CARD_WIDTH,
  height: H_COVER_HEIGHT,
  backgroundColor: colors.primaryLight,
},
```

### จุดที่ 4: ซ่อนดาวและ views ถ้าไม่มีข้อมูล
แก้ใน renderHCard — ซ่อน RatingBadge ถ้า count = 0 (มีอยู่แล้ว) และซ่อน views ถ้า views = 0:
```tsx
<View style={styles.hInfo}>
  <Text style={styles.hTitle} numberOfLines={2}>{item.title_th}</Text>
  {rating && rating.count > 0 && (
    <RatingBadge score={rating.avg} count={rating.count} />
  )}
  {item.views > 0 && (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
      <Ionicons name="eye-outline" size={9} color={colors.text.muted} />
      <Text style={styles.hMeta}>{item.views}</Text>
      {item.published_at ? (
        <Text style={[styles.hMeta, { marginLeft: 2 }]}>{relativeTime(item.published_at)}</Text>
      ) : null}
    </View>
  )}
</View>
```

### จุดที่ 5: Hero — ปรับ subtitle สีสว่างขึ้น + ลด heroIcon opacity
```ts
heroSubtitle: { ...typography.caption, color: 'rgba(255,255,255,0.95)' },
heroIcon: { position: 'absolute', right: -8, top: -8, opacity: 0.12 },
```

---

## `app/(tabs)/research.tsx` — 3 จุด

### จุดที่ 1: Placeholder card — เพิ่ม gradient-like background
แทนที่ placeholder ใน hCard (horizontal) และ grid card:

**hPlaceholder:**
```ts
hPlaceholder: {
  backgroundColor: colors.primaryLight,
  alignItems: 'center',
  justifyContent: 'center',
},
```
ใน JSX เพิ่ม Text ย่อชื่อใต้ icon:
```tsx
<View style={[styles.hCover, styles.hPlaceholder]}>
  <Ionicons name="document-text" size={28} color={colors.primary} />
</View>
```
(ไม่เปลี่ยน JSX ถ้าเหมือนเดิมแล้ว — ตรวจสอบก่อน)

**bookPlaceholder:**
```ts
bookPlaceholder: {
  backgroundColor: colors.primaryLight,
  alignItems: 'center',
  justifyContent: 'center',
},
```

### จุดที่ 2: ซ่อนดาวถ้า count = 0
ใน `StarRow` component หรือทุกที่ที่ render ดาว ให้ตรวจสอบก่อน:
```tsx
{rating && rating.count > 0 ? (
  <Text style={{ fontSize: 10, color: '#f59e0b', fontWeight: '600', marginTop: 2 }}>
    {rating.avg.toFixed(1)} ★
  </Text>
) : null}
```
ถ้าไม่มี rating state ใน research.tsx (card ไม่ได้โหลด rating) → ซ่อน StarRow ทั้งหมด
แก้ทุก card ที่มี `<StarRow score={0} colors={colors} />` → ลบออก หรือเพิ่มเงื่อนไขว่าถ้า score=0 ไม่แสดง

### จุดที่ 3: Card shadow + radius
แก้ style `hCard` และ `bookCard`:
```ts
hCard: {
  width: H_CARD_WIDTH,
  backgroundColor: colors.surface,
  borderRadius: radius.lg,
  overflow: 'hidden',
  borderWidth: 0,
  ...shadows.md,
},
bookCard: {
  backgroundColor: colors.surface,
  borderRadius: radius.lg,
  overflow: 'hidden',
  borderWidth: 0,
  ...shadows.md,
},
```

แก้ section spacing — เพิ่ม marginTop:
```ts
section: {
  marginTop: spacing.lg,
},
```

---

## วิธีใช้ใน Cursor

```
@app/(tabs)/index.tsx @app/(tabs)/research.tsx

Phase UI-1: ปรับ UI ตาม spec ด้านบน
- index.tsx: section title accent border, stats tint+icon circle,
  card shadow md, ซ่อน views/stars ถ้าไม่มีข้อมูล, hero opacity
- research.tsx: card shadow md, ซ่อน stars ถ้า score=0, section spacing
ห้ามแตะไฟล์อื่น
```

## ตรวจสอบหลังรัน

1. `npx tsc --noEmit` — 0 errors
2. Stats cards — มี tint สีฟ้าอ่อน + icon วงกลม
3. Section title — มีเส้นสีฟ้าซ้าย
4. Card — มี shadow และ rounded corner ใหญ่ขึ้น
5. Card ที่ไม่มี rating — ไม่แสดงดาวว่าง
6. Shelf — section ห่างขึ้น
