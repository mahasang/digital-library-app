import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, radius, shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useSession } from '@/hooks/useSession';
import { useT } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  read_at: string | null;
  created_at: string;
  research_id: string | null;
  // route ของหน้า detail รับ slug ไม่ใช่ id — ต้อง embed research_items เพื่อได้ slug มาด้วย
  research_items: { slug: string } | null;
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return 'ມື້ນີ້';
  if (days < 30) return `${days} ວັນ`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ເດືອນ`;
  return `${Math.floor(months / 12)} ປີ`;
}

// ต้องตรงกับ check constraint ของ notifications.type ในฐานข้อมูลจริง — 'info' | 'success' | 'warning'
const TYPE_ICONS: Record<string, string> = {
  info: 'information-circle-outline',
  success: 'checkmark-circle-outline',
  warning: 'warning-outline',
  default: 'notifications-outline',
};

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme();
  const t = useT();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const session = useSession();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    loadNotifications();
  }, [session]);

  async function loadNotifications() {
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('id, title, message, type, read_at, created_at, research_id, research_items ( slug )')
      .order('created_at', { ascending: false })
      .limit(50);
    setItems((data as unknown as Notification[]) ?? []);
    setLoading(false);
  }

  async function markAllRead() {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null);
    setItems(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
  }

  async function markRead(id: string) {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .is('read_at', null);
    setItems(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
  }

  const unreadCount = items.filter(n => !n.read_at).length;

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.card, !item.read_at && styles.cardUnread]}
      onPress={() => {
        markRead(item.id);
        if (item.research_items?.slug) {
          const tab = item.type === 'info' ? '?tab=comments' : '';
          router.push(`/research/${item.research_items.slug}${tab}` as any);
        }
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, !item.read_at && { backgroundColor: colors.primaryLight }]}>
        <Ionicons
          name={(TYPE_ICONS[item.type] ?? TYPE_ICONS.default) as any}
          size={20}
          color={colors.primary}
        />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, !item.read_at && { color: colors.primary }]}>
          {item.title}
        </Text>
        {item.message ? (
          <Text style={styles.cardMessage} numberOfLines={2}>{item.message}</Text>
        ) : null}
        <Text style={styles.cardTime}>{relativeTime(item.created_at)}</Text>
      </View>
      {!item.read_at && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('notif_title')}{unreadCount > 0 ? ` (${unreadCount})` : ''}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAll}>{t('notif_mark_all')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {!session ? (
        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={48} color={colors.text.muted} />
          <Text style={styles.emptyText}>{t('notif_login')}</Text>
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-outline" size={48} color={colors.text.muted} />
          <Text style={styles.emptyText}>{t('notif_empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xxl, paddingBottom: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1, borderBottomColor: colors.border,
      gap: spacing.md,
    },
    backBtn: { padding: spacing.xs },
    headerTitle: { ...typography.h3, color: colors.text.primary, flex: 1 },
    markAll: { ...typography.caption, color: colors.primary },
    list: { padding: spacing.md, gap: spacing.sm },
    card: {
      flexDirection: 'row', alignItems: 'flex-start',
      gap: spacing.md, padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
      ...shadows.sm,
    },
    cardUnread: {
      borderColor: colors.primary + '40',
      backgroundColor: colors.primaryLight + '30',
    },
    iconBox: {
      width: 40, height: 40, borderRadius: radius.md,
      backgroundColor: colors.background,
      alignItems: 'center', justifyContent: 'center',
    },
    cardContent: { flex: 1 },
    cardTitle: { ...typography.label, color: colors.text.primary, marginBottom: 2 },
    cardMessage: { ...typography.bodySmall, color: colors.text.secondary, lineHeight: 18 },
    cardTime: { ...typography.caption, color: colors.text.muted, marginTop: 4 },
    unreadDot: {
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: colors.primary, marginTop: 6,
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
    emptyText: { ...typography.body, color: colors.text.muted, textAlign: 'center' },
  });
}
