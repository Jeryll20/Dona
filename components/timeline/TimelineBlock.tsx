import { StyleSheet, View, Text } from 'react-native';
import { Spacing } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { CAT } from '@/constants/categories';
import type { TimelineEvent } from '@/types';

interface TimelineBlockProps {
  event: TimelineEvent;
  hourHeight: number;
  leftOffset: number;
}

function fmtHour(h: number) {
  const hh = Math.floor(h) % 24;
  const mm = Math.round((h - Math.floor(h)) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function TimelineBlock({ event, hourHeight, leftOffset }: TimelineBlockProps) {
  const c = CAT[event.cat];
  const top    = event.start * hourHeight;
  const height = Math.max((event.end - event.start) * hourHeight, 16);

  return (
    <View
      style={[styles.block, { top, height, left: leftOffset, backgroundColor: c.bg }]}
      accessibilityLabel={`${event.title}, ${fmtHour(event.start)} à ${fmtHour(event.end)}`}
    >
      <Text style={[styles.title, { color: c.ink }]}>{event.title}</Text>
      {height > 44 && (
        <Text style={[styles.time, { color: c.ink }]}>
          {fmtHour(event.start)} – {fmtHour(event.end)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    position: 'absolute',
    right: 4,
    borderRadius: 16,
    padding: Spacing.md,
    overflow: 'hidden',
  },
  title: { fontSize: FontSize.base, fontWeight: '700', letterSpacing: -0.2 },
  time:  { fontSize: FontSize.sm, fontWeight: '600', opacity: 0.78, marginTop: 3 },
});
