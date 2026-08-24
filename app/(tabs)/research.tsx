import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/constants/theme';
import { Card } from '@/components/ui/Card';

export default function ResearchScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>ງານວິໄຈ</Text>
      </View>

      <View style={styles.body}>
        <Card style={styles.comingSoon}>
          <Ionicons name="construct-outline" size={32} color={colors.primary} />
          <Text style={styles.comingSoonText}>ກຳລັງພັດທະນາ...</Text>
          <Text style={styles.comingSoonSub}>Phase 2 ຈະມີລາຍຊື່ງານວິໄຈ</Text>
        </Card>
      </View>
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
  body: { flex: 1, padding: spacing.lg },
  comingSoon: { alignItems: 'center', gap: spacing.sm, padding: spacing.xl },
  comingSoonText: { ...typography.h3, color: colors.text.primary },
  comingSoonSub: { ...typography.bodySmall, color: colors.text.secondary },
});
