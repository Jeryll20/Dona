import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { CAT } from '@/constants/categories';
import { Icon } from '@/components/ui/Icon';
import { Shadow } from '@/constants/spacing';
import type { TimelineEvent } from '@/types';

interface ThinBlockProps {
  event: TimelineEvent;
  hourHeight: number;
  leftOffset: number;
  onPress?: () => void;
}

const MIN_HEIGHT = 18;
const LINE_INDENT = 16; // dashed line offset from the blocks' left edge

/**
 * Commute rendered as a map-style itinerary: a vertical dotted line spanning
 * the travel time, with a small car + duration chip beside it. Detached from
 * the activity block — no color blending needed.
 */
export function ThinBlock({ event, hourHeight, leftOffset, onPress }: ThinBlockProps) {
  const C = useColors();
  const c = CAT[event.cat];
  const top    = event.start * hourHeight;
  const height = Math.max((event.end - event.start) * hourHeight, MIN_HEIGHT);
  const dotCount = Math.max(3, Math.round(height / 8));

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      disabled={!onPress}
      style={[styles.wrap, { top, height }]}
      accessibilityLabel={`${event.title}${event.dur ? ' · ' + event.dur : ''}`}
      accessibilityRole={onPress ? 'button' : 'none'}
    >
      {/* Chip lives in the left gutter so its vertical overflow on very short
          commutes never covers the surrounding activity blocks */}
      <View style={[styles.gutter, { width: leftOffset + LINE_INDENT - 6 }]}>
        <View style={[styles.chip, { backgroundColor: C.surface }]}>
          <Icon name="car" size={12} stroke={c.ink} sw={2} />
          {event.dur ? (
            <Text style={[styles.label, { color: c.ink }]} numberOfLines={1}>
              {event.dur}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.dots}>
        {Array.from({ length: dotCount }, (_, i) => (
          <View key={i} style={[styles.dot, { backgroundColor: c.ink }]} />
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 10,      // above activity blocks (rendered later in the tree)
    elevation: 10,   // Android equivalent
  },
  gutter: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  dots: {
    height: '100%',
    width: 4,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    opacity: 0.65,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    ...Shadow.sm,
  },
  label: { fontSize: 11, fontWeight: '600' },
});
