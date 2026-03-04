import { Colors } from '@/constants/theme';
import { AppStateContext } from '@/context/AppStateContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useContext } from 'react';

type ColorKey = keyof typeof Colors.light;

export function useThemeColors() {
    const appState = useContext(AppStateContext);
    const { settings } = appState || { settings: { theme: 'light' as const } };
    const systemTheme = useColorScheme() ?? 'light';
    const theme = settings.theme === 'system' ? systemTheme : settings.theme;
    return Colors[theme];
}

export function useThemeColor(colorKey: ColorKey) {
    const appState = useContext(AppStateContext);
    const { settings } = appState || { settings: { theme: 'light' as const } };
    const systemTheme = useColorScheme() ?? 'light';
    const theme = settings.theme === 'system' ? systemTheme : settings.theme;
    return Colors[theme][colorKey];
}
