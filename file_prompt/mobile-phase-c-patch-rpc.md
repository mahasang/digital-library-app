# Mobile App — Phase C Patch: ใช้ RPCs แทน raw queries ใน [slug].tsx

## ขอบเขต
- แก้เฉพาะ `app/research/[slug].tsx`
- เปลี่ยน 3 จุดที่ใช้ raw query → ใช้ RPC แทน
- ห้ามแตะอะไรอื่น

---

## จุดที่ต้องเปลี่ยน 3 จุด

### จุดที่ 1: favorites count

**เดิม:**
```ts
// favorites count
supabase
  .from('favorites')
  .select('id', { count: 'exact', head: true })
  .eq('research_id', item.id)
  .then(({ count }) => setFavCount(count ?? 0));
```

**ใหม่:**
```ts
// favorites count — ใช้ RPC เพราะ favorites RLS เปิดให้เห็นแค่แถวของตัวเอง
supabase
  .rpc('get_favorites_count', { p_research_id: item.id })
  .then(({ data }) => setFavCount(data ?? 0));
```

---

### จุดที่ 2: avg rating

**เดิม:**
```ts
// avg rating
supabase
  .from('ratings')
  .select('score')
  .eq('research_id', item.id)
  .then(({ data }) => {
    if (data && data.length > 0) {
      const avg = data.reduce((s, r) => s + r.score, 0) / data.length;
      setAvgRating(avg);
      setRatingCount(data.length);
    }
  });
```

**ใหม่:**
```ts
// avg rating — ใช้ RPC เพราะ ratings RLS เปิดให้เห็นแค่แถวของตัวเอง
supabase
  .rpc('get_rating_stats', { p_research_id: item.id })
  .single()
  .then(({ data }) => {
    if (data) {
      setAvgRating(Number(data.avg_score) ?? 0);
      setRatingCount(data.rating_count ?? 0);
    }
  });
```

---

### จุดที่ 3: loadComments function

**เดิม:**
```ts
async function loadComments(researchId: string) {
  const { data } = await supabase
    .from('comments')
    .select('id, content, created_at, user_id, profiles ( full_name, email, avatar_url )')
    .eq('research_id', researchId)
    .order('created_at', { ascending: false })
    .limit(20);
  setComments((data as unknown as Comment[]) ?? []);
}
```

**ใหม่:**
```ts
async function loadComments(researchId: string) {
  // ใช้ RPC เพราะ profiles RLS บล็อก join ตรงๆ
  // (เห็นได้แค่โปรไฟล์ตัวเอง/staff — คนอื่นจะได้ null ทำให้ชื่อหาย)
  const { data } = await supabase
    .rpc('get_comments', { p_research_id: researchId, p_limit: 20 });

  if (!data) return;

  // map ให้ตรงกับ Comment type ที่ใช้ใน UI
  const mapped: Comment[] = data.map((row: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    author_name: string;
    author_avatar_url: string | null;
  }) => ({
    id: row.id,
    content: row.content,
    created_at: row.created_at,
    user_id: row.user_id,
    profiles: {
      full_name: row.author_name,
      email: null,
      avatar_url: row.author_avatar_url,
    },
  }));

  setComments(mapped);
}
```

---

### จุดที่ 4: reload avg rating ใน handleRate

**เดิม (ใน handleRate หลัง upsert):**
```ts
// reload avg
const { data } = await supabase.from('ratings').select('score').eq('research_id', item.id);
if (data && data.length > 0) {
  setAvgRating(data.reduce((s, r) => s + r.score, 0) / data.length);
  setRatingCount(data.length);
}
```

**ใหม่:**
```ts
// reload avg ผ่าน RPC
const { data: stats } = await supabase
  .rpc('get_rating_stats', { p_research_id: item.id })
  .single();
if (stats) {
  setAvgRating(Number(stats.avg_score) ?? 0);
  setRatingCount(stats.rating_count ?? 0);
}
```

---

## วิธีใช้ใน Cursor

```
@app/research/[slug].tsx

แก้ 4 จุดใน [slug].tsx ตาม patch นี้:
1. favorites count → ใช้ rpc('get_favorites_count')
2. avg rating โหลดครั้งแรก → ใช้ rpc('get_rating_stats')
3. loadComments → ใช้ rpc('get_comments') + map result
4. reload avg ใน handleRate → ใช้ rpc('get_rating_stats')
ห้ามแตะอะไรอื่นในไฟล์
```

## ตรวจสอบหลังรัน

1. `npx tsc --noEmit` — 0 errors
2. เปิดหน้า detail → favCount แสดงยอดรวมจริง (ไม่ใช่ 0 หรือ 1)
3. Rating แสดง avg จากทุกคน (ไม่ใช่แค่คะแนนตัวเอง)
4. Comments แสดงชื่อผู้แสดงความเห็นทุกคน (ไม่ใช่ "ຜູ້ໃຊ້" ทั้งหมด)
