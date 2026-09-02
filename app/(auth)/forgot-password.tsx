import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
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

export default function ForgotPasswordScreen() {
  const { colors, isDark } = useTheme();
  const t = useT();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleSubmit() {
    if (!email.trim()) { setError(t('val_email_required')); return; }
    if (!email.includes('@')) { setError(t('val_email_invalid')); return; }
    setLoading(true);
    setError(undefined);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'digitallibraryapp://auth/callback',
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSent(true);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)/login' as any)}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoArea}>
          <View style={styles.logoIcon}>
            <Ionicons name="lock-open-outline" size={36} color={colors.primary} />
          </View>
        </View>

        {sent ? (
          <View style={styles.form}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            </View>
            <Text style={styles.title}>{t('forgot_sent_title')}</Text>
            <Text style={styles.subtitle}>{t('forgot_sent_sub')}</Text>
            <Button
              title={t('login_btn')}
              onPress={() => router.replace('/(auth)/login' as any)}
              style={{ marginTop: spacing.lg }}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.title}>{t('forgot_title')}</Text>
            <Text style={styles.subtitle}>{t('forgot_sub')}</Text>
            <Input
              label={t('field_email')}
              placeholder="your@email.com"
              value={email}
              onChangeText={v => { setEmail(v); setError(undefined); }}
              keyboardType="email-address"
              autoCapitalize="none"
              error={error}
            />
            <Button
              title={t('forgot_btn')}
              onPress={handleSubmit}
              loading={loading}
              style={{ marginTop: spacing.sm }}
            />
            <Button
              title={t('login_btn')}
              onPress={() => router.back()}
              variant="ghost"
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
    backBtn: { position: 'absolute', top: spacing.xxl, left: spacing.md, zIndex: 10, padding: spacing.xs },
    scroll: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xxl + spacing.lg, paddingBottom: spacing.xl },
    logoArea: { alignItems: 'center', marginBottom: spacing.xl },
    logoIcon: { width: 80, height: 80, borderRadius: radius.xl, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
    form: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, alignItems: 'stretch' },
    successIcon: { alignItems: 'center', marginBottom: spacing.md },
    title: { ...typography.h2, color: colors.text.primary, marginBottom: spacing.xs },
    subtitle: { ...typography.body, color: colors.text.secondary, marginBottom: spacing.lg },
  });
}
