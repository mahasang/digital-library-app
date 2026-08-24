import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { getResearchStats } from '@/lib/research';

export default function HomeScreen() {
  const [stats, setStats] = useState({ research: 0, categories: 0, organizations: 0 });

  useEffect(() => {
    getResearchStats().then(setStats);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
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

        {/* Coming soon */}
        <Card style={styles.comingSoon}>
          <Ionicons name="construct-outline" size={32} color={colors.primary} />
          <Text style={styles.comingSoonText}>ກຳລັງພັດທະນາ...</Text>
          <Text style={styles.comingSoonSub}>Phase 2 ຈະມີລາຍຊື່ງານວິໄຈ</Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, alignItems: 'center', gap: 4, padding: spacing.md },
  statValue: { ...typography.h2, color: colors.primary },
  statLabel: { ...typography.caption, color: colors.text.secondary },
  comingSoon: { alignItems: 'center', gap: spacing.sm, padding: spacing.xl },
  comingSoonText: { ...typography.h3, color: colors.text.primary },
  comingSoonSub: { ...typography.bodySmall, color: colors.text.secondary },
});
