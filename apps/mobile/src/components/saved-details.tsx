import * as Haptics from 'expo-haptics';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  onReset: () => void;
}

/** Tells people their figures are kept on this device, and offers a way out of that. */
export function SavedDetails({ onReset }: Props) {
  const theme = useTheme();

  const confirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Reset these details?',
      'Your saved figures will be replaced with the starting ones.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: onReset },
      ],
    );
  };

  return (
    <Card style={styles.card}>
      <Text style={[styles.note, { color: theme.inkSoft }]}>
        Saved on this device, so your figures are here next time you open the app.
      </Text>
      <View style={styles.actionRow}>
        <Pressable onPress={confirm} accessibilityRole="button" hitSlop={8}>
          <Text style={[styles.reset, { color: theme.homeValue }]}>Reset to defaults</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  note: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionRow: {
    alignItems: 'flex-start',
  },
  reset: {
    fontSize: 15,
    fontWeight: '600',
  },
});
