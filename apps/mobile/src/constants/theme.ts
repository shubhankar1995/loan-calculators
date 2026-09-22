/**
 * The mobile palette mirrors the CSS custom properties in `apps/web/src/index.css`,
 * with a dark variant added because an iOS app is expected to follow the system
 * appearance. Keep the two in step when the brand colours change.
 */

import { Platform } from 'react-native';

const light = {
  ink: '#12151b',
  inkSoft: '#4b5262',
  muted: '#6b7280',
  line: '#e1e4e9',
  lineSoft: '#ecedf0',
  pageBg: '#f2f3f5',
  surface: '#ffffff',
  surfaceAlt: '#f6f7f9',
  accent: '#2563eb',
  accentSoft: '#eaf0fe',
  equity: '#1f9254',
  equitySoft: '#e8f5ee',
  homeValue: '#c2410c',
  homeValueSoft: '#fdf0e8',
};

export type ThemeColor = keyof typeof light;
export type Theme = Record<ThemeColor, string>;

const dark: Theme = {
  ink: '#f4f6f9',
  inkSoft: '#a9b0bd',
  muted: '#858d9b',
  line: '#2b303a',
  lineSoft: '#23272f',
  pageBg: '#0b0d11',
  surface: '#161a21',
  surfaceAlt: '#1d222a',
  accent: '#6ea3ff',
  accentSoft: '#17243c',
  equity: '#3ecb85',
  equitySoft: '#12291d',
  homeValue: '#fb923c',
  homeValueSoft: '#2d1c10',
};

export const Colors: Record<'light' | 'dark', Theme> = { light, dark };

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    rounded: 'normal',
    mono: 'monospace',
  },
})!;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
} as const;
