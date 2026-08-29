import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export async function signOut() {
  return supabase.auth.signOut();
}

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  try {
    // redirect URI ที่ Supabase จะส่งกลับมา
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'digitallibraryapp',
      path: 'auth/callback',
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data?.url) {
      return { error: error?.message ?? 'OAuth URL not found' };
    }

    // เปิด browser
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

    if (result.type !== 'success') {
      return { error: null }; // user ปิด browser เอง ไม่ใช่ error
    }

    // ดึง tokens จาก URL
    const url = new URL(result.url);
    const accessToken = url.searchParams.get('access_token')
      ?? new URLSearchParams(url.hash.slice(1)).get('access_token');
    const refreshToken = url.searchParams.get('refresh_token')
      ?? new URLSearchParams(url.hash.slice(1)).get('refresh_token');

    if (!accessToken) {
      return { error: 'No access token received' };
    }

    // set session ใน Supabase
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken ?? '',
    });

    if (sessionError) return { error: sessionError.message };

    return { error: null };
  } catch (e: any) {
    return { error: e?.message ?? 'Unknown error' };
  }
}
