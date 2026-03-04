import { Brand } from '@/constants/theme';
import { AppStateContext, AppStateProvider } from '@/context/AppStateContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useContext } from 'react';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: '(tabs)',
};

const ACONCCILightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Brand.primary,
    background: '#fafafa',
    card: '#ffffff',
    text: '#1a1a1a',
    border: '#e5e5e5',
  },
};

const ACONCCIDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Brand.primary,
    background: '#1a1a1a',
    card: '#1a1a1a',
    text: '#fafafa',
    border: '#333333',
  },
};

function RootLayoutNav() {
  const appState = useContext(AppStateContext);
  const { settings } = appState || { settings: { theme: 'light' as const } };
  const systemColorScheme = useColorScheme();
  const theme = settings.theme === 'system' ? systemColorScheme : settings.theme;

  return (
    <ThemeProvider value={theme === 'dark' ? ACONCCIDarkTheme : ACONCCILightTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="note/[id]"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
      </Stack>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppStateProvider>
      <RootLayoutNav />
    </AppStateProvider>
  );
}
