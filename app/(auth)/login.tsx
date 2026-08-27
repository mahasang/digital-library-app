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

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'ກະລຸນາປ້ອນອີເມວ';
    else if (!email.includes('@')) e.email = 'ຮູບແບບອີເມວບໍ່ຖືກຕ້ອງ';
    if (!password) e.password = 'ກະລຸນາປ້ອນລະຫັດຜ່ານ';
    return e;
  }

  async function handleLogin() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setLoading(true);
    setErrors({});
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      Alert.alert('ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ', 'ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ');
      return;
    }
    router.replace('/(tabs)');
  }

  function handleForgotPassword() {
    Alert.alert(
      'ລືມລະຫັດຜ່ານ',
      'ກະລຸນາຕິດຕໍ່ຜູ້ດູແລລະບົບ ຫຼື ສົ່ງອີເມວມາທີ່ info@digitallibrary.la',
      [{ text: 'ຕົກລົງ' }]
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
          <Text style={styles.title}>ເຂົ້າສູ່ລະບົບ</Text>
          <Text style={styles.subtitle}>ເຂົ້າສູ່ລະບົບເພື່ອເຂົ້າເຖິງງານວິໄຈ</Text>

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

          {/* Forgot password */}
          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
            <Text style={styles.forgotText}>ລືມລະຫັດຜ່ານ?</Text>
          </TouchableOpacity>

          <Button
            title="ເຂົ້າສູ່ລະບົບ"
            onPress={handleLogin}
            loading={loading}
            style={styles.mainBtn}
          />

          <Button
            title="ຍັງບໍ່ມີບັນຊີ? ສະໝັກສະມາຊິກ"
            onPress={() => router.push('/(auth)/register' as any)}
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
    forgotBtn: { alignSelf: 'flex-end', marginTop: -spacing.xs, marginBottom: spacing.sm },
    forgotText: { ...typography.caption, color: colors.primary },
    mainBtn: { marginTop: spacing.xs, marginBottom: spacing.sm },
  });
}
