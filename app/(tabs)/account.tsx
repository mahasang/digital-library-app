import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal, TextInput as RNTextInput, Linking } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { spacing, typography, radius, shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useSession } from '@/hooks/useSession';
import { useLanguage, useT, AppLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { signOut } from '@/lib/auth';
import { getMyProfile, uploadAvatar, UserProfile } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { FadeInView } from '@/components/ui/FadeInView';
import { useMemo, useState, useEffect } from 'react';

// date_of_birth เก็บเป็น 'YYYY-MM-DD' string — แปลงผ่าน getFullYear/getMonth/getDate
// แทน toISOString()/new Date(string) ตรงๆ เพื่อไม่ให้เลื่อนวันจาก UTC conversion
function parseYMD(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function formatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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
  const [editPhone, setEditPhone] = useState('');
  const [editDate, setEditDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editAddress, setEditAddress] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

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
          <TouchableOpacity
            onPress={() => router.push('/notifications' as any)}
            style={styles.notifBtn}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Login/Register Card */}
          <View style={styles.loginCard}>
            <View style={styles.loginCardIcon}>
              <Ionicons name="person-circle-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.loginCardTitle}>{t('account_guest')}</Text>
            <Text style={styles.loginCardSub}>{t('account_guest_sub')}</Text>
            <TouchableOpacity
              style={styles.loginCardBtn}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.loginCardBtnText}>{t('login_btn')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.loginCardBtnOutline}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={styles.loginCardBtnOutlineText}>{t('register_btn')}</Text>
            </TouchableOpacity>
          </View>

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

          {/* ── About section ── */}
          <View style={styles.menuCard}>
            {/* Privacy Policy */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Linking.openURL('https://digital-library-sls.vercel.app/lo/privacy')}
            >
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
              <Text style={styles.menuText}>{t('settings_privacy')}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Terms of Service */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Linking.openURL('https://digital-library-sls.vercel.app/lo/terms')}
            >
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              <Text style={styles.menuText}>{t('settings_terms')}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Rate the app */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Linking.openURL('market://details?id=la.org.digitallibrary.mobile')}
            >
              <Ionicons name="star-outline" size={20} color={colors.primary} />
              <Text style={styles.menuText}>{t('settings_rate')}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Report bug */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Linking.openURL('mailto:info@digitallibrary.la?subject=Bug Report')}
            >
              <Ionicons name="bug-outline" size={20} color={colors.primary} />
              <Text style={styles.menuText}>{t('settings_bug')}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* App version */}
            <View style={styles.menuItem}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.menuText}>{t('settings_version')}</Text>
              <Text style={styles.menuVersion}>1.0.0</Text>
            </View>
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
            if (error) {
              Alert.alert(t('common_error'), error.message);
              return;
            }
            // replace ทั้ง stack กลับไปหน้าแรก ป้องกัน back กลับมา login
            router.replace('/(tabs)' as any);
          },
        },
      ]
    );
  }

  function openEdit() {
    setEditName(profile?.full_name ?? '');
    setEditOrg(profile?.organization_name ?? '');
    setEditPhone(profile?.phone ?? '');
    setEditDate(profile?.date_of_birth ? parseYMD(profile.date_of_birth) : null);
    setEditAddress(profile?.address ?? '');
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
    const dateOfBirth = editDate ? formatYMD(editDate) : null;
    const { error } = await supabase.from('profiles').update({
      full_name: editName.trim(),
      organization_name: editOrg.trim(),
      phone: editPhone.trim() || null,
      date_of_birth: dateOfBirth,
      address: editAddress.trim() || null,
    }).eq('id', user.id);
    setEditLoading(false);
    if (error) {
      Alert.alert(t('common_error'), t('common_save_error'));
      return;
    }
    setProfile(p => p ? {
      ...p,
      full_name: editName.trim(),
      organization_name: editOrg.trim(),
      phone: editPhone.trim() || null,
      date_of_birth: dateOfBirth,
      address: editAddress.trim() || null,
    } : p);
    setEditVisible(false);
  }

  async function pickAndUploadAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('common_error'), t('account_avatar_permission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';

    setAvatarLoading(true);
    const { url, error } = await uploadAvatar(asset.uri, mimeType);
    setAvatarLoading(false);

    if (error || !url) {
      Alert.alert(t('common_error'), t('account_avatar_error'));
      return;
    }
    setProfile(p => p ? { ...p, avatar_url: url } : p);
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
        <TouchableOpacity
          onPress={() => router.push('/notifications' as any)}
          style={styles.notifBtn}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <FadeInView style={styles.fadeGroup}>
        <View style={styles.profileCard}>
          <TouchableOpacity
            onPress={pickAndUploadAvatar}
            disabled={avatarLoading}
            style={styles.avatarWrap}
          >
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
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={12} color="#fff" />
            </View>
          </TouchableOpacity>
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

        {/* ── About section ── */}
        <View style={styles.menuCard}>
          {/* Privacy Policy */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Linking.openURL('https://digital-library-sls.vercel.app/lo/privacy')}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
            <Text style={styles.menuText}>{t('settings_privacy')}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Terms of Service */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Linking.openURL('https://digital-library-sls.vercel.app/lo/terms')}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            <Text style={styles.menuText}>{t('settings_terms')}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Rate the app */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Linking.openURL('market://details?id=la.org.digitallibrary.mobile')}
          >
            <Ionicons name="star-outline" size={20} color={colors.primary} />
            <Text style={styles.menuText}>{t('settings_rate')}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Report bug */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Linking.openURL('mailto:info@digitallibrary.la?subject=Bug Report')}
          >
            <Ionicons name="bug-outline" size={20} color={colors.primary} />
            <Text style={styles.menuText}>{t('settings_bug')}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* App version */}
          <View style={styles.menuItem}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.menuText}>{t('settings_version')}</Text>
            <Text style={styles.menuVersion}>1.0.0</Text>
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
            <Text style={styles.modalLabel}>{t('field_phone')}</Text>
            <RNTextInput
              style={styles.modalInput}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder={t('field_phone_placeholder')}
              placeholderTextColor={colors.text.muted}
              keyboardType="phone-pad"
            />
            <Text style={styles.modalLabel}>{t('field_dob')}</Text>
            <TouchableOpacity
              style={styles.datePickerBtn}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.datePickerText, !editDate && { color: colors.text.muted }]}>
                {editDate ? editDate.toLocaleDateString('lo-LA') : t('field_dob_placeholder')}
              </Text>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={editDate ?? new Date(2000, 0, 1)}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) setEditDate(date);
                }}
              />
            )}
            <Text style={styles.modalLabel}>{t('field_address')}</Text>
            <RNTextInput
              style={[styles.modalInput, styles.modalTextArea]}
              value={editAddress}
              onChangeText={setEditAddress}
              placeholder={t('field_address')}
              placeholderTextColor={colors.text.muted}
              multiline
              numberOfLines={3}
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: { ...typography.h3, color: colors.text.primary },
    notifBtn: {
      width: 44, height: 44,
      borderRadius: radius.md,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
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
    avatarWrap: {
      position: 'relative',
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
    avatarEditBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.surface,
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
    menuVersion: {
      ...typography.caption,
      color: colors.text.muted,
      marginLeft: 'auto' as any,
    },
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
    loginCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
    },
    loginCardIcon: {
      width: 80, height: 80,
      borderRadius: 40,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    loginCardTitle: { ...typography.h3, color: colors.text.primary },
    loginCardSub: { ...typography.bodySmall, color: colors.text.secondary, textAlign: 'center' },
    loginCardBtn: {
      width: '100%',
      height: 48,
      borderRadius: radius.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.xs,
    },
    loginCardBtnText: { ...typography.label, color: '#fff' },
    loginCardBtnOutline: {
      width: '100%',
      height: 48,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loginCardBtnOutlineText: { ...typography.label, color: colors.primary },
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
    modalTextArea: {
      height: 80,
      paddingTop: spacing.sm,
      textAlignVertical: 'top',
    },
    datePickerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      height: 52,
      backgroundColor: colors.background,
    },
    datePickerText: {
      ...typography.body,
      color: colors.text.primary,
    },
  });
}
