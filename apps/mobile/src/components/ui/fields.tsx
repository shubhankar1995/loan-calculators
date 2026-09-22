import DateTimePicker from '@react-native-community/datetimepicker';
import { formatNumber, parseNumber, parseISODate, toISODate } from '@repayly/core';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  ActionSheetIOS,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

interface FieldRowProps {
  label: string;
  /** Sits under the label in smaller muted text. */
  hint?: string;
  children: React.ReactNode;
}

/** A label on the left, a control on the right — the iOS grouped-list row. */
export function FieldRow({ label, hint, children }: FieldRowProps) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.rowLabel}>
        <Text style={[styles.label, { color: theme.ink }]}>{label}</Text>
        {hint ? <Text style={[styles.hint, { color: theme.muted }]}>{hint}</Text> : null}
      </View>
      <View style={styles.rowControl}>{children}</View>
    </View>
  );
}

/** Label above, full-width control below — for controls too wide to sit beside their label. */
export function StackedField({ label, hint, children }: FieldRowProps) {
  const theme = useTheme();
  return (
    <View style={styles.stacked}>
      <Text style={[styles.label, { color: theme.ink }]}>{label}</Text>
      {hint ? <Text style={[styles.hint, { color: theme.muted }]}>{hint}</Text> : null}
      {children}
    </View>
  );
}

interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  /** Decimals get a decimal keypad and are shown unformatted, e.g. an interest rate. */
  decimal?: boolean;
  accessibilityLabel: string;
  /** Narrower than the standalone default, for inputs sitting inside a wider row. */
  compact?: boolean;
}

/**
 * While the input has focus it holds the raw text the user typed, so the caret
 * doesn't jump around as thousands separators are inserted; on blur it goes back
 * to the formatted value.
 */
export function NumericInput({
  value,
  onChange,
  prefix,
  suffix,
  decimal,
  accessibilityLabel,
  compact,
}: NumericInputProps) {
  const theme = useTheme();
  const [draft, setDraft] = useState<string | null>(null);
  const formatted = decimal ? String(value) : formatNumber(value);

  return (
    <View
      style={[
        styles.input,
        compact && styles.inputCompact,
        { backgroundColor: theme.surfaceAlt, borderColor: theme.line },
      ]}>
      {prefix ? <Text style={[styles.affix, { color: theme.muted }]}>{prefix}</Text> : null}
      <TextInput
        value={draft ?? formatted}
        onChangeText={(text) => {
          setDraft(text);
          onChange(parseNumber(text));
        }}
        onFocus={() => setDraft(value === 0 ? '' : String(value))}
        onBlur={() => setDraft(null)}
        keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
        selectTextOnFocus
        style={[styles.inputText, { color: theme.ink }]}
        accessibilityLabel={accessibilityLabel}
      />
      {suffix ? <Text style={[styles.affix, { color: theme.muted }]}>{suffix}</Text> : null}
    </View>
  );
}

type NumericFieldProps = Omit<NumericInputProps, 'accessibilityLabel' | 'compact'> & {
  label: string;
  hint?: string;
};

export function NumericField({ label, hint, ...input }: NumericFieldProps) {
  return (
    <FieldRow label={label} hint={hint}>
      <NumericInput accessibilityLabel={label} {...input} />
    </FieldRow>
  );
}

interface TextFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  accessibilityLabel: string;
}

export function TextField({ value, onChange, placeholder, accessibilityLabel }: TextFieldProps) {
  const theme = useTheme();
  return (
    <View style={[styles.input, { backgroundColor: theme.surfaceAlt, borderColor: theme.line }]}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        style={[styles.inputText, styles.inputTextLeft, { color: theme.ink }]}
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  );
}

interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Stretches each segment to fill the width, for a full-width toggle. */
  fullWidth?: boolean;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  fullWidth,
}: SegmentedProps<T>) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.segmented,
        { backgroundColor: theme.surfaceAlt, borderColor: theme.line },
        fullWidth && styles.segmentedFull,
      ]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              if (selected) return;
              Haptics.selectionAsync();
              onChange(option.value);
            }}
            style={[
              styles.segment,
              fullWidth && styles.segmentFull,
              selected && { backgroundColor: theme.surface, borderColor: theme.line },
            ]}>
            <Text
              numberOfLines={1}
              style={[styles.segmentText, { color: selected ? theme.ink : theme.muted }]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

/** Opens the native action sheet on iOS; falls back to cycling through options elsewhere. */
export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: SelectFieldProps<T>) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const current = options.find((option) => option.value === value);

  const open = () => {
    Haptics.selectionAsync();
    if (Platform.OS !== 'ios') {
      const index = options.findIndex((option) => option.value === value);
      onChange(options[(index + 1) % options.length].value);
      return;
    }
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: label,
        options: [...options.map((option) => option.label), 'Cancel'],
        cancelButtonIndex: options.length,
        userInterfaceStyle: scheme === 'dark' ? 'dark' : 'light',
      },
      (index) => {
        if (index < options.length) onChange(options[index].value);
      },
    );
  };

  return (
    <FieldRow label={label}>
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${current?.label ?? ''}`}
        style={[styles.input, { backgroundColor: theme.surfaceAlt, borderColor: theme.line }]}>
        <Text numberOfLines={1} style={[styles.inputText, styles.selectText, { color: theme.ink }]}>
          {current?.label ?? ''}
        </Text>
        <SymbolView name="chevron.up.chevron.down" size={11} tintColor={theme.muted} />
      </Pressable>
    </FieldRow>
  );
}

interface DateFieldProps {
  label: string;
  /** An "yyyy-MM-dd" string, matching the web app's date input. */
  value: string;
  onChange: (value: string) => void;
}

export function DateField({ label, value, onChange }: DateFieldProps) {
  return (
    <FieldRow label={label}>
      <DateTimePicker
        value={parseISODate(value)}
        mode="date"
        display="compact"
        accessibilityLabel={label}
        onValueChange={(_event, date) => {
          if (date) onChange(toISODate(date));
        }}
      />
    </FieldRow>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 56,
  },
  rowLabel: {
    flexShrink: 1,
  },
  stacked: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  rowControl: {
    flexGrow: 0,
    flexShrink: 0,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  hint: {
    fontSize: 12,
    marginTop: 2,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minWidth: 132,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : 2,
  },
  inputCompact: {
    minWidth: 0,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    padding: 0,
  },
  inputTextLeft: {
    textAlign: 'left',
    fontWeight: '500',
  },
  selectText: {
    paddingVertical: 2,
  },
  affix: {
    fontSize: 14,
    fontWeight: '500',
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 2,
    gap: 2,
  },
  segmentedFull: {
    alignSelf: 'stretch',
  },
  segment: {
    borderRadius: Radius.sm - 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 2,
  },
  segmentFull: {
    flex: 1,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
