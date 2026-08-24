import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import { useState, useEffect } from 'react';

export default function AccountScreen() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
    });
  }, []);

  async function handleLogout() {
    setLoading(true);
    const { error } = await signOut();
    setLoading(false);
    if (error) {
      Alert.alert('ອອກຈາກລະບົບບໍ່ສຳເລັດ', error.message);
    }
    // ไม่ต้อง router.replace เอง — root layout ฟัง onAuthStateChange
    // แล้วสลับไปแสดง (auth) stack อัตโนมัติเมื่อ session หายไป
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>ບັນຊີ</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={colors.primary} />
          </View>
          <Text style={styles.email}>{email ?? '—'}</Text>
        </Card>

        <Button
          title="ອອກຈາກລະບົບ"
          onPress={handleLogout}
          loading={loading}
          variant="outline"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  profileCard: { alignItems: 'center', gap: spacing.sm, padding: spacing.xl },
  avatar: {
    width: 56, height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  email: { ...typography.body, color: colors.text.primary },
});
