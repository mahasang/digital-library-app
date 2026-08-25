import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { radius, spacing, shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  shadow?: boolean;
}

export function Card({ children, style, shadow = true }: CardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.card, shadow && shadows.sm, style]}>
      {children}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
  });
}
