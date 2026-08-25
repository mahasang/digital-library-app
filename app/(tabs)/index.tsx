import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { spacing, typography, radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { getResearchStats } from '@/lib/research';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [stats, setStats] = useState({ research: 0, categories: 0, organizations: 0 });

  useEffect(() => {
    getResearchStats().then(setStats);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>ສະບາຍດີ 👋</Text>
          <Text style={styles.headerTitle}>ຫ້ອງສະໝຸດດິຈິຕອນ</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="library" size={24} color={colors.primary} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Hero Banner */}
        <LinearGradient
          colors={isDark ? ['#1e3a5f', '#0f172a'] : ['#185ff2', '#1248c4']}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>ຍິນດີຕ້ອນຮັບ 👋</Text>
            <Text style={styles.heroSubtitle}>
              ຄົ້ນຫາງານວິໄຈກວ່າ {stats.research} ລາຍການ
            </Text>
            <TouchableOpacity
              style={styles.heroBtn}
              onPress={() => router.push('/(tabs)/research')}
            >
              <Text style={styles.heroBtnText}>ຄົ້ນຫາງານວິໄຈ →</Text>
            </TouchableOpacity>
          </View>
          <Ionicons
            name="library"
            size={80}
            color="rgba(255,255,255,0.15)"
            style={styles.heroIcon}
          />
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'ງານວິໄຈ', value: stats.research.toString(), icon: 'document-text-outline' },
            { label: 'ຫມວດຫມູ່', value: stats.categories.toString(), icon: 'folder-outline' },
            { label: 'ຫນ່ວຍງານ', value: stats.organizations.toString(), icon: 'business-outline' },
          ].map((stat) => (
            <Card key={stat.label} style={styles.statCard}>
              <Ionicons name={stat.icon as any} size={20} color={colors.primary} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Card>
          ))}
        </View>
      </ScrollView>
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
    greeting: { ...typography.caption, color: colors.text.secondary },
    headerTitle: { ...typography.h3, color: colors.text.primary },
    headerIcon: {
      width: 44, height: 44,
      borderRadius: radius.md,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: { padding: spacing.lg, gap: spacing.md },
    hero: {
      borderRadius: radius.xl,
      padding: spacing.lg,
      overflow: 'hidden',
      position: 'relative',
    },
    heroContent: { gap: spacing.sm },
    heroTitle: { ...typography.h2, color: '#fff' },
    heroSubtitle: { ...typography.body, color: 'rgba(255,255,255,0.8)' },
    heroBtn: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginTop: spacing.xs,
    },
    heroBtnText: { ...typography.label, color: '#fff' },
    heroIcon: {
      position: 'absolute',
      right: -10,
      top: -10,
    },
    statsRow: { flexDirection: 'row', gap: spacing.sm },
    statCard: { flex: 1, alignItems: 'center', gap: 4, padding: spacing.md },
    statValue: { ...typography.h2, color: colors.primary },
    statLabel: { ...typography.caption, color: colors.text.secondary },
  });
}
