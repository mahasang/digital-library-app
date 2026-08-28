import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Animated,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { getResearchPdfUrl } from '@/lib/research';

export default function PdfViewerScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [webViewLoading, setWebViewLoading] = useState(true);
  const progressAnim = useMemo(() => new Animated.Value(0), []);

  const fetchUrl = useCallback(async () => {
    setError(false);
    setLoading(true);
    setPdfUrl(null);
    if (!slug) return;
    const url = await getResearchPdfUrl(slug);
    if (url) setPdfUrl(url);
    else setError(true);
    setLoading(false);
  }, [slug]);

  useEffect(() => { fetchUrl(); }, [fetchUrl]);

  // progress bar animation เมื่อ WebView loading
  useEffect(() => {
    if (webViewLoading && pdfUrl) {
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: 0.85,
        duration: 8000,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [webViewLoading, pdfUrl]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // แสดงชื่อจาก slug
  const displayTitle = slug
    ? slug.split('-').slice(0, 4).join(' ')
    : 'PDF';

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{displayTitle}</Text>
      </View>

      {/* Progress bar */}
      {pdfUrl && webViewLoading && (
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>ກຳລັງໂຫລດ PDF...</Text>
        </View>
      ) : error || !pdfUrl ? (
        <View style={styles.center}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          </View>
          <Text style={styles.errorTitle}>ບໍ່ສາມາດໂຫລດ PDF ໄດ້</Text>
          <Text style={styles.errorSub}>ກວດສອບການເຊື່ອມຕໍ່ ຫຼື ລອງໃໝ່ອີກຄັ້ງ</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchUrl}>
            <Ionicons name="refresh-outline" size={18} color={colors.primary} />
            <Text style={styles.retryText}>ລອງໃໝ່</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: spacing.sm }}>
            <Text style={styles.backLink}>ກັບໄປ</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          source={{
            uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`,
          }}
          injectedJavaScript={`
            const style = document.createElement('style');
            style.innerHTML = '.ndfHFb-c4YZDc-Wrql6b { display: none !important; }';
            document.head.appendChild(style);
          `}
          style={styles.webview}
          onLoadStart={() => setWebViewLoading(true)}
          onLoadEnd={() => setWebViewLoading(false)}
          startInLoadingState={false}
        />
      )}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
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
    headerTitle: { ...typography.h3, color: colors.text.primary, flex: 1, textTransform: 'capitalize' },
    progressTrack: {
      height: 3,
      backgroundColor: colors.border,
    },
    progressBar: {
      height: 3,
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    center: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      gap: spacing.sm, padding: spacing.xl,
    },
    loadingText: { ...typography.body, color: colors.text.secondary },
    errorIcon: {
      width: 80, height: 80, borderRadius: radius.full,
      backgroundColor: '#fef2f2',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    errorTitle: { ...typography.h3, color: colors.text.primary },
    errorSub: { ...typography.bodySmall, color: colors.text.secondary, textAlign: 'center' },
    retryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    retryText: { ...typography.label, color: colors.primary },
    backLink: { ...typography.label, color: colors.text.secondary },
    webview: { flex: 1 },
  });
}
