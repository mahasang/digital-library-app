# Mobile App — Phase UI-2: Detail Page UI Improvements

## ขอบเขต
- `app/research/[slug].tsx` — ปรับ rating, stats, section titles, comment bubble
- ห้ามแตะไฟล์อื่น

---

## จุดที่ต้องแก้ 5 จุด

### จุดที่ 1: StarRating interactive — ขนาดใหญ่ขึ้น กดง่ายขึ้น
หา StarRating ที่ user กดได้ (ไม่ใช่ readonly) แก้ size prop:
```tsx
<StarRating
  score={myRating}
  onRate={handleRate}
  size={32}
  colors={colors}
/>
```
และเพิ่ม gap ระหว่างดาว — แก้ใน StarRating component:
```tsx
function StarRating({ score, onRate, size = 20, readonly = false, colors }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>  // เพิ่ม gap จาก 4 → 8
      {[1,2,3,4,5].map(i => (
        <TouchableOpacity
          key={i}
          onPress={() => !readonly && onRate?.(i)}
          disabled={readonly}
          activeOpacity={readonly ? 1 : 0.7}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}  // เพิ่ม hitSlop
        >
          <Text style={{ fontSize: size, color: i <= Math.round(score) ? '#f59e0b' : colors.border }}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

### จุดที่ 2: Stats row — icon ใหญ่ขึ้น + font weight
แก้ style `stat` และ `statText`:
```ts
stat: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  flex: 1,
  justifyContent: 'center',
},
statText: {
  fontSize: 13,
  fontWeight: '600',
  color: colors.text.primary,
},
```
แก้ icon size ใน stats row จาก 15 → 16:
```tsx
<Ionicons name="eye-outline" size={16} color={colors.primary} />
<Ionicons name="download-outline" size={16} color={colors.primary} />
<Ionicons name="heart-outline" size={16} color={colors.error} />
<Ionicons name="calendar-outline" size={16} color={colors.primary} />
```

### จุดที่ 3: Section titles — accent left border
แก้ style `sectionTitle`:
```ts
sectionTitle: {
  ...typography.label,
  color: colors.text.primary,
  fontSize: 15,
  paddingLeft: spacing.sm,
  borderLeftWidth: 3,
  borderLeftColor: colors.primary,
  borderRadius: 0,
},
```

### จุดที่ 4: Comment bubble — chat-like style
แก้ comment item JSX:
```tsx
{comments.map(c => {
  const name = c.profiles?.full_name ?? c.profiles?.email ?? 'ຜູ້ໃຊ້';
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <View key={c.id} style={styles.commentItem}>
      {/* Avatar */}
      <View style={styles.commentAvatar}>
        {c.profiles?.avatar_url ? (
          <Image source={{ uri: c.profiles.avatar_url }} style={styles.avatarImg} contentFit="cover" />
        ) : (
          <Text style={styles.avatarInitials}>{initials}</Text>
        )}
      </View>
      {/* Bubble */}
      <View style={styles.commentBubble}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentName}>{name}</Text>
          <Text style={styles.commentTime}>{relativeTime(c.created_at)}</Text>
        </View>
        <Text style={styles.commentText}>{c.content}</Text>
      </View>
    </View>
  );
})}
```

แก้ styles comment:
```ts
commentItem: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: spacing.sm,
  marginTop: spacing.sm,
},
commentAvatar: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: colors.primaryLight,
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  borderWidth: 1.5,
  borderColor: colors.primary + '30',
  flexShrink: 0,
},
avatarImg: { width: 36, height: 36 },
avatarInitials: {
  fontSize: 12,
  fontWeight: '700',
  color: colors.primary,
},
commentBubble: {
  flex: 1,
  backgroundColor: colors.primaryLight,
  borderRadius: radius.lg,
  borderTopLeftRadius: 4,
  padding: spacing.sm,
  gap: 4,
},
commentHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},
commentName: {
  fontSize: 12,
  fontWeight: '700',
  color: colors.primary,
},
commentTime: {
  ...typography.caption,
  color: colors.text.muted,
  fontSize: 10,
},
commentText: {
  ...typography.bodySmall,
  color: colors.text.primary,
  lineHeight: 20,
},
```

### จุดที่ 5: Rating section layout
แก้ style `ratingSection`:
```ts
ratingSection: {
  flexDirection: 'row',
  backgroundColor: colors.primaryLight,
  borderRadius: radius.lg,
  padding: spacing.md,
  gap: spacing.lg,
  alignItems: 'center',
  borderWidth: 0,
},
ratingLeft: {
  alignItems: 'center',
  gap: 4,
  paddingRight: spacing.md,
  borderRightWidth: 1,
  borderRightColor: colors.border,
},
ratingScore: {
  ...typography.h2,
  color: colors.primary,
  fontWeight: '700',
},
ratingCount: {
  ...typography.caption,
  color: colors.text.secondary,
},
ratingRight: {
  flex: 1,
  gap: 8,
  alignItems: 'flex-start',
},
ratingLabel: {
  ...typography.label,
  color: colors.text.secondary,
  fontSize: 12,
},
```

---

## วิธีใช้ใน Cursor

```
@app/research/[slug].tsx

Phase UI-2: ปรับ UI detail page ตาม spec ด้านบน
1. StarRating: gap=8, size=32 สำหรับ interactive, hitSlop เพิ่ม
2. Stats row: icon size 16, statText font weight 600, gap 6
3. Section titles: left accent border 3px สีฟ้า
4. Comment: bubble style สีฟ้าอ่อน, border-top-left-radius=4 (chat style)
5. Rating section: tint background, divider ระหว่าง avg และ interactive stars
ห้ามแตะไฟล์อื่น
```

## ตรวจสอบหลังรัน

1. `npx tsc --noEmit` — 0 errors
2. Rating interactive — ดาวขนาด 32px กดง่าย มี hitSlop
3. Stats row — ตัวเลข bold ชัดเจน
4. Section titles — มีเส้นสีฟ้าซ้าย
5. Comment — bubble สีฟ้าอ่อน corner ซ้ายบนแหลม (chat style)
6. Rating section — background tint + divider แนวตั้ง
