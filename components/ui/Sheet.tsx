import {
  StyleSheet,
  View,
  Text,
  Modal,
  Animated,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRef, useEffect } from 'react';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

const SLIDE_HEIGHT = 700;

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

// Bottom sheet modal — matches CLAUDE.md § Sheet component
export function Sheet({ open, onClose, title, children }: SheetProps) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(SLIDE_HEIGHT)).current;

  useEffect(() => {
    if (open) {
      anim.setValue(SLIDE_HEIGHT);
      Animated.spring(anim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        mass: 0.9,
        stiffness: 200,
      }).start();
    } else {
      Animated.timing(anim, {
        toValue: SLIDE_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [open]);

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} accessibilityLabel="Fermer" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.View
            style={[
              styles.sheet,
              { transform: [{ translateY: anim }], paddingBottom: insets.bottom + Spacing.lg },
            ]}
          >
            <View style={styles.handle} />
            {title && (
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Fermer">
                  <Text style={styles.closeX}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            {children}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.hairline,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.light.ink,
    letterSpacing: -0.4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surfaceSunk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeX: {
    fontSize: 13,
    color: Colors.light.ink2,
    fontWeight: '600',
  },
});
