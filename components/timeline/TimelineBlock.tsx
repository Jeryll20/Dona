import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { CAT } from '@/constants/categories';
import type { TimelineEvent } from '@/types';

interface TimelineBlockProps {
  event: TimelineEvent;
  hourHeight: number;
  leftOffset: number;
  onPress?: () => void;
  topBarColor?: string; // ink color of a preceding ThinBlock, triggers accent bar
}

function fmtHour(h: number) {
  const hh = Math.floor(h) % 24;
  const mm = Math.round((h - Math.floor(h)) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function TimelineBlock({ event, hourHeight, leftOffset, onPress, topBarColor }: TimelineBlockProps) {
  const c = event.color ?? CAT[event.cat];
  const top    = event.start * hourHeight;
  const height = Math.max((event.end - event.start) * hourHeight, 16);

  const isSmall  = height < 32;
  const isMedium = height < 52;

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
      style={[
        styles.block,
        { top, height, left: leftOffset, backgroundColor: c.bg },
        isSmall && styles.blockSmall,
      ]}
      accessibilityLabel={`${event.title}, ${fmtHour(event.start)} à ${fmtHour(event.end)}`}
      accessibilityRole={onPress ? 'button' : 'none'}
    >
      {topBarColor !== undefined && (
        <LinearGradient
          colors={[topBarColor, c.ink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.topBar}
        />
      )}
      <Text
        style={[styles.title, { color: c.ink }, isSmall && styles.titleSmall]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {event.title}
      </Text>
      {!isMedium && (
        <Text style={[styles.time, { color: c.ink }]}>
          {fmtHour(event.start)} – {fmtHour(event.end)}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  block: {
    position: 'absolute',
    right: 4,
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  topBar: {
    position: 'absolute',
    left: 4,
    top: 6,
    width: 3,
    height: 22,
    borderRadius: 999,
    opacity: 0.55,
  },
  blockSmall: {
    paddingVertical: 3,
    borderRadius: 10,
  },
  title:      { fontSize: FontSize.base, fontWeight: '700', letterSpacing: -0.2 },
  titleSmall: { fontSize: FontSize.sm },
  time:       { fontSize: FontSize.sm, fontWeight: '600', opacity: 0.78, marginTop: 3 },
});
