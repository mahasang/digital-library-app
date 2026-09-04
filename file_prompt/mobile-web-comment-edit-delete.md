# Mobile + Web — Delete/Edit Comment Feature

## ขอบเขต Mobile
- `app/research/[slug].tsx` — เพิ่ม edit/delete บน comment
- ห้ามแตะไฟล์อื่น mobile

## ขอบเขต Web
- `components/research/CommentSection.tsx` — เพิ่ม edit/delete
- `app/[locale]/research/[id]/actions.ts` — เพิ่ม deleteComment/updateComment actions
- ห้ามแตะไฟล์อื่น web

---

## DB — RLS policies ที่มีอยู่แล้ว

`comments` table มี policy:
- `comments_delete_own_or_staff` — ลบได้ถ้าเป็นเจ้าของหรือ staff
- ยังไม่มี update policy — ต้องเพิ่ม

รัน SQL นี้ใน Supabase ก่อน:
```sql
CREATE POLICY "comments_update_own" ON public.comments
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

## Mobile: แก้ `app/research/[slug].tsx`

### เพิ่ม state
```ts
const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
const [editingText, setEditingText] = useState('');
```

### เพิ่ม functions
```ts
async function handleDeleteComment(commentId: string) {
  Alert.alert(
    t('common_delete'),
    'ທ່ານຕ້ອງການລຶບຄຳເຫັນນີ້ບໍ?',
    [
      { text: t('common_cancel'), style: 'cancel' },
      {
        text: t('common_delete'),
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId);
          if (!error && item) await loadComments(item.id);
        },
      },
    ]
  );
}

