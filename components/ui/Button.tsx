import React, { useMemo } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { radius, typography, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type Variant = 'primary' | 'outline' | 'ghost';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  onPress, title, variant = 'primary',
  loading = false, disabled = false, style
}: ButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.base, styles[variant], isDisabled && styles.disabled, style]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : colors.primary} size="small" />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text`]]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    base: {
      height: 52,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    primary: { backgroundColor: colors.primary },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    ghost: { backgroundColor: 'transparent' },
    disabled: { opacity: 0.5 },
    text: { ...typography.label },
    primaryText: { color: colors.text.inverse },
    outlineText: { color: colors.primary },
    ghostText: { color: colors.primary },
  });
}
