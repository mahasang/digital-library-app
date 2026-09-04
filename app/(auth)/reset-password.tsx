import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { spacing, typography, radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/contexts/LanguageContext';

export default function ResetPasswordScreen() {
  const { colors, isDark } = useTheme();
  const t = useT();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [done, setDone] = useState(false);

  async function handleReset() {
    if (!password.trim()) { setError(t('val_pw_required')); return; }
    if (password.length < 8) { setError(t('val_pw_short')); return; }
    if (password !== confirmPassword) { setError(t('val_pw_mismatch')); return; }

    setLoading(true);
    setError(undefined);

    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) { setError(err.message); return; }
    setDone(true);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoArea}>
          <View style={styles.logoIcon}>
            <Ionicons name="lock-closed-outline" size={36} color={colors.primary} />
          </View>
        </View>

        {done ? (
          <View style={styles.form}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            </View>
            <Text style={styles.title}>{t('common_pw_changed')}</Text>
            <Text style={styles.subtitle}>ລະຫັດຜ່ານຂອງທ່ານໄດ້ຖືກປ່ຽນແລ້ວ</Text>
            <Button
              title={t('login_btn')}
              onPress={() => router.replace('/(tabs)' as any)}
              style={{ marginTop: spacing.lg }}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.title}>ຕັ້ງລະຫັດຜ່ານໃໝ່</Text>
            <Text style={styles.subtitle}>ປ້ອນລະຫັດຜ່ານໃໝ່ຂອງທ່ານ</Text>
            <Input
              label={t('pw_new')}
              placeholder={t('pw_min8')}
              value={password}
              onChangeText={v => { setPassword(v); setError(undefined); }}
              secureTextEntry
              error={error}
            />
            <Input
              label={t('pw_confirm')}
              placeholder={t('pw_confirm_label')}
              value={confirmPassword}
              onChangeText={v => { setConfirmPassword(v); setError(undefined); }}
              secureTextEntry
            />
            <Button
              title="ຕັ້ງລະຫັດຜ່ານໃໝ່"
              onPress={handleReset}
              loading={loading}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xxl + spacing.lg, paddingBottom: spacing.xl },
    logoArea: { alignItems: 'center', marginBottom: spacing.xl },
    logoIcon: { width: 80, height: 80, borderRadius: radius.xl, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
    form: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, alignItems: 'stretch' },
    successIcon: { alignItems: 'center', marginBottom: spacing.md },
    title: { ...typography.h2, color: colors.text.primary, marginBottom: spacing.xs },
    subtitle: { ...typography.body, color: colors.text.secondary, marginBottom: spacing.lg },
  });
}
