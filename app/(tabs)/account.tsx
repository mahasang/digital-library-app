import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Image, Modal, TextInput as RNTextInput } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, radius, shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useSession } from '@/hooks/useSession';
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
      Alert.alert('ຜິດພາດ', 'ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້');
      return;
    }
    const { error } = await supabase.from('profiles').update({
      full_name: editName.trim(),
      organization_name: editOrg.trim(),
    }).eq('id', user.id);
    setEditLoading(false);
    if (error) {
      Alert.alert('ຜິດພາດ', 'ບໍ່ສາມາດບັນທຶກໂປຣໄຟລໄດ້');
      return;
    }
    setProfile(p => p ? { ...p, full_name: editName.trim(), organization_name: editOrg.trim() } : p);
    setEditVisible(false);
  }

  async function changePassword() {
    if (!pwCurrent) {
      Alert.alert('ຜິດພາດ', 'ກະລຸນາປ້ອນລະຫັດຜ່ານປັດຈຸບັນ');
      return;
    }
    if (!pwNew || pwNew.length < 8) {
      Alert.alert('ຜິດພາດ', 'ລະຫັດຜ່ານໃໝ່ຕ້ອງມີຢ່າງໜ້ອຍ 8 ຕົວອັກສອນ');
      return;
    }
    if (pwNew !== pwConfirm) {
      Alert.alert('ຜິດພາດ', 'ລະຫັດຜ່ານໃໝ່ບໍ່ຕົງກັນ');
      return;
    }
    setPwLoading(true);

    // ຢືນຢັນຕົວຕົນດ້ວຍລະຫັດຜ່ານປັດຈຸບັນກ່ອນ — supabase.auth.updateUser() ບໍ່ໄດ້ກວດສອບໃຫ້ເອງ
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      setPwLoading(false);
      Alert.alert('ຜິດພາດ', 'ບໍ່ສາມາດຢືນຢັນຕົວຕົນໄດ້');
      return;
    }
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: pwCurrent,
    });
    if (reauthError) {
      setPwLoading(false);
      Alert.alert('ຜິດພາດ', 'ລະຫັດຜ່ານປັດຈຸບັນບໍ່ຖືກຕ້ອງ');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: pwNew });
    setPwLoading(false);
    if (error) {
      Alert.alert('ຜິດພາດ', 'ບໍ່ສາມາດປ່ຽນລະຫັດຜ່ານໄດ້');
      return;
    }
    Alert.alert('ສຳເລັດ', 'ປ່ຽນລະຫັດຜ່ານສຳເລັດ');
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
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setPwVisible(true)}
          >
            <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
            <Text style={styles.menuText}>ປ່ຽນລະຫັດຜ່ານ</Text>
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

      {/* Edit Profile Modal */}
      <Modal visible={editVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ແກ້ໄຂໂປຣໄຟລ</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>ຊື່ເຕັມ</Text>
            <RNTextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="ຊື່ເຕັມ"
              placeholderTextColor={colors.text.muted}
            />
            <Text style={styles.modalLabel}>ໜ່ວຍງານ</Text>
            <RNTextInput
              style={styles.modalInput}
              value={editOrg}
              onChangeText={setEditOrg}
              placeholder="ໜ່ວຍງານ"
              placeholderTextColor={colors.text.muted}
            />
            <Button title="ບັນທຶກ" onPress={saveProfile} loading={editLoading} style={{ marginTop: spacing.md }} />
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={pwVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ປ່ຽນລະຫັດຜ່ານ</Text>
              <TouchableOpacity onPress={() => setPwVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>ລະຫັດຜ່ານປັດຈຸບັນ</Text>
            <RNTextInput
              style={styles.modalInput}
              value={pwCurrent}
              onChangeText={setPwCurrent}
              placeholder="ລະຫັດຜ່ານປັດຈຸບັນ"
              placeholderTextColor={colors.text.muted}
              secureTextEntry
            />
            <Text style={styles.modalLabel}>ລະຫັດຜ່ານໃໝ່</Text>
            <RNTextInput
              style={styles.modalInput}
              value={pwNew}
              onChangeText={setPwNew}
              placeholder="ຢ່າງໜ້ອຍ 8 ຕົວອັກສອນ"
              placeholderTextColor={colors.text.muted}
              secureTextEntry
            />
            <Text style={styles.modalLabel}>ຢືນຢັນລະຫັດຜ່ານໃໝ່</Text>
            <RNTextInput
              style={styles.modalInput}
              value={pwConfirm}
              onChangeText={setPwConfirm}
              placeholder="ຢືນຢັນລະຫັດຜ່ານ"
              placeholderTextColor={colors.text.muted}
              secureTextEntry
            />
            <Button title="ປ່ຽນລະຫັດຜ່ານ" onPress={changePassword} loading={pwLoading} style={{ marginTop: spacing.md }} />
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
