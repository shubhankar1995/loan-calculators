import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, type Theme } from '@/constants/theme';

/** The palette for the current system appearance, defaulting to light. */
export function useTheme(): Theme {
  const scheme = useColorScheme();
  return Colors[scheme === 'dark' ? 'dark' : 'light'];
}
