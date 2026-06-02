import Svg, { G, Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import { Colors } from '@/constants/Colors';

export type IconName =
  | 'today' | 'list' | 'profile' | 'arrow' | 'back' | 'plus' | 'check' | 'x'
  | 'chevdown' | 'chevright' | 'moon' | 'fork' | 'run' | 'car' | 'target'
  | 'spark' | 'cycle' | 'clock' | 'edit' | 'calendar' | 'book' | 'palette' | 'chat';

interface IconProps {
  name: IconName;
  size?: number;
  stroke?: string;
  sw?: number;
}

const ICONS: Record<IconName, React.ReactNode> = {
  today: (
    <>
      <Rect x="3" y="4" width="18" height="18" rx="2" />
      <Line x1="16" y1="2" x2="16" y2="6" />
      <Line x1="8" y1="2" x2="8" y2="6" />
      <Line x1="3" y1="10" x2="21" y2="10" />
      <Circle cx="9" cy="15" r="1" />
    </>
  ),
  list: (
    <>
      <Line x1="3" y1="6" x2="21" y2="6" />
      <Line x1="3" y1="12" x2="21" y2="12" />
      <Line x1="3" y1="18" x2="21" y2="18" />
    </>
  ),
  profile: (
    <>
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </>
  ),
  arrow: (
    <>
      <Line x1="5" y1="12" x2="19" y2="12" />
      <Polyline points="13 6 19 12 13 18" />
    </>
  ),
  back: (
    <>
      <Line x1="19" y1="12" x2="5" y2="12" />
      <Polyline points="11 18 5 12 11 6" />
    </>
  ),
  plus: (
    <>
      <Line x1="12" y1="5" x2="12" y2="19" />
      <Line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  check: <Polyline points="20 6 9 17 4 12" />,
  x: (
    <>
      <Line x1="18" y1="6" x2="6" y2="18" />
      <Line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
  chevdown: <Polyline points="6 9 12 15 18 9" />,
  chevright: <Polyline points="9 6 15 12 9 18" />,
  moon: <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  fork: (
    <>
      <Path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <Line x1="7" y1="2" x2="7" y2="22" />
      <Path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
    </>
  ),
  run: (
    <>
      <Circle cx="13" cy="4" r="2" />
      <Path d="M7 21l3.5-9.5 3.5 3.5 2.5-7" />
      <Path d="M12.5 7L16 5" />
      <Path d="M10.5 11.5L7 14" />
    </>
  ),
  car: (
    <>
      <Path d="M5 17H3v-5l4-6h10l4 6v5h-2" />
      <Circle cx="7.5" cy="17" r="2" />
      <Circle cx="16.5" cy="17" r="2" />
      <Path d="M9.5 17h5" />
    </>
  ),
  target: (
    <>
      <Circle cx="12" cy="12" r="10" />
      <Circle cx="12" cy="12" r="6" />
      <Circle cx="12" cy="12" r="2" />
    </>
  ),
  spark: <Path d="M13 2L3 13h8l-2 9 10-11h-8l2-9z" />,
  chat: <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  cycle: (
    <>
      <Polyline points="23 4 23 10 17 10" />
      <Polyline points="1 20 1 14 7 14" />
      <Path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </>
  ),
  clock: (
    <>
      <Circle cx="12" cy="12" r="10" />
      <Polyline points="12 6 12 12 16 14" />
    </>
  ),
  edit: (
    <>
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </>
  ),
  calendar: (
    <>
      <Rect x="3" y="4" width="18" height="18" rx="2" />
      <Line x1="16" y1="2" x2="16" y2="6" />
      <Line x1="8" y1="2" x2="8" y2="6" />
      <Line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  book: (
    <>
      <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
  palette: (
    <>
      <Path d="M12 2a10 10 0 0 1 10 10 5 5 0 0 1-5 5h-2.5a2.5 2.5 0 0 0 0 5A2.5 2.5 0 0 1 12 24 10 10 0 0 1 2 14 10 10 0 0 1 12 2z" />
      <Circle cx="8.5" cy="8.5" r="1.5" />
      <Circle cx="15.5" cy="8.5" r="1.5" />
      <Circle cx="17" cy="13" r="1.5" />
      <Circle cx="12" cy="6.5" r="1.5" />
    </>
  ),
};

export function Icon({ name, size = 24, stroke = Colors.light.ink, sw = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {ICONS[name]}
      </G>
    </Svg>
  );
}
