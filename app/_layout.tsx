import { Sentry } from '@/sentry';
import { AppStateContext, AppStateProvider } from '@/context/AppStateContext';
import { LayoutProvider } from '@/context/LayoutContext';
import { Brand } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useContext, useEffect } from 'react';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: '(tabs)',
};

const ACONCCILightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Brand.primary,
    background: '#FFFFFF',
    card: '#F8FAFC',
    text: '#1E293B',
    border: '#E2E8F0',
  },
};

const ACONCCIDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Brand.primary,
    background: '#0F172A',
    card: '#1E293B',
    text: '#F8FAFC',
    border: '#334155',
  },
};

function RootLayoutNav() {
  const appState = useContext(AppStateContext);
  const router = useRouter();

  if (!appState) return null;

  const { settings, user, isLoaded } = appState;
  const systemTheme = useColorScheme() ?? 'light';
  const theme = settings.theme === 'system' ? systemTheme : settings.theme;

  const themeConfig = theme === 'dark' ? ACONCCIDarkTheme : ACONCCILightTheme;

  // Redirect based on auth state once storage has been checked
  useEffect(() => {
    if (!isLoaded) return;
    if (user) {
      router.replace('/(tabs)');
    } else {
      router.replace('/login');
    }
  }, [isLoaded, user]);

  return (
    <ThemeProvider value={themeConfig}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="note/[id]"
          options={{
            presentation: 'card',
          }}
        />
        <Stack.Screen name="search" />
      </Stack>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

function RootLayout() {
  return (
    <AppStateProvider>
      <LayoutProvider>
        <RootLayoutNav />
      </LayoutProvider>
    </AppStateProvider>
  );
}

export default Sentry.wrap(RootLayout);
