import { createContext, useContext } from 'react';
import type { ScrollView } from 'react-native';

/**
 * The scroll view a screen's content sits in, so a gesture inside the content
 * can claim the touch ahead of it. Provided by `Screen`; null elsewhere.
 */
export const ScreenScrollContext = createContext<React.RefObject<ScrollView | null> | null>(null);

export function useScreenScroll() {
  return useContext(ScreenScrollContext);
}
