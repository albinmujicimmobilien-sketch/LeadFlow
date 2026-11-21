import { useColorScheme } from 'react-native';

/** Farbpalette – ruhig, freundlich, gut lesbar (Kontrast WCAG AA) */
export const Colors = {
  light: {
    text: '#1B2430',
    textSecondary: '#5B6573',
    background: '#F6F8F7',
    card: '#FFFFFF',
    border: '#E2E7E5',
    primary: '#1F7A6B',
    primaryText: '#FFFFFF',
    primarySoft: '#E3F2EF',
    accent: '#F2A93B',
    danger: '#C0392B',
    dangerSoft: '#FBEAE8',
    success: '#1E8E5A',
    successSoft: '#E4F5EC',
    disabled: '#B9C1C9',
  },
  dark: {
    text: '#EEF2F1',
    textSecondary: '#A3ADB8',
    background: '#0F1513',
    card: '#18201E',
    border: '#2A3532',
    primary: '#4FB8A5',
    primaryText: '#0B1412',
    primarySoft: '#1C3430',
    accent: '#F2B45A',
    danger: '#EF7A6D',
    dangerSoft: '#3A1F1C',
    success: '#55C48D',
    successSoft: '#17302A',
    disabled: '#4A5550',
  },
} as const;

export type Palette = { [K in keyof typeof Colors.light]: string };

export function usePalette(): Palette {
  const scheme = useColorScheme();
  return Colors[scheme === 'dark' ? 'dark' : 'light'];
}

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const Radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
export const MaxContentWidth = 640;
