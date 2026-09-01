import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export async function signOut() {
  return supabase.auth.signOut();
}

function getParam(fragment: string, key: string): string | null {
  const pairs = fragment.split('&');
  for (const pair of pairs) {
    const [k, v] = pair.split('=');
    if (k === key) return decodeURIComponent(v ?? '');
  }
  return null;
}

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  try {
    const redirectUri = 'digitallibraryapp://auth/callback';

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

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

    if (result.type !== 'success') {
      return { error: null };
    }

    const url = (result as any).url as string;

    // แยก hash fragment ออกมา
    const hashIndex = url.indexOf('#');
    const fragment = hashIndex >= 0 ? url.slice(hashIndex + 1) : '';

    const accessToken = getParam(fragment, 'access_token');
    const refreshToken = getParam(fragment, 'refresh_token') ?? '';

    if (!accessToken) {
      return { error: 'No access_token in URL' };
    }

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError) return { error: sessionError.message };
    return { error: null };

  } catch (e: any) {
    return { error: e?.message ?? 'Unknown error' };
  }
}
