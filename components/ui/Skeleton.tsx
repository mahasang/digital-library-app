import { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
  borderRadius?: number;
}

export function Skeleton({ width = '100%', height = 16, style, borderRadius = radius.sm }: SkeletonProps) {
  const { isDark } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: isDark ? '#334155' : '#e2e8f0',
          opacity,
        },
        style,
      ]}
    />
  );
}

export function ResearchCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[skStyles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Skeleton width={80} height={110} borderRadius={0} />
      <View style={skStyles.content}>
        <Skeleton height={16} width="90%" />
        <Skeleton height={12} width="60%" style={{ marginTop: 6 }} />
        <Skeleton height={12} width="40%" style={{ marginTop: 6 }} />
        <View style={skStyles.meta}>
          <Skeleton height={10} width={40} />
          <Skeleton height={10} width={60} />
        </View>
      </View>
    </View>
  );
}

const skStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});
