import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CAT } from '@/constants/categories';
import type { TimelineEvent } from '@/types';

interface ThinBlockProps {
  event: TimelineEvent;
  hourHeight: number;
  leftOffset: number;
  onPress?: () => void;
  targetBg?: string; // bg color of the activity block below
}

const OVERLAP = 10;
const PILL_H  = OVERLAP + 22;

function lighten(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.round(r + (255 - r) * factor).toString(16).padStart(2, '0');
  const lg = Math.round(g + (255 - g) * factor).toString(16).padStart(2, '0');
  const lb = Math.round(b + (255 - b) * factor).toString(16).padStart(2, '0');
  return `#${lr}${lg}${lb}`;
}

export function ThinBlock({ event, hourHeight, leftOffset, onPress, targetBg }: ThinBlockProps) {
  const c = CAT[event.cat];
  const top = event.end * hourHeight - PILL_H + OVERLAP;

  // Bottom color matches exactly the top-left of TimelineBlock (lighten(targetBg, 0.5))
  // so the two pills create a seamless gradient at the junction.
  const bgColors: [string, string] = [
    lighten(c.bg, 0.3),
    lighten(targetBg ?? c.bg, 0.5),
  ];

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
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
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
    overflow: 'hidden',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 8,
  },
  label: { fontSize: 11, fontWeight: '600', opacity: 0.85, flexShrink: 1 },
});
