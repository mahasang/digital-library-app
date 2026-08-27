import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert, TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { spacing, typography, radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export default function RegisterScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string; password?: string; confirmPassword?: string;
  }>({});

  function validate() {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'ກະລຸນາປ້ອນອີເມວ';
    else if (!email.includes('@')) e.email = 'ຮູບແບບອີເມວບໍ່ຖືກຕ້ອງ';
    if (!password) e.password = 'ກະລຸນາປ້ອນລະຫັດຜ່ານ';
    else if (password.length < 8) e.password = 'ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 8 ຕົວອັກສອນ';
    if (password && confirmPassword !== password) e.confirmPassword = 'ລະຫັດຜ່ານບໍ່ຕົງກັນ';
    return e;
  }

  async function handleRegister() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setLoading(true);
    setErrors({});
    const { error } = await supabase.auth.signUp({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      Alert.alert('ສະໝັກສະມາຊິກບໍ່ສຳເລັດ', 'ອີເມວນີ້ອາດຖືກໃຊ້ແລ້ວ ຫຼື ເກີດຂໍ້ຜິດພາດ');
      return;
    }
    Alert.alert(
      'ສະໝັກສະມາຊິກສຳເລັດ',
      'ກະລຸນາກວດສອບອີເມວຂອງທ່ານເພື່ອຢືນຢັນບັນຊີ',
      [{ text: 'ຕົກລົງ', onPress: () => router.replace('/(auth)/login') }]
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Back button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoArea}>
          <View style={styles.logoIcon}>
            <Ionicons name="library" size={36} color={colors.primary} />
          </View>
          <Text style={styles.appName}>Digital Library Plus</Text>
          <Text style={styles.appNameLao}>ຫ້ອງສະໝຸດດິຈິຕອນ</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>ສະໝັກສະມາຊິກ</Text>
          <Text style={styles.subtitle}>ສະໝັກສະມາຊິກເພື່ອເຂົ້າເຖິງງານວິໄຈ ແລະ ຟີເຈີເພີ່ມເຕີມ</Text>

          <Input
            label="ອີເມວ"
            placeholder="your@email.com"
            value={email}
            onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email: undefined })); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
          />

          <Input
            label="ລະຫັດຜ່ານ"
            placeholder="••••••••"
            value={password}
            onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }}
            secureToggle
            error={errors.password}
          />

          <Input
            label="ຢືນຢັນລະຫັດຜ່ານ"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={t => { setConfirmPassword(t); setErrors(e => ({ ...e, confirmPassword: undefined })); }}
            secureToggle
            error={errors.confirmPassword}
          />

          <Button
            title="ສະໝັກສະມາຊິກ"
            onPress={handleRegister}
            loading={loading}
            style={styles.mainBtn}
          />

          <Button
            title="ມີບັນຊີຢູ່ແລ້ວ? ເຂົ້າສູ່ລະບົບ"
            onPress={() => router.push('/(auth)/login' as any)}
            variant="ghost"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    backBtn: {
      position: 'absolute',
      top: spacing.xxl,
      left: spacing.md,
      zIndex: 10,
      padding: spacing.xs,
    },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl + spacing.lg,
      paddingBottom: spacing.xl,
    },
    logoArea: { alignItems: 'center', marginBottom: spacing.xxl },
    logoIcon: {
      width: 80, height: 80,
      borderRadius: radius.xl,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    appName: { ...typography.h3, color: colors.primary },
    appNameLao: { ...typography.bodySmall, color: colors.text.secondary, marginTop: 2 },
    form: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: { ...typography.h2, color: colors.text.primary, marginBottom: spacing.xs },
    subtitle: { ...typography.body, color: colors.text.secondary, marginBottom: spacing.lg },
    mainBtn: { marginTop: spacing.sm, marginBottom: spacing.sm },
  });
}
