import { View } from 'react-native';

interface TopSafeProps {
  h?: number;
}

// Dynamic Island / notch spacer — matches CLAUDE.md § TopSafe component
export function TopSafe({ h = 64 }: TopSafeProps) {
  return <View style={{ height: h }} />;
}
