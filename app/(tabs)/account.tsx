import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, radius, shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/Button';
import { signOut } from '@/lib/auth';
import { getMyProfile, UserProfile } from '@/lib/profile';
import { FadeInView } from '@/components/ui/FadeInView';
import { useMemo, useState, useEffect } from 'react';

const ROLE_LABELS: Record<string, string> = {
  guest: 'ຜູ້ຢ້ຽມຊົມ',
  member: 'ສະມາຊິກ',
  staff: 'ບຸກຄະລາກອນ',
  librarian: 'ບັນນາຮັກ',
  admin: 'ຜູ້ດູແລລະບົບ',
  super_admin: 'ຜູ້ດູແລລະບົບສູງສຸດ',
};

export default function AccountScreen() {
  const { colors, isDark, mode, setTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const session = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) getMyProfile().then(setProfile);
  }, [session]);

  if (session === undefined) return null;

  if (!session) {
    return (
      <View style={styles.container}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ຕັ້ງຄ່າ</Text>
        </View>
        <View style={styles.center}>
          <Ionicons name="person-circle-outline" size={80} color={colors.text.muted} />
          <Text style={styles.guestTitle}>ຍັງບໍ່ໄດ້ເຂົ້າສູ່ລະບົບ</Text>
          <Text style={styles.guestSub}>ເຂົ້າສູ່ລະບົບເພື່ອເຂົ້າເຖິງລາຍການທີ່ມັກ ແລະ ປະຫວັດການອ່ານ</Text>
          <Button
            title="ເຂົ້າສູ່ລະບົບ"
            onPress={() => router.push('/(auth)/login')}
            style={styles.loginBtn}
          />
          <Button
            title="ສະໝັກສະມາຊິກ"
            onPress={() => router.push('/(auth)/register')}
            variant="outline"
            style={styles.registerBtn}
          />
        </View>
      </View>
    );
  }

  async function handleLogout() {
    Alert.alert(
      'ອອກຈາກລະບົບ',
      'ທ່ານຕ້ອງການອອກຈາກລະບົບບໍ?',
      [
        { text: 'ຍົກເລີກ', style: 'cancel' },
        {
          text: 'ອອກຈາກລະບົບ',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const { error } = await signOut();
            setLoading(false);
            if (error) Alert.alert('ຜິດພາດ', error.message);
          },
        },
      ]
    );
  }

  const initials = profile?.full_name
    ? profile.full_name.slice(0, 2).toUpperCase()
    : profile?.email?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>ບັນຊີຂອງຂ້ອຍ</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <FadeInView style={styles.fadeGroup}>
        <View style={styles.profileCard}>
          {profile?.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.fullName}>
              {profile?.full_name ?? 'ບໍ່ລະບຸຊື່'}
            </Text>
            <Text style={styles.email}>{profile?.email ?? '—'}</Text>
            {profile?.role && (
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  {ROLE_LABELS[profile.role] ?? profile.role}
                </Text>
              </View>
            )}
          </View>
        </View>

        {profile?.organization_name && (
          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={18} color={colors.primary} />
            <Text style={styles.infoText}>{profile.organization_name}</Text>
          </View>
        )}

        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/favorites' as any)}
          >
            <Ionicons name="heart-outline" size={20} color={colors.primary} />
            <Text style={styles.menuText}>ລາຍການທີ່ມັກ</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/history' as any)}
          >
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={styles.menuText}>ປະຫວັດການອ່ານ</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <View style={styles.menuItem}>
            <Ionicons name="moon-outline" size={20} color={colors.primary} />
            <Text style={styles.menuText}>ຮູບແບບສີ</Text>
            <View style={styles.themeButtons}>
              {(['light', 'system', 'dark'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setTheme(m)}
                  style={[
                    styles.themeBtn,
                    mode === m && { backgroundColor: colors.primary }
                  ]}
                >
                  <Text style={[
                    styles.themeBtnText,
                    mode === m && { color: '#fff' }
                  ]}>
                    {m === 'light' ? '☀️' : m === 'dark' ? '🌙' : '⚙️'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Button
          title="ອອກຈາກລະບົບ"
          onPress={handleLogout}
          loading={loading}
          variant="outline"
          style={styles.logoutBtn}
        />
        </FadeInView>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: { ...typography.h3, color: colors.text.primary },
    scroll: { padding: spacing.lg, gap: spacing.md },
    fadeGroup: { gap: spacing.md },
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
    },
    avatar: {
      width: 64, height: 64,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarImage: {
      width: 64,
      height: 64,
      borderRadius: radius.full,
    },
    avatarText: { ...typography.h2, color: '#fff' },
    profileInfo: { flex: 1, gap: 4 },
    fullName: { ...typography.h3, color: colors.text.primary },
    email: { ...typography.bodySmall, color: colors.text.secondary },
    roleBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primaryLight,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      marginTop: 4,
    },
    roleText: { ...typography.caption, color: colors.primary },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoText: { ...typography.body, color: colors.text.secondary, flex: 1 },
    menuCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      ...shadows.sm,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
    },
    menuText: { ...typography.body, color: colors.text.primary, flex: 1 },
    divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
    themeButtons: { flexDirection: 'row', gap: 6 },
    themeBtn: {
      width: 36, height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    themeBtnText: { fontSize: 16 },
    logoutBtn: { borderColor: colors.error },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
    guestTitle: { ...typography.h3, color: colors.text.primary },
    guestSub: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },
    loginBtn: { width: '100%', marginTop: spacing.sm },
    registerBtn: { width: '100%' },
  });
}
