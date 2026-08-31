import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '@/lib/supabase';
import { signInWithGoogle } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { spacing, typography, radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/contexts/LanguageContext';

export default function RegisterScreen() {
  const { colors, isDark } = useTheme();
  const t = useT();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string; password?: string; confirmPassword?: string;
  }>({});

  function validate() {
    const e: typeof errors = {};
    if (!email.trim()) e.email = t('val_email_required');
    else if (!email.includes('@')) e.email = t('val_email_invalid');
    if (!password) e.password = t('val_pw_required');
    else if (password.length < 8) e.password = t('val_pw_short');
    if (password && confirmPassword !== password) e.confirmPassword = t('val_pw_mismatch');
    return e;
  }

  async function handleRegister() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setLoading(true);
    setErrors({});

    // redirect URI เดียวกับที่ signInWithGoogle() ใช้ (ดู lib/auth.ts) — ทำให้
    // ลิงก์ยืนยันอีเมลจาก Supabase เปิด App ผ่าน deep link แทนที่จะเปิด Web URL
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'digitallibraryapp',
      path: 'auth/callback',
    });

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectUri,
        data: { phone: phone.trim() || null },
      },
    });
    setLoading(false);
    if (error) {
      Alert.alert(t('register_fail'), 'ອີເມວນີ້ອາດຖືກໃຊ້ແລ້ວ ຫຼື ເກີດຂໍ້ຜິດພາດ');
      return;
    }

    // ถ้า Supabase ส่ง session กลับมาทันที = ปิดการยืนยันอีเมลไว้ (ไม่ใช่ค่า
    // เริ่มต้นของ project นี้ แต่กันไว้เผื่อเปลี่ยนการตั้งค่าในอนาคต)
    if (data.session) {
      router.replace('/(tabs)');
      return;
    }

    Alert.alert(
      t('register_success'),
      t('register_verify'),
      [{ text: t('common_ok'), onPress: () => router.replace('/(auth)/login') }]
    );
  }

  async function handleGoogleRegister() {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    setGoogleLoading(false);
    if (error) {
      Alert.alert(t('common_error'), error);
    }
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
          <Text style={styles.title}>{t('register_title')}</Text>
          <Text style={styles.subtitle}>{t('register_subtitle')}</Text>

          <Input
            label={t('field_email')}
            placeholder="your@email.com"
            value={email}
            onChangeText={val => { setEmail(val); setErrors(e => ({ ...e, email: undefined })); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
          />

          <Input
            label={t('field_phone')}
            placeholder={t('field_phone_placeholder')}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Input
            label={t('field_password')}
            placeholder="••••••••"
            value={password}
            onChangeText={val => { setPassword(val); setErrors(e => ({ ...e, password: undefined })); }}
            secureToggle
            error={errors.password}
          />

          <Input
            label={t('field_confirm_pw')}
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={val => { setConfirmPassword(val); setErrors(e => ({ ...e, confirmPassword: undefined })); }}
            secureToggle
            error={errors.confirmPassword}
          />

          <Button
            title={t('register_btn')}
            onPress={handleRegister}
            loading={loading}
            style={styles.mainBtn}
          />

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('login_or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleRegister}
            disabled={googleLoading}
            activeOpacity={0.8}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color={colors.text.primary} />
            ) : (
              <>
                <Image
                  source={{ uri: 'https://www.google.com/favicon.ico' }}
                  style={styles.googleIcon}
                  contentFit="contain"
                />
                <Text style={styles.googleBtnText}>{t('register_google')}</Text>
              </>
            )}
          </TouchableOpacity>

          <Button
            title={t('register_has_account')}
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
    divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.sm },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { ...typography.caption, color: colors.text.muted },
    googleBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: spacing.sm, height: 48, borderRadius: radius.md,
      borderWidth: 1.5, borderColor: colors.border,
      backgroundColor: colors.surface, marginBottom: spacing.sm,
    },
    googleIcon: { width: 20, height: 20 },
    googleBtnText: { ...typography.label, color: colors.text.primary },
  });
}
