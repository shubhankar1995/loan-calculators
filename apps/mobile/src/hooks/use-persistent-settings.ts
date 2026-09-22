import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  serialiseSettings,
  type HomeLoanSettings,
  type HouseAndLandSettings,
} from '@repayly/core';
import { useCallback, useEffect, useRef, useState } from 'react';

interface PersistentSettings<T> {
  settings: T;
  /** False until the saved figures have been read back off the device. */
  loaded: boolean;
  /** Merges a partial change, e.g. `update({ amount: 640000 })`. */
  update: (patch: Partial<T>) => void;
  /** Forgets the saved details and goes back to the starting figures. */
  reset: () => void;
}

/**
 * A calculator's inputs, kept on the device so the form is already filled in
 * next time the app opens.
 *
 * The read is asynchronous, so `settings` starts out as the defaults and
 * `loaded` tells the screen whether those are real yet. Writes happen as the
 * inputs change, never from an effect, which keeps the initial defaults from
 * racing ahead of the read they are about to be replaced by.
 *
 * Storage failures are swallowed: this device just won't remember the figures.
 */
export function usePersistentSettings<T extends HomeLoanSettings | HouseAndLandSettings>(
  key: string,
  parse: (raw: string | null) => T,
): PersistentSettings<T> {
  const [settings, setSettings] = useState<T>(() => parse(null));
  const [loaded, setLoaded] = useState(false);

  // Mirrors the state so a patch can be merged onto the current figures
  // without reading them from a stale closure.
  const latest = useRef(settings);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      let stored: string | null = null;
      try {
        stored = await AsyncStorage.getItem(key);
      } catch {
        stored = null;
      }
      if (!active) return;

      const restored = parse(stored);
      latest.current = restored;
      setSettings(restored);
      setLoaded(true);
    };

    hydrate();

    return () => {
      active = false;
    };
  }, [key, parse]);

  const update = useCallback(
    (patch: Partial<T>) => {
      const next = { ...latest.current, ...patch };

      latest.current = next;
      setSettings(next);
      AsyncStorage.setItem(key, serialiseSettings(next)).catch(() => {});
    },
    [key],
  );

  const reset = useCallback(() => {
    const defaults = parse(null);

    latest.current = defaults;
    setSettings(defaults);
    AsyncStorage.removeItem(key).catch(() => {});
  }, [key, parse]);

  return { settings, loaded, update, reset };
}
