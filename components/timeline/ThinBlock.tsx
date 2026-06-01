import { StyleSheet, View, Text } from 'react-native';
import { FontSize } from '@/constants/typography';
import { Colors } from '@/constants/Colors';
import { CAT } from '@/constants/categories';
import type { TimelineEvent } from '@/types';

interface ThinBlockProps {
  event: TimelineEvent;
  hourHeight: number;
  leftOffset: number;
}

export function ThinBlock({ event, hourHeight, leftOffset }: ThinBlockProps) {
  const c = CAT[event.cat];
  const top    = event.start * hourHeight;
  const height = Math.max((event.end - event.start) * hourHeight, 16);

  return (
    <View
      style={[styles.block, { top: top + 2, height: height - 4, left: leftOffset }]}
      accessibilityLabel={`${event.title}${event.dur ? ' · ' + event.dur : ''}`}
    >
      <View style={[styles.bar, { backgroundColor: c.ink }]} />
      <Text style={[styles.title, { color: c.ink }]}>{event.title}</Text>
      {event.dur && <Text style={styles.dur}>· {event.dur}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    position: 'absolute',
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  bar:   { width: 4, alignSelf: 'stretch', borderRadius: 999, opacity: 0.5 },
  title: { fontSize: FontSize.sm, fontWeight: '600', opacity: 0.9 },
  dur:   { fontSize: FontSize.xs, color: Colors.light.ink3 },
});
