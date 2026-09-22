import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const theme = useTheme();

  return (
    <NativeTabs tintColor={theme.accent} labelStyle={{ selected: { color: theme.accent } }}>
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Label>Home loan</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(build)">
        <NativeTabs.Trigger.Label>House &amp; land</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'hammer', selected: 'hammer.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
