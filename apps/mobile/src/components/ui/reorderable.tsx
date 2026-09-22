import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';
import { useScreenScroll } from '@/hooks/use-screen-scroll';
import { useTheme } from '@/hooks/use-theme';

/** How long rows take to slide out of the way, and the dropped row to settle. */
const SETTLE = { duration: 160 };

interface Props<T> {
  data: T[];
  onReorder: (next: T[]) => void;
  /** Names a row for VoiceOver, e.g. "Slab" becomes "Reorder Slab". */
  describeItem: (item: T, index: number) => string;
  /** `handle` is the grip the row is dragged by — place it inside the row. */
  renderItem: (item: T, index: number, handle: React.ReactNode) => React.ReactNode;
}

/**
 * A list whose rows can be dragged into a new order by their grip handle.
 *
 * Rows are assumed to be the same height: the first row measures itself and the
 * drag maths works in whole rows from there. While a drag is in flight the order
 * only exists on the UI thread as a translation per row; `onReorder` fires once,
 * on drop, with the reordered data.
 */
export function ReorderableList<T>({ data, onReorder, describeItem, renderItem }: Props<T>) {
  const activeIndex = useSharedValue(-1);
  const targetIndex = useSharedValue(-1);
  const offsetY = useSharedValue(0);
  const rowHeight = useSharedValue(0);
  // Set on drop, cleared once `move` has applied the new order.
  const dropping = useSharedValue(false);

  const move = (from: number, to: number) => {
    if (from !== to && to >= 0 && to < data.length) {
      const next = data.slice();
      next.splice(to, 0, next.splice(from, 1)[0]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onReorder(next);
    }
    // Cleared in the same tick as the reorder, so the rows are never painted
    // with the new order and the old drag offsets at once.
    activeIndex.value = -1;
    targetIndex.value = -1;
    offsetY.value = 0;
    dropping.value = false;
  };

  return (
    <View>
      {data.map((item, index) => (
        <Row
          key={index}
          index={index}
          count={data.length}
          label={describeItem(item, index)}
          activeIndex={activeIndex}
          targetIndex={targetIndex}
          offsetY={offsetY}
          rowHeight={rowHeight}
          dropping={dropping}
          onMove={move}
          render={(handle) => renderItem(item, index, handle)}
        />
      ))}
    </View>
  );
}

interface RowProps {
  index: number;
  count: number;
  label: string;
  activeIndex: SharedValue<number>;
  targetIndex: SharedValue<number>;
  offsetY: SharedValue<number>;
  rowHeight: SharedValue<number>;
  dropping: SharedValue<boolean>;
  onMove: (from: number, to: number) => void;
  render: (handle: React.ReactNode) => React.ReactNode;
}

function Row({
  index,
  count,
  label,
  activeIndex,
  targetIndex,
  offsetY,
  rowHeight,
  dropping,
  onMove,
  render,
}: RowProps) {
  const theme = useTheme();
  const screenScroll = useScreenScroll();

  const pickUp = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  const crossRow = () => Haptics.selectionAsync();

  const pan = Gesture.Pan()
    .activateAfterLongPress(150)
    // Outrank the surrounding scroll view, or a drag scrolls the screen at the
    // same time and the row lands short of where it was dropped. Gesture
    // Handler takes a ref to the native view here; its types only spell that
    // as a component type.
    .blocksExternalGesture(
      ...(screenScroll ? [screenScroll as unknown as React.RefObject<React.ComponentType>] : []),
    )
    .onStart(() => {
      activeIndex.value = index;
      targetIndex.value = index;
      offsetY.value = 0;
      runOnJS(pickUp)();
    })
    .onUpdate((event) => {
      const height = rowHeight.value || 1;
      // Clamped so the row can't be dragged out of the list's own bounds.
      offsetY.value = Math.min(
        Math.max(event.translationY, -index * height),
        (count - 1 - index) * height,
      );
      const next = index + Math.round(offsetY.value / height);
      if (next !== targetIndex.value) {
        targetIndex.value = next;
        runOnJS(crossRow)();
      }
    })
    .onEnd(() => {
      dropping.value = true;
      runOnJS(onMove)(index, targetIndex.value);
    })
    .onFinalize(() => {
      // On a drop, `move` clears the drag in the same tick as it reorders the
      // rows, so they are never painted in the new order with the old offsets.
      // Anything else — a cancelled or interrupted gesture — has to be cleared
      // here, or the row would be left hanging mid-drag.
      if (dropping.value) return;
      activeIndex.value = -1;
      targetIndex.value = -1;
      offsetY.value = 0;
    });

  const animatedStyle = useAnimatedStyle(() => {
    const from = activeIndex.value;

    if (from === index) {
      return {
        transform: [{ translateY: offsetY.value }, { scale: 1.02 }],
        zIndex: 2,
        elevation: 4,
        shadowOpacity: 0.16,
      };
    }

    let shift = 0;
    if (from !== -1) {
      const to = targetIndex.value;
      if (from < index && index <= to) shift = -rowHeight.value;
      else if (to <= index && index < from) shift = rowHeight.value;
    }

    return {
      transform: [{ translateY: withTiming(shift, SETTLE) }, { scale: 1 }],
      zIndex: 1,
      elevation: 0,
      shadowOpacity: 0,
    };
  });

  const onLayout = (event: LayoutChangeEvent) => {
    if (index === 0) rowHeight.value = event.nativeEvent.layout.height;
  };

  const handle = (
    <GestureDetector gesture={pan}>
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Reorder ${label}`}
        accessibilityHint="Touch and hold, then drag to move this row"
        accessibilityActions={[
          { name: 'moveUp', label: 'Move up' },
          { name: 'moveDown', label: 'Move down' },
        ]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'moveUp') onMove(index, index - 1);
          if (event.nativeEvent.actionName === 'moveDown') onMove(index, index + 1);
        }}
        hitSlop={8}
        style={styles.handle}>
        <SymbolView name="line.3.horizontal" size={17} tintColor={theme.muted} />
      </View>
    </GestureDetector>
  );

  return (
    <Animated.View
      onLayout={onLayout}
      style={[styles.row, { backgroundColor: theme.surface }, animatedStyle]}>
      {render(handle)}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  handle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
  },
});
