# Supabase Edge Function — Send Push Notifications

## ขอบเขต
สร้างใน `/c/Project/digital-library-app/supabase/functions/` (ถ้าไม่มีโฟลเดอร์ให้สร้าง)
- `supabase/functions/send-push/index.ts` — Edge Function หลัก
- `supabase/functions/send-push/deno.json` — config
- ห้ามแตะไฟล์อื่น

---

## Architecture

```
Mobile App → Supabase DB trigger → Edge Function → Expo Push API → มือถือ
```

Edge Function รับ payload แล้วส่งผ่าน Expo Push API:
```
POST https://exp.host/--/api/v2/push/send
```

---

## `supabase/functions/send-push/index.ts`

```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushPayload {
  type: 'new_research' | 'new_comment' | 'system';
  title: string;
  body: string;
  data?: Record<string, string>;
  // ส่งให้ user คนเดียว
  user_id?: string;
  // หรือส่งให้ทุกคน
  broadcast?: boolean;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: 'default';
  badge?: number;
  channelId?: string;
}

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const payload: PushPayload = await req.json();
    const { type, title, body, data, user_id, broadcast } = payload;

    // ดึง push tokens
    let tokens: string[] = [];

    if (broadcast) {
      // ส่งให้ทุกคนที่เปิด system_push_enabled
      const { data: profiles } = await supabase
        .from('profiles')
        .select('push_token, id')
        .not('push_token', 'is', null);

      if (profiles) {
        // filter เฉพาะคนที่เปิด system push
        const { data: prefs } = await supabase
          .from('notification_preferences')
          .select('user_id')
          .eq('system_push_enabled', true);

        const enabledUserIds = new Set(prefs?.map(p => p.user_id) ?? []);

        tokens = profiles
          .filter(p => p.push_token && (prefs === null || enabledUserIds.has(p.id)))
          .map(p => p.push_token as string);
      }
    } else if (user_id) {
      // ส่งให้ user คนเดียว
      const prefKey = type === 'new_research'
        ? 'new_research_push_enabled'
        : type === 'new_comment'
        ? 'comment_push_enabled'
        : 'system_push_enabled';

      // ตรวจสอบ preference
      const { data: pref } = await supabase
        .from('notification_preferences')
        .select(prefKey)
        .eq('user_id', user_id)
        .single();

      // ถ้าไม่มี row หรือเปิดอยู่ → ส่ง
      const isEnabled = !pref || pref[prefKey] !== false;

      if (isEnabled) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('push_token')
          .eq('id', user_id)
          .single();

        if (profile?.push_token) {
          tokens = [profile.push_token];
        }
      }
    }

    if (tokens.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No tokens' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // สร้าง messages
    const messages: ExpoPushMessage[] = tokens
      .filter(token => token.startsWith('ExponentPushToken['))
      .map(token => ({
        to: token,
        title,
        body,
        data: data ?? {},
        sound: 'default',
        channelId: 'default',
      }));

    if (messages.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No valid Expo tokens' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ส่งไปยัง Expo Push API (batch สูงสุด 100 ต่อครั้ง)
    const chunks: ExpoPushMessage[][] = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100));
    }

    let totalSent = 0;
    for (const chunk of chunks) {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });

      if (response.ok) {
        totalSent += chunk.length;
      }
    }

    // บันทึกใน notifications table
    if (user_id && totalSent > 0) {
      await supabase.from('notifications').insert({
        user_id,
        title,
        message: body,
        type: type === 'new_comment' ? 'info' : type === 'new_research' ? 'success' : 'info',
        research_id: data?.research_id ?? null,
      });
    }

    return new Response(
      JSON.stringify({ sent: totalSent, tokens: tokens.length }),
      { headers: { 'Content-Type': 'application/json' } },
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
```

---

## `supabase/functions/send-push/deno.json`

```json
{
  "imports": {
    "https://deno.land/std@0.168.0/": "https://deno.land/std@0.168.0/"
  }
}
```

---

## วิธี Deploy Edge Function

```bash
cd /c/Project/digital-library-app

# ติดตั้ง Supabase CLI ถ้ายังไม่มี
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref wpiaynjqnmqimcuhexaq

# Deploy
supabase functions deploy send-push --no-verify-jwt
```

---

## วิธีทดสอบ Edge Function

หลัง deploy แล้ว ทดสอบด้วย curl:

```bash
# ส่งให้ user คนเดียว (แทนที่ USER_ID และ ANON_KEY)
curl -X POST \
  'https://wpiaynjqnmqimcuhexaq.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "system",
    "title": "ທົດສອບ",
    "body": "ນີ້ແມ່ນການທົດສອບການແຈ້ງເຕືອນ",
    "user_id": "YOUR_USER_ID"
  }'

# Broadcast ทุกคน
curl -X POST \
  'https://wpiaynjqnmqimcuhexaq.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "system",
    "title": "ປະກາດ",
    "body": "ມີການອັບເດດລະບົບ",
    "broadcast": true
  }'
```

---

## DB Trigger สำหรับ Comment Notification (ทำหลัง deploy)

รัน SQL นี้ใน Supabase SQL Editor หลัง deploy Edge Function:

```sql
-- Function สำหรับเรียก Edge Function เมื่อมี comment ใหม่
CREATE OR REPLACE FUNCTION notify_research_author_on_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_research_author_id uuid;
  v_research_slug text;
  v_commenter_name text;
BEGIN
  -- ดึงข้อมูล research
  SELECT submitted_by, slug INTO v_research_author_id, v_research_slug
  FROM research_items WHERE id = NEW.research_id;

  -- ไม่แจ้งถ้า comment ตัวเอง
  IF v_research_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- ดึงชื่อผู้ comment
  SELECT COALESCE(full_name, email, 'ຜູ້ໃຊ້')
  INTO v_commenter_name
  FROM profiles WHERE id = NEW.user_id;

  -- เรียก Edge Function (async ผ่าน pg_net ถ้ามี หรือ skip)
  PERFORM net.http_post(
    url := 'https://wpiaynjqnmqimcuhexaq.supabase.co/functions/v1/send-push',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer ' || current_setting('app.service_role_key', true) || '"}'::jsonb,
    body := json_build_object(
      'type', 'new_comment',
      'title', 'ຄຳເຫັນໃໝ່',
      'body', v_commenter_name || ' ໄດ້ comment ໃນງານວິໄຈຂອງທ່ານ',
      'user_id', v_research_author_id,
      'data', json_build_object('research_slug', v_research_slug)
    )::text
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_comment_inserted
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_research_author_on_comment();
```

---

## หมายเหตุ

- `--no-verify-jwt` ใช้สำหรับ internal calls (DB trigger) — ถ้าต้องการ security เพิ่มให้ใช้ service role key แทน anon key
- Expo Push API ฟรีสำหรับ development ไม่มี quota limit
- Production ควรใช้ `pg_net` extension สำหรับ async HTTP calls จาก trigger
