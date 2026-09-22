import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppTabs from '@/components/app-tabs';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  return (
    <SafeAreaProvider>
      <ThemeProvider value={dark ? DarkTheme : DefaultTheme}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <AppTabs />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
