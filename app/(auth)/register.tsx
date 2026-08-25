import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert
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
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});

  async function handleRegister() {
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = 'กรุณากรอกอีเมล';
    if (!password) newErrors.password = 'กรุณากรอกรหัสผ่าน';
    else if (password.length < 8) newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
    if (password && confirmPassword !== password) newErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    const { error } = await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      Alert.alert('สมัครสมาชิกไม่สำเร็จ', error.message);
      return;
    }

    Alert.alert('สมัครสมาชิกสำเร็จ', 'กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ', [
      { text: 'ตกลง', onPress: () => router.replace('/(auth)/login') },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
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
          <Text style={styles.subtitle}>ສະໝັກສະມາຊິກເພື່ອເຂົ້າເຖິງງານວິໄຈ ແລະຟີເຈີເພີ່ມເຕີມ</Text>

          <Input
            label="ອີເມວ"
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
          />

          <Input
            label="ລະຫັດຜ່ານ"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureToggle
            error={errors.password}
          />

          <Input
            label="ຢືນຢັນລະຫັດຜ່ານ"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureToggle
            error={errors.confirmPassword}
          />

          <Button
            title="ສະໝັກສະມາຊິກ"
            onPress={handleRegister}
            loading={loading}
            style={styles.registerButton}
          />

          <Button
            title="ມີບັນຊີຢູ່ແລ້ວ? ເຂົ້າສູ່ລະບົບ"
            onPress={() => router.push('/(auth)/login')}
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
    registerButton: { marginTop: spacing.sm, marginBottom: spacing.sm },
  });
}
