import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/constants/theme';
import { getResearchPdfUrl } from '@/lib/research';

export default function PdfViewerScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (slug) {
      getResearchPdfUrl(slug).then((url) => {
        if (url) setPdfUrl(url);
        else setError(true);
        setLoading(false);
      });
    }
  }, [slug]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ອ່ານ PDF</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>ກຳລັງໂຫລດ PDF...</Text>
        </View>
      ) : error || !pdfUrl ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>ບໍ່ສາມາດໂຫລດ PDF ໄດ້</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>ກັບໄປ</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          source={{ uri: pdfUrl }}
          style={styles.webview}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  backBtn: { padding: 4 },
  headerTitle: { ...typography.h3, color: colors.text.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { ...typography.body, color: colors.text.secondary },
  errorText: { ...typography.body, color: colors.error },
  backLink: { ...typography.label, color: colors.primary },
  webview: { flex: 1 },
});
