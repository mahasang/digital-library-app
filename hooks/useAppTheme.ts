import { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, darkColors } from '@/constants/theme';

type ThemeMode = 'system' | 'light' | 'dark';

const THEME_KEY = 'app_theme_mode';

export function useAppTheme() {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved) setMode(saved as ThemeMode);
    });
  }, []);

  async function setTheme(newMode: ThemeMode) {
    setMode(newMode);
    await AsyncStorage.setItem(THEME_KEY, newMode);
  }

  const isDark =
    mode === 'dark' || (mode === 'system' && systemScheme === 'dark');

  return { mode, setTheme, isDark, colors: isDark ? darkColors : colors };
}
