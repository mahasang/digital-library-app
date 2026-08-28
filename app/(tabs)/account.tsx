import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal, TextInput as RNTextInput } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, radius, shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useSession } from '@/hooks/useSession';
import { useLanguage, useT, AppLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { signOut } from '@/lib/auth';
import { getMyProfile, UserProfile } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
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
  const { language, setLanguage } = useLanguage();
  const t = useT();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const session = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editOrg, setEditOrg] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const [pwVisible, setPwVisible] = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (session) getMyProfile().then(setProfile);
  }, [session]);

  if (session === undefined) return null;

  if (!session) {
    return (
      <View style={styles.container}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('tab_settings')}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Settings card สำหรับ guest */}
          <View style={styles.menuCard}>
            {/* Theme toggle */}
            <View style={styles.menuItem}>
              <Ionicons name="moon-outline" size={20} color={colors.primary} />
              <Text style={styles.menuText}>{t('account_theme')}</Text>
              <View style={styles.themeButtons}>
                {(['light', 'system', 'dark'] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setTheme(m)}
                    style={[styles.themeBtn, mode === m && { backgroundColor: colors.primary }]}
                  >
                    <Text style={[styles.themeBtnText, mode === m && { color: '#fff' }]}>
                      {m === 'light' ? '☀️' : m === 'dark' ? '🌙' : '⚙️'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.divider} />
            {/* Language switcher */}
            <View style={styles.menuItem}>
              <Ionicons name="language-outline" size={20} color={colors.primary} />
              <Text style={styles.menuText}>{t('account_language')}</Text>
              <View style={styles.themeButtons}>
                {(['lo', 'th', 'en', 'vi'] as AppLanguage[]).map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    onPress={() => setLanguage(lang)}
                    style={[styles.langBtn, language === lang && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  >
                    <Text style={[styles.langBtnText, language === lang && { color: '#fff' }]}>
                      {lang === 'lo' ? 'ລາວ' : lang === 'th' ? 'ไทย' : lang === 'en' ? 'EN' : 'VI'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Guest login prompt */}
          <View style={styles.center}>
            <Ionicons name="person-circle-outline" size={80} color={colors.text.muted} />
            <Text style={styles.guestTitle}>{t('account_guest')}</Text>
            <Text style={styles.guestSub}>{t('account_guest_sub')}</Text>
            <Button
              title={t('login_btn')}
              onPress={() => router.push('/(auth)/login')}
              style={styles.loginBtn}
            />
            <Button
              title={t('register_btn')}
              onPress={() => router.push('/(auth)/register')}
              variant="outline"
              style={styles.registerBtn}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  async function handleLogout() {
    Alert.alert(
      t('account_logout'),
      t('account_logout_q'),
      [
        { text: t('common_cancel'), style: 'cancel' },
        {
          text: t('account_logout'),
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const { error } = await signOut();
            setLoading(false);
            if (error) Alert.alert(t('common_error'), error.message);
          },
        },
      ]
    );
  }

  function openEdit() {
    setEditName(profile?.full_name ?? '');
    setEditOrg(profile?.organization_name ?? '');
    setEditVisible(true);
  }

  async function saveProfile() {
    setEditLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setEditLoading(false);
      Alert.alert(t('common_error'), t('common_no_user'));
      return;
    }
    const { error } = await supabase.from('profiles').update({
      full_name: editName.trim(),
      organization_name: editOrg.trim(),
    }).eq('id', user.id);
    setEditLoading(false);
    if (error) {
      Alert.alert(t('common_error'), t('common_save_error'));
      return;
    }
    setProfile(p => p ? { ...p, full_name: editName.trim(), organization_name: editOrg.trim() } : p);
    setEditVisible(false);
  }

  async function changePassword() {
    if (!pwCurrent) {
      Alert.alert(t('common_error'), t('common_pw_req'));
      return;
    }
    if (!pwNew || pwNew.length < 8) {
      Alert.alert(t('common_error'), t('val_pw_short'));
      return;
    }
    if (pwNew !== pwConfirm) {
      Alert.alert(t('common_error'), t('val_pw_mismatch'));
      return;
    }
    setPwLoading(true);

    // ຢືນຢັນຕົວຕົນດ້ວຍລະຫັດຜ່ານປັດຈຸບັນກ່ອນ — supabase.auth.updateUser() ບໍ່ໄດ້ກວດສອບໃຫ້ເອງ
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      setPwLoading(false);
      Alert.alert(t('common_error'), t('common_auth_error'));
      return;
    }
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: pwCurrent,
    });
    if (reauthError) {
      setPwLoading(false);
      Alert.alert(t('common_error'), t('common_pw_wrong'));
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: pwNew });
    setPwLoading(false);
    if (error) {
      Alert.alert(t('common_error'), t('common_pw_error'));
      return;
    }
    Alert.alert(t('common_success'), t('common_pw_changed'));
    setPwVisible(false);
    setPwCurrent(''); setPwNew(''); setPwConfirm('');
  }

  const initials = profile?.full_name
    ? profile.full_name.slice(0, 2).toUpperCase()
    : profile?.email?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('account_title')}</Text>
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
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.fullName}>
              {profile?.full_name ?? t('account_no_name')}
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
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={openEdit}
          >
            <Ionicons name="pencil-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
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
            <Text style={styles.menuText}>{t('tab_favorites')}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/history' as any)}
          >
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={styles.menuText}>{t('account_history')}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setPwVisible(true)}
          >
            <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
            <Text style={styles.menuText}>{t('account_change_pw')}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <View style={styles.menuItem}>
            <Ionicons name="moon-outline" size={20} color={colors.primary} />
            <Text style={styles.menuText}>{t('account_theme')}</Text>
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
          <View style={styles.divider} />
          <View style={styles.menuItem}>
            <Ionicons name="language-outline" size={20} color={colors.primary} />
            <Text style={styles.menuText}>{t('account_language')}</Text>
            <View style={styles.themeButtons}>
              {(['lo', 'th', 'en', 'vi'] as AppLanguage[]).map((lang) => (
                <TouchableOpacity
                  key={lang}
                  onPress={() => setLanguage(lang)}
                  style={[styles.langBtn, language === lang && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                >
                  <Text style={[styles.langBtnText, language === lang && { color: '#fff' }]}>
                    {lang === 'lo' ? 'ລາວ' : lang === 'th' ? 'ไทย' : lang === 'en' ? 'EN' : 'VI'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Button
          title={t('account_logout')}
          onPress={handleLogout}
          loading={loading}
          variant="outline"
          style={styles.logoutBtn}
        />
        </FadeInView>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('account_edit')}</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>{t('field_fullname')}</Text>
            <RNTextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder={t('field_fullname')}
              placeholderTextColor={colors.text.muted}
            />
            <Text style={styles.modalLabel}>{t('field_org')}</Text>
            <RNTextInput
              style={styles.modalInput}
              value={editOrg}
              onChangeText={setEditOrg}
              placeholder={t('field_org')}
              placeholderTextColor={colors.text.muted}
            />
            <Button title={t('account_save')} onPress={saveProfile} loading={editLoading} style={{ marginTop: spacing.md }} />
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={pwVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('account_change_pw')}</Text>
              <TouchableOpacity onPress={() => setPwVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>{t('pw_current')}</Text>
            <RNTextInput
              style={styles.modalInput}
              value={pwCurrent}
              onChangeText={setPwCurrent}
              placeholder={t('pw_current')}
              placeholderTextColor={colors.text.muted}
              secureTextEntry
            />
            <Text style={styles.modalLabel}>{t('pw_new')}</Text>
            <RNTextInput
              style={styles.modalInput}
              value={pwNew}
              onChangeText={setPwNew}
              placeholder={t('pw_min8')}
              placeholderTextColor={colors.text.muted}
              secureTextEntry
            />
            <Text style={styles.modalLabel}>{t('pw_confirm')}</Text>
            <RNTextInput
              style={styles.modalInput}
              value={pwConfirm}
              onChangeText={setPwConfirm}
              placeholder={t('pw_confirm_label')}
              placeholderTextColor={colors.text.muted}
              secureTextEntry
            />
            <Button title={t('account_change_pw')} onPress={changePassword} loading={pwLoading} style={{ marginTop: spacing.md }} />
          </View>
        </View>
      </Modal>
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
    langBtn: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      minWidth: 36,
      alignItems: 'center',
    },
    langBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text.secondary,
    },
    logoutBtn: { borderColor: colors.error },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
    guestTitle: { ...typography.h3, color: colors.text.primary },
    guestSub: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },
    loginBtn: { width: '100%', marginTop: spacing.sm },
    registerBtn: { width: '100%' },
    editProfileBtn: {
      position: 'absolute',
      top: spacing.md,
      right: spacing.md,
      padding: spacing.xs,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.lg,
      gap: spacing.xs,
      paddingBottom: spacing.xxl,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    modalTitle: { ...typography.h3, color: colors.text.primary },
    modalLabel: { ...typography.label, color: colors.text.primary, marginTop: spacing.sm },
    modalInput: {
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      height: 52,
      ...typography.body,
      color: colors.text.primary,
      backgroundColor: colors.background,
    },
  });
}
