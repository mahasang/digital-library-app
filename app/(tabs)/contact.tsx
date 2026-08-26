import { Fragment, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { spacing, typography, radius } from '@/constants/theme';

export default function ContactScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      backgroundColor: colors.primary,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.lg,
      paddingHorizontal: spacing.lg,
    },
    headerTitle: { ...typography.h2, color: '#fff' },
    headerSub: { ...typography.body, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
    scroll: { padding: spacing.lg, gap: spacing.md },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      gap: spacing.md,
    },
    iconBox: {
      width: 40, height: 40,
      borderRadius: radius.md,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemText: { flex: 1 },
    itemTitle: { ...typography.label, color: colors.text.primary },
    itemSub: { ...typography.caption, color: colors.text.secondary, marginTop: 2 },
    divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
  }), [colors]);

  const contacts = [
    { icon: 'mail-outline', title: 'ອີເມວ', sub: 'info@digitallibrary.la', action: () => Linking.openURL('mailto:info@digitallibrary.la') },
    { icon: 'call-outline', title: 'ໂທລະສັບ', sub: '+856 20 XXXX XXXX', action: () => Linking.openURL('tel:+85620XXXXXXXX') },
    { icon: 'globe-outline', title: 'ເວັບໄຊ', sub: 'digital-library-sls.vercel.app', action: () => Linking.openURL('https://digital-library-sls.vercel.app') },
    { icon: 'location-outline', title: 'ທີ່ຢູ່', sub: 'ວຽງຈັນ, ສປປ ລາວ', action: null },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ຕິດຕໍ່ເຮົາ</Text>
        <Text style={styles.headerSub}>ມີຄຳຖາມຫຼືຕ້ອງການຊ່ວຍເຫຼືອ?</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          {contacts.map((c, i) => (
            <Fragment key={c.title}>
              <TouchableOpacity
                style={styles.item}
                onPress={c.action ?? undefined}
                disabled={!c.action}
              >
                <View style={styles.iconBox}>
                  <Ionicons name={c.icon as any} size={20} color={colors.primary} />
                </View>
                <View style={styles.itemText}>
                  <Text style={styles.itemTitle}>{c.title}</Text>
                  <Text style={styles.itemSub}>{c.sub}</Text>
                </View>
                {c.action && <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />}
              </TouchableOpacity>
              {i < contacts.length - 1 && <View style={styles.divider} />}
            </Fragment>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
