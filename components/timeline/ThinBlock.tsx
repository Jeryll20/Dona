import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CAT } from '@/constants/categories';
import type { TimelineEvent } from '@/types';

interface ThinBlockProps {
  event: TimelineEvent;
  hourHeight: number;
  leftOffset: number;
  onPress?: () => void;
  targetInk?: string; // ink color of the activity block below, for gradient accent bar
}

const OVERLAP = 10; // pill dips into activity block to fill rounded-corner gaps
const PILL_H  = OVERLAP + 22; // 22px visible above the activity block

function lighten(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.round(r + (255 - r) * factor).toString(16).padStart(2, '0');
  const lg = Math.round(g + (255 - g) * factor).toString(16).padStart(2, '0');
  const lb = Math.round(b + (255 - b) * factor).toString(16).padStart(2, '0');
  return `#${lr}${lg}${lb}`;
}

export function ThinBlock({ event, hourHeight, leftOffset, onPress, targetInk }: ThinBlockProps) {
  const c = CAT[event.cat];
  const top = event.end * hourHeight - PILL_H + OVERLAP;
  const barColors: [string, string] = [c.ink, targetInk ?? c.ink];
  const bgColors: [string, string] = [lighten(c.bg, 0.5), c.bg];

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
      style={[styles.block, { top, left: leftOffset }]}
      accessibilityLabel={`${event.title}${event.dur ? ' · ' + event.dur : ''}`}
      accessibilityRole={onPress ? 'button' : 'none'}
    >
      <LinearGradient
        colors={bgColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={barColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.bar}
      />
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
  bar:   { width: 3, height: 12, borderRadius: 999, opacity: 0.6 },
  label: { fontSize: 11, fontWeight: '600', opacity: 0.85, flexShrink: 1 },
});
