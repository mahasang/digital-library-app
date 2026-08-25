import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, darkColors } from '@/constants/theme';

type ThemeMode = 'system' | 'light' | 'dark';

const THEME_KEY = 'app_theme_mode';

const ThemeContext = createContext<{
  mode: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  isDark: boolean;
  colors: typeof colors;
}>({
  mode: 'system',
  setTheme: () => {},
  isDark: false,
  colors,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
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

  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');

  return (
    <ThemeContext.Provider value={{ mode, setTheme, isDark, colors: isDark ? darkColors : colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
