import React, { useMemo, useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  secureToggle?: boolean;
}

export function Input({ label, error, secureToggle, ...props }: InputProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, error ? styles.inputError : styles.inputNormal]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.text.muted}
          secureTextEntry={secureToggle && !showPassword}
          {...props}
        />
        {secureToggle && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.text.secondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { marginBottom: spacing.md },
    label: { ...typography.label, color: colors.text.primary, marginBottom: spacing.xs },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      height: 52,
    },
    inputNormal: { borderColor: colors.border },
    inputError: { borderColor: colors.error },
    input: { flex: 1, ...typography.body, color: colors.text.primary },
    eyeIcon: { padding: spacing.xs },
    errorText: { ...typography.caption, color: colors.error, marginTop: 4 },
  });
}
