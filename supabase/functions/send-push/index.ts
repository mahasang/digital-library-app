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
