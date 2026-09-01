import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { radius, spacing, typography } from "@/constants/theme";
import { useT } from "@/contexts/LanguageContext";
import { useTheme } from "@/hooks/useTheme";
import { signInWithGoogle } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const t = useT();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { confirmed } = useLocalSearchParams<{ confirmed?: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  function validate() {
    const e: typeof errors = {};
    if (!email.trim()) e.email = t("val_email_required");
    else if (!email.includes("@")) e.email = t("val_email_invalid");
    if (!password) e.password = t("val_pw_required");
    return e;
  }

  async function handleLogin() {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setLoading(true);
    setErrors({});
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      Alert.alert(t("login_fail"), t("login_wrong_pw"));
      return;
    }
    router.replace("/(tabs)");
  }

  function handleForgotPassword() {
    Alert.alert(t("login_forgot"), t("common_forgot_msg"), [
      { text: t("common_ok") },
    ]);
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    setGoogleLoading(false);
    if (error) {
      Alert.alert(t("common_error"), error);
    }
    // session จะถูก set อัตโนมัติ useSession hook จะ detect และ redirect
    // รอ session แล้ว redirect
    router.replace("/(tabs)");
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Back button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/(tabs)")
        }
      >
        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoArea}>
          <View style={styles.logoIcon}>
            <Ionicons name="library" size={36} color={colors.primary} />
          </View>
          <Text style={styles.appName}>Digital Library Plus</Text>
          <Text style={styles.appNameLao}>ຫ້ອງສະໝຸດດິຈິຕອນ</Text>
        </View>

        <View style={styles.form}>
          {confirmed === "1" && (
            <View style={styles.successBanner}>
              <Text style={styles.successBannerText}>
                {t("auth_email_confirmed")}
              </Text>
            </View>
          )}

          <Text style={styles.title}>{t("login_title")}</Text>
          <Text style={styles.subtitle}>{t("login_subtitle")}</Text>

          <Input
            label={t("field_email")}
            placeholder="your@email.com"
            value={email}
            onChangeText={(val) => {
              setEmail(val);
              setErrors((e) => ({ ...e, email: undefined }));
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
          />

          <Input
            label={t("field_password")}
            placeholder="••••••••"
            value={password}
            onChangeText={(val) => {
              setPassword(val);
              setErrors((e) => ({ ...e, password: undefined }));
            }}
            secureToggle
            error={errors.password}
          />

          {/* Forgot password */}
          <TouchableOpacity
            onPress={handleForgotPassword}
            style={styles.forgotBtn}
          >
            <Text style={styles.forgotText}>{t("login_forgot")}</Text>
          </TouchableOpacity>

          <Button
            title={t("login_btn")}
            onPress={handleLogin}
            loading={loading}
            style={styles.mainBtn}
          />

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t("login_or")}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign-In */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleLogin}
            disabled={googleLoading}
            activeOpacity={0.8}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color={colors.text.primary} />
            ) : (
              <>
                <Image
                  source={{ uri: "https://www.google.com/favicon.ico" }}
                  style={styles.googleIcon}
                  contentFit="contain"
                />
                <Text style={styles.googleBtnText}>{t("login_google")}</Text>
              </>
            )}
          </TouchableOpacity>

          <Button
            title={t("login_no_account")}
            onPress={() => router.push("/(auth)/register" as any)}
            variant="ghost"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    backBtn: {
      position: "absolute",
      top: spacing.xxl,
      left: spacing.md,
      zIndex: 10,
      padding: spacing.xs,
    },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl + spacing.lg,
      paddingBottom: spacing.xl,
    },
    logoArea: { alignItems: "center", marginBottom: spacing.xxl },
    logoIcon: {
      width: 80,
      height: 80,
      borderRadius: radius.xl,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.md,
    },
    appName: { ...typography.h3, color: colors.primary },
    appNameLao: {
      ...typography.bodySmall,
      color: colors.text.secondary,
      marginTop: 2,
    },
    form: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      ...typography.h2,
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    subtitle: {
      ...typography.body,
      color: colors.text.secondary,
      marginBottom: spacing.lg,
    },
    successBanner: {
      backgroundColor: colors.primaryLight,
      borderRadius: radius.md,
      padding: spacing.sm,
      marginBottom: spacing.md,
    },
    successBannerText: {
      ...typography.bodySmall,
      color: colors.primary,
      textAlign: "center",
    },
    forgotBtn: {
      alignSelf: "flex-end",
      marginTop: -spacing.xs,
      marginBottom: spacing.sm,
    },
    forgotText: { ...typography.caption, color: colors.primary },
    mainBtn: { marginTop: spacing.xs, marginBottom: spacing.sm },
    divider: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginVertical: spacing.sm,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      ...typography.caption,
      color: colors.text.muted,
    },
    googleBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      height: 48,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      marginBottom: spacing.sm,
    },
    googleIcon: {
      width: 20,
      height: 20,
    },
    googleBtnText: {
      ...typography.label,
      color: colors.text.primary,
    },
  });
}
