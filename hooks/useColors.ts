import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useUserStore } from '@/store/useUserStore';

export type ThemePreference = 'system' | 'light' | 'dark';

export function useColors() {
  const systemScheme     = useColorScheme() ?? 'light';
  const themePreference  = useUserStore((s) => s.themePreference ?? 'system');
  const scheme = themePreference === 'system' ? systemScheme : themePreference;
  return Colors[scheme];
}

export function useIsDark() {
  const systemScheme     = useColorScheme() ?? 'light';
  const themePreference  = useUserStore((s) => s.themePreference ?? 'system');
  const scheme = themePreference === 'system' ? systemScheme : themePreference;
  return scheme === 'dark';
}
