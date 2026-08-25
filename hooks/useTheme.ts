import { useColorScheme } from 'react-native';
import { colors, darkColors } from '@/constants/theme';

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return {
    isDark,
    colors: isDark ? darkColors : colors,
  };
}
