import { Colors } from '@/constants/theme';
import { AppStateContext } from '@/context/AppStateContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useContext } from 'react';

type ColorKey = keyof typeof Colors.light;

export function useThemeColors() {
    const appState = useContext(AppStateContext);
    const { settings } = appState || { settings: { theme: 'light' as const, accentColor: undefined as string | undefined } };
    const systemTheme = useColorScheme() ?? 'light';
    const theme = settings.theme === 'system' ? systemTheme : settings.theme;
    const baseColors = Colors[theme];

    // Override primary color with custom accent if one is set
    if (settings.accentColor) {
        return {
            ...baseColors,
            primary: settings.accentColor,
            tint: settings.accentColor,
        };
    }

    return baseColors;
}

export function useThemeColor(colorKey: ColorKey) {
    const appState = useContext(AppStateContext);
    const { settings } = appState || { settings: { theme: 'light' as const, accentColor: undefined as string | undefined } };
    const systemTheme = useColorScheme() ?? 'light';
    const theme = settings.theme === 'system' ? systemTheme : settings.theme;
    const baseColors = Colors[theme];

    if (settings.accentColor && (colorKey === 'primary' || colorKey === 'tint')) {
        return settings.accentColor;
    }

    return baseColors[colorKey];
}
