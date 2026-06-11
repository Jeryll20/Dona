import { StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedProps, useDerivedValue,
  withTiming, runOnJS,
} from 'react-native-reanimated';

// Text driven from the UI thread (live time while dragging, no re-renders)
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
import { Spacing } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';
import { CAT } from '@/constants/categories';
import { Icon } from '@/components/ui/Icon';
import type { TimelineEvent } from '@/types';

interface TimelineBlockProps {
  event:       TimelineEvent;
  hourHeight:  number;
  leftOffset:  number;
  onPress?:    () => void;
  onLongPress?: () => void;
  // When provided, the block can be dragged vertically after a long press —
  // releasing commits the snapped delta (in minutes) as a one-day override
  onMoveCommit?: (deltaMinutes: number) => void;
  onDragActive?: (active: boolean) => void; // lets the parent lock its scroll
  completion?: 'done' | 'skipped' | null;
}

const SNAP_MINUTES      = 5;
const DRAG_THRESHOLD_PX = 6; // under this, a hold-and-release is a long press

function fmtHour(h: number) {
  const hh = Math.floor(h) % 24;
  const mm = Math.round((h - Math.floor(h)) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function lighten(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.round(r + (255 - r) * factor).toString(16).padStart(2, '0');
  const lg = Math.round(g + (255 - g) * factor).toString(16).padStart(2, '0');
  const lb = Math.round(b + (255 - b) * factor).toString(16).padStart(2, '0');
  return `#${lr}${lg}${lb}`;
}

export function TimelineBlock({
  event, hourHeight, leftOffset, onPress, onLongPress, onMoveCommit, onDragActive, completion,
}: TimelineBlockProps) {
  const C = useColors();
  const s = makeStyles(C);
  const c = event.color ?? CAT[event.cat];
  const top    = event.start * hourHeight;
  const height = Math.max((event.end - event.start) * hourHeight, 16);

  const isSmall  = height < 32;
  const isMedium = height < 52;

  const bgLight = lighten(c.bg, 0.5);
  const gradColors: [string, string] = [bgLight, c.bg];

  const isSkipped = completion === 'skipped';

  // ── Drag state ────────────────────────────────────────────────────────────
  const translateY = useSharedValue(0);
  const dragging   = useSharedValue(false);

  function commitMove(deltaMinutes: number) {
    onMoveCommit?.(deltaMinutes);
    // The committed override re-renders the block at its new `top` —
    // drop the gesture translation in the same JS batch
    translateY.value = 0;
  }

  function notifyDrag(active: boolean) {
    onDragActive?.(active);
  }

  const pan = Gesture.Pan()
    .enabled(!!onMoveCommit)
    .activateAfterLongPress(450)
    .onStart(() => {
      dragging.value = true;
      runOnJS(notifyDrag)(true);
    })
    .onUpdate((e) => {
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      const pxPerMin = hourHeight / 60;
      const deltaMin = Math.round(e.translationY / pxPerMin / SNAP_MINUTES) * SNAP_MINUTES;
      if (Math.abs(e.translationY) < DRAG_THRESHOLD_PX || deltaMin === 0) {
        // Held in place → existing long-press behavior (completion sheet)
        translateY.value = withTiming(0, { duration: 120 });
        if (onLongPress) runOnJS(onLongPress)();
      } else {
        translateY.value = deltaMin * pxPerMin; // snap to the 5-min grid
        runOnJS(commitMove)(deltaMin);
      }
    })
    .onFinalize(() => {
      dragging.value = false;
      runOnJS(notifyDrag)(false);
    });

  const tap = Gesture.Tap()
    .enabled(!!onPress)
    .maxDuration(300)
    .onEnd(() => {
      if (onPress) runOnJS(onPress)();
    });

  const gesture = Gesture.Race(pan, tap);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: withTiming(dragging.value ? 1.03 : 1, { duration: 120 }) },
    ],
    zIndex:  dragging.value ? 20 : 0,
    opacity: dragging.value ? 0.92 : isSkipped ? 0.55 : 1,
  }));

  // Live snapped time range shown in a floating chip while dragging
  const dragTimeLabel = useDerivedValue(() => {
    const pxPerMin = hourHeight / 60;
    const deltaMin = Math.round(translateY.value / pxPerMin / SNAP_MINUTES) * SNAP_MINUTES;
    const startMin = Math.round(event.start * 60) + deltaMin;
    const endMin   = Math.round(event.end * 60) + deltaMin;
    const fmt = (m: number) => {
      const hh = Math.max(0, Math.floor(m / 60)) % 24;
      const mm = ((m % 60) + 60) % 60;
      return `${hh < 10 ? '0' : ''}${hh}:${mm < 10 ? '0' : ''}${mm}`;
    };
    return `${fmt(startMin)} – ${fmt(endMin)}`;
  });

  const dragChipProps = useAnimatedProps(() => ({
    text: dragTimeLabel.value,
  } as never));

  const dragChipStyle = useAnimatedStyle(() => ({
    opacity: withTiming(dragging.value ? 1 : 0, { duration: 100 }),
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[s.wrap, { top, height, left: leftOffset }, animStyle]}
        accessible
        accessibilityLabel={`${event.title}, ${fmtHour(event.start)} à ${fmtHour(event.end)}`}
        accessibilityRole={onPress ? 'button' : 'none'}
        accessibilityHint={onMoveCommit ? 'Maintiens puis glisse pour déplacer' : undefined}
      >
        {/* Live time chip floating above the block while dragging */}
        {onMoveCommit && (
          <Animated.View style={[s.dragChip, { backgroundColor: C.surface }, dragChipStyle]} pointerEvents="none">
            <AnimatedTextInput
              animatedProps={dragChipProps}
              defaultValue={`${fmtHour(event.start)} – ${fmtHour(event.end)}`}
              editable={false}
              style={[s.dragChipText, { color: C.primaryStrong }]}
            />
          </Animated.View>
        )}

        <View style={[s.block, isSmall && s.blockSmall]}>
          <LinearGradient
            colors={gradColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <Text
            style={[s.title, { color: c.ink }, isSmall && s.titleSmall, isSkipped && s.textSkipped]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {event.title}
          </Text>
          {!isMedium && (
            <Text style={[s.time, { color: c.ink }, isSkipped && s.textSkipped]}>
              {fmtHour(event.start)} – {fmtHour(event.end)}
            </Text>
          )}

          {/* Completion badge */}
          {completion != null && !isSmall && (
            <View style={[s.badge, completion === 'done' ? s.badgeDone : s.badgeSkipped]}>
              <Icon
                name={completion === 'done' ? 'check' : 'x'}
                size={10}
                stroke={completion === 'done' ? C.mealInk : C.ink2}
                sw={2.5}
              />
            </View>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    // Outer wrapper: position + drag transform — no overflow clipping so the
    // floating time chip can sit above the block
    wrap: {
      position: 'absolute',
      right:    4,
    },
    block: {
      flex:            1,
      borderRadius:    16,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      overflow:        'hidden',
      justifyContent:  'center',
    },
    blockSmall: {
      paddingVertical: 3,
      borderRadius:    10,
    },
    dragChip: {
      position:     'absolute',
      top:          -26,
      alignSelf:    'center',
      paddingHorizontal: 10,
      paddingVertical:   2,
      borderRadius: 999,
      zIndex:       30,
      shadowColor:  '#2E2048',
      shadowOpacity: 0.18,
      shadowRadius:  8,
      shadowOffset:  { width: 0, height: 2 },
      elevation:     6,
    },
    dragChipText: {
      fontSize:   FontSize.sm,
      fontWeight: '700',
      padding:    0, // TextInput default padding off
    },
    title:      { fontSize: FontSize.base, fontWeight: '700', letterSpacing: -0.2 },
    titleSmall: { fontSize: FontSize.sm },
    time:       { fontSize: FontSize.sm, fontWeight: '600', opacity: 0.78, marginTop: 3 },
    textSkipped: { textDecorationLine: 'line-through' },
    badge: {
      position:     'absolute',
      top:          6,
      right:        8,
      width:        18,
      height:       18,
      borderRadius: 9,
      alignItems:   'center',
      justifyContent: 'center',
    },
    badgeDone:    { backgroundColor: '#C8F0D4' },
    badgeSkipped: { backgroundColor: C.surfaceSunk },
  });
}
