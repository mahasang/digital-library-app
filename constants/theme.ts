export const colors = {
  background: '#FAFAF7',
  surface: '#FFFFFF',
  primary: '#185ff2',
  primaryLight: '#EEF3FF',
  primaryDark: '#1248c4',
  text: {
    primary: '#1a1a2e',
    secondary: '#64748b',
    muted: '#94a3b8',
    inverse: '#FFFFFF',
  },
  border: '#e2e8f0',
  error: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
};

export const darkColors = {
  background: '#0f172a',
  surface: '#1e293b',
  primary: '#3b82f6',
  primaryLight: '#1e3a5f',
  primaryDark: '#2563eb',
  text: {
    primary: '#f1f5f9',
    secondary: '#94a3b8',
    muted: '#64748b',
    inverse: '#0f172a',
  },
  border: '#334155',
  error: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
};

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 24, full: 9999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  label: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
};