async function handleEditComment(commentId: string, newContent: string) {
  if (!newContent.trim()) return;
  const { error } = await supabase
    .from('comments')
    .update({ content: newContent.trim() })
    .eq('id', commentId);
  if (!error) {
    setEditingCommentId(null);
    setEditingText('');
    if (item) await loadComments(item.id);
  }
}
```

### แก้ comments.map — เพิ่ม edit/delete buttons

```tsx
comments.map(c => {
  const initials = c.author_name.slice(0, 2).toUpperCase();
  const isOwn = session && c.user_id === (session as any).user?.id;
  const isEditing = editingCommentId === c.id;

  return (
    <View key={c.id} style={styles.commentItem}>
      <View style={styles.commentAvatar}>
        {c.author_avatar_url ? (
          <Image source={{ uri: c.author_avatar_url }} style={styles.avatarImg} contentFit="cover" />
        ) : (
          <Text style={styles.avatarInitials}>{initials}</Text>
        )}
      </View>
      <View style={styles.commentBubble}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentName}>{c.author_name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.commentTime}>{relativeTime(c.created_at)}</Text>
            {isOwn && !isEditing && (
              <>
                <TouchableOpacity onPress={() => {
                  setEditingCommentId(c.id);
                  setEditingText(c.content);
                }}>
                  <Ionicons name="pencil-outline" size={12} color={colors.text.muted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteComment(c.id)}>
                  <Ionicons name="trash-outline" size={12} color={colors.error} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {isEditing ? (
          <View style={{ gap: 6 }}>
            <TextInput
              style={styles.commentBox}
              value={editingText}
              onChangeText={setEditingText}
              multiline
              maxLength={500}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => {
                setEditingCommentId(null);
                setEditingText('');
              }}>
                <Text style={{ fontSize: 12, color: colors.text.muted }}>{t('common_cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleEditComment(c.id, editingText)}>
                <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>{t('account_save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={styles.commentText}>{c.content}</Text>
        )}
      </View>
    </View>
  );
})
```

---

## Web: แก้ `app/[locale]/research/[id]/actions.ts`

เพิ่ม 2 functions:
```ts
export async function deleteCommentAction(commentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'กรุณาเข้าสู่ระบบ' };
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function updateCommentAction(commentId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'กรุณาเข้าสู่ระบบ' };
  if (!content.trim()) return { error: 'กรุณากรอกข้อความ' };
  const { error } = await supabase
    .from('comments')
    .update({ content: content.trim() })
    .eq('id', commentId)
    .eq('user_id', user.id);
  if (error) return { error: error.message };
  return { error: null };
}
```

---

## Web: แก้ `components/research/CommentSection.tsx`

### เพิ่ม imports
```ts
import { deleteCommentAction, updateCommentAction } from "@/app/[locale]/research/[id]/actions";
```

### เพิ่ม state
```ts
const [editingId, setEditingId] = useState<string | null>(null);
const [editingText, setEditingText] = useState('');
const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
```

### เพิ่ม functions
```ts
async function handleDelete(commentId: string) {
  if (!confirm('ທ່ານຕ້ອງການລຶບຄຳເຫັນນີ້ບໍ?')) return;
  setDeleteLoading(commentId);
  await deleteCommentAction(commentId);
  setDeleteLoading(null);
  router.refresh();
}

async function handleUpdate(commentId: string) {
  if (!editingText.trim()) return;
  await updateCommentAction(commentId, editingText);
  setEditingId(null);
  setEditingText('');
  router.refresh();
}
```

### แก้ comment render — เพิ่ม edit/delete buttons

ใน comment list เพิ่ม edit/delete สำหรับ comment ของตัวเอง:
```tsx
{/* ใน comment header เพิ่ม buttons */}
<div className="flex items-center gap-2">
  <span className="text-xs text-gray-400">{timeAgo(c.created_at)}</span>
  {isOwner && (
    <>
      <button
        type="button"
        onClick={() => { setEditingId(c.id); setEditingText(c.content); }}
        className="text-gray-400 hover:text-brand-600 transition-colors"
      >
        <Pencil className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={() => handleDelete(c.id)}
        disabled={deleteLoading === c.id}
        className="text-gray-400 hover:text-red-500 transition-colors"
      >
        {deleteLoading === c.id
          ? <Loader2 className="h-3 w-3 animate-spin" />
          : <Trash2 className="h-3 w-3" />}
      </button>
    </>
  )}
</div>

{/* แก้ content แสดงผล */}
{editingId === c.id ? (
  <div className="mt-2 flex flex-col gap-2">
    <textarea
      value={editingText}
      onChange={e => setEditingText(e.target.value)}
      rows={2}
      className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
      autoFocus
    />
    <div className="flex gap-2 justify-end">
      <button
        type="button"
        onClick={() => { setEditingId(null); setEditingText(''); }}
        className="text-xs text-gray-500 hover:text-gray-700"
      >
        ຍົກເລີກ
      </button>
      <button
        type="button"
        onClick={() => handleUpdate(c.id)}
        className="text-xs font-semibold text-brand-600 hover:text-brand-700"
      >
        ບັນທຶກ
      </button>
    </div>
  </div>
) : (
  <p className="text-sm text-gray-700">{c.content}</p>
)}
```

เพิ่ม import `Pencil` จาก lucide-react และ logic `isOwner`:
```ts
import { Send, Loader2, Trash2, Pencil } from "lucide-react";
// ใน component ต้องรับ currentUserId prop เพิ่ม
// isOwner = currentUserId === c.user_id
```

---

## วิธีใช้ใน Cursor

**Mobile:**
```
@app/research/[slug].tsx

เพิ่ม delete/edit comment feature:
1. เพิ่ม state editingCommentId, editingText
2. เพิ่ม handleDeleteComment, handleEditComment functions
3. แก้ comments.map ให้แสดง edit/delete icons สำหรับ comment ของตัวเอง
4. แสดง TextInput สำหรับแก้ไขเมื่อกด edit
ห้ามแตะอะไรอื่น
```

**Web:**
```
@app/[locale]/research/[id]/actions.ts @components/research/CommentSection.tsx

เพิ่ม delete/edit comment feature:
1. actions.ts: เพิ่ม deleteCommentAction, updateCommentAction
2. CommentSection.tsx: เพิ่ม edit/delete UI สำหรับ comment ของตัวเอง
ห้ามแตะอะไรอื่น
```

## ตรวจสอบหลังรัน

1. `npx tsc --noEmit` — 0 errors
2. Comment ของตัวเอง → เห็นไอคอน ✏️ และ 🗑️
3. กด ✏️ → TextInput เปิดพร้อมข้อความเดิม → แก้ → บันทึก
4. กด 🗑️ → confirm → comment หาย
5. Comment ของคนอื่น → ไม่เห็น icons
