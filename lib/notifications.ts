import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

// ตั้งค่า notification handler — แสดงเมื่อ app เปิดอยู่
// shouldShowBanner/shouldShowList เป็น field บังคับใน expo-notifications เวอร์ชันนี้
// (shouldShowAlert ถูก deprecate แล้ว แต่ใส่ไว้ด้วยเพื่อ backward-compat)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerPushToken(): Promise<string | null> {
  // ต้องเป็น physical device เท่านั้น
  if (!Device.isDevice) return null;

  // ขอ permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  // Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'ການແຈ້ງເຕືອນ',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#185ff2',
    });
  }

  // ดึง Expo Push Token — projectId ต้องเป็น EAS project UUID จริง (app.json > extra.eas.projectId)
  // ไม่ใช่ slug ของแอป มิฉะนั้น getExpoPushTokenAsync() จะ throw
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = await Notifications.getExpoPushTokenAsync({ projectId });

  return token.data;
}

export async function savePushToken(token: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('profiles')
    .update({ push_token: token })
    .eq('id', user.id);
}

export async function clearPushToken(userId?: string): Promise<void> {
  const supabase_client = supabase;
  const uid = userId ?? (await supabase_client.auth.getUser()).data.user?.id;
  if (!uid) return;
  await supabase_client
    .from('profiles')
    .update({ push_token: null })
    .eq('id', uid);
}

export async function getNotificationPreferences() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('notification_preferences')
    .select('new_research_push_enabled, comment_push_enabled, system_push_enabled')
    .eq('user_id', user.id)
    .single();

  // ไม่มีแถว (ผู้ใช้ยังไม่เคยตั้งค่า) = ใช้ค่า default ของคอลัมน์ (เปิดทั้งหมด)
  // ไม่ใช่ null เพื่อให้ toggle section แสดงผลได้ตั้งแต่ครั้งแรก
  return data ?? {
    new_research_push_enabled: true,
    comment_push_enabled: true,
    system_push_enabled: true,
  };
}

export async function updateNotificationPreference(
  key: 'new_research_push_enabled' | 'comment_push_enabled' | 'system_push_enabled',
  value: boolean
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('notification_preferences')
    .upsert({ user_id: user.id, [key]: value }, { onConflict: 'user_id' });
}
