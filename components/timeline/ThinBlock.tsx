import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { CAT } from '@/constants/categories';
import type { TimelineEvent } from '@/types';

interface ThinBlockProps {
  event: TimelineEvent;
  hourHeight: number;
  leftOffset: number;
  onPress?: () => void;
}

const PILL_H  = 20;
const OVERLAP = 10; // pill dips into activity block to fill rounded-corner gaps

export function ThinBlock({ event, hourHeight, leftOffset, onPress }: ThinBlockProps) {
  const c = CAT[event.cat];
  const top = event.end * hourHeight - PILL_H + OVERLAP;

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
      style={[styles.block, { top, left: leftOffset, backgroundColor: c.bg }]}
      accessibilityLabel={`${event.title}${event.dur ? ' · ' + event.dur : ''}`}
      accessibilityRole={onPress ? 'button' : 'none'}
    >
      <View style={[styles.bar, { backgroundColor: c.ink }]} />
      <Text style={[styles.label, { color: c.ink }]} numberOfLines={1}>
        {event.title}{event.dur ? `  ·  ${event.dur}` : ''}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  block: {
    position: 'absolute',
    right: 4,
    height: PILL_H,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 6,
    paddingLeft: 4,
  },
  bar:   { width: 3, height: 12, borderRadius: 999, opacity: 0.55 },
  label: { fontSize: 11, fontWeight: '600', opacity: 0.85, flexShrink: 1 },
});
