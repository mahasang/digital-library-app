import { Fragment, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/contexts/LanguageContext';
import { spacing, typography, radius, shadows } from '@/constants/theme';

export default function ContactScreen() {
  const { colors } = useTheme();
  const t = useT();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const contacts = [
    { icon: 'mail-outline',     title: t('contact_email'),   sub: 'info@digitallibrary.la',            action: () => Linking.openURL('mailto:info@digitallibrary.la') },
    { icon: 'call-outline',     title: t('contact_phone'),   sub: '+856 20 XXXX XXXX',                 action: () => Linking.openURL('tel:+85620XXXXXXXX') },
    { icon: 'globe-outline',    title: t('contact_website'), sub: 'digital-library-sls.vercel.app',    action: () => Linking.openURL('https://digital-library-sls.vercel.app') },
    { icon: 'logo-facebook',    title: 'Facebook',  sub: 'Digital Library Lao',               action: () => Linking.openURL('https://facebook.com') },
    { icon: 'chatbubble-outline',title: 'LINE',      sub: '@digitallibrary',                   action: () => Linking.openURL('https://line.me') },
  ];

  const hours = [
    { day: t('hours_mon_fri'), time: '08:00 – 17:00' },
    { day: t('hours_sat'),     time: '08:00 – 12:00' },
    { day: t('hours_sun'),     time: t('hours_closed') },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('contact_title')}</Text>
        <Text style={styles.headerSub}>{t('contact_sub')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── ช่องทางติดต่อ ── */}
        <Text style={styles.sectionLabel}>{t('contact_channels')}</Text>
        <View style={styles.card}>
          {contacts.map((c, i) => (
            <Fragment key={c.title}>
              <TouchableOpacity style={styles.item} onPress={c.action}>
                <View style={styles.iconBox}>
                  <Ionicons name={c.icon as any} size={20} color={colors.primary} />
                </View>
                <View style={styles.itemText}>
                  <Text style={styles.itemTitle}>{c.title}</Text>
                  <Text style={styles.itemSub}>{c.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
              </TouchableOpacity>
              {i < contacts.length - 1 && <View style={styles.divider} />}
            </Fragment>
          ))}
        </View>

        {/* ── เวลาทำการ ── */}
        <Text style={styles.sectionLabel}>{t('contact_hours')}</Text>
        <View style={styles.card}>
          {hours.map((h, i) => (
            <Fragment key={h.day}>
              <View style={styles.item}>
                <View style={styles.iconBox}>
                  <Ionicons name="time-outline" size={20} color={colors.primary} />
                </View>
                <Text style={styles.itemTitle}>{h.day}</Text>
                <Text style={[styles.itemSub, { marginLeft: 'auto' as any }]}>{h.time}</Text>
              </View>
              {i < hours.length - 1 && <View style={styles.divider} />}
            </Fragment>
          ))}
        </View>

        {/* ── ที่อยู่ / Map ── */}
        <Text style={styles.sectionLabel}>{t('contact_location')}</Text>
        <TouchableOpacity
          style={styles.mapCard}
          onPress={() => Linking.openURL('https://maps.google.com/?q=Vientiane,Laos')}
          activeOpacity={0.8}
        >
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={48} color={colors.primary} />
          </View>
          <View style={styles.mapInfo}>
            <View style={styles.iconBox}>
              <Ionicons name="location-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.itemText}>
              <Text style={styles.itemTitle}>{t('contact_vientiane')}</Text>
              <Text style={styles.itemSub}>{t('contact_open_map')}</Text>
            </View>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      backgroundColor: colors.primary,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.lg,
      paddingHorizontal: spacing.lg,
    },
    headerTitle: { ...typography.h2, color: '#fff' },
    headerSub: { ...typography.body, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
    scroll: {
      padding: spacing.lg,
      gap: spacing.sm,
      paddingBottom: spacing.xxl,
    },
    sectionLabel: {
      ...typography.label,
      color: colors.text.secondary,
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      ...shadows.sm,
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
    mapCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      ...shadows.sm,
    },
    mapPlaceholder: {
      height: 120,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mapInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      gap: spacing.md,
    },
  });
}
