import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { AppConfig } from '@/lib/config';

// Zeigt Fehler auf dem Bildschirm an statt einer leeren Seite
export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  const scheme = useColorScheme();
  const c = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider
      value={{
        ...base,
        colors: { ...base.colors, primary: c.primary, background: c.background, card: c.card, text: c.text, border: c.border },
      }}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.card },
          headerTintColor: c.primary,
          headerTitleStyle: { color: c.text, fontWeight: '700' },
          contentStyle: { backgroundColor: c.background },
          headerBackTitle: 'Zurück',
        }}>
        <Stack.Screen name="index" options={{ title: AppConfig.brandName }} />
        <Stack.Screen name="buchen/[slotId]" options={{ title: 'Termin buchen' }} />
        <Stack.Screen name="bestaetigung" options={{ title: 'Buchung bestätigt', headerBackVisible: false, gestureEnabled: false }} />
        <Stack.Screen name="stornieren" options={{ title: 'Buchung verwalten' }} />
        <Stack.Screen name="admin/index" options={{ title: 'Trainer-Bereich' }} />
        <Stack.Screen name="admin/neu" options={{ title: 'Termine anlegen' }} />
      </Stack>
    </ThemeProvider>
  );
}
