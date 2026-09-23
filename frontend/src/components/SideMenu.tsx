import { useEffect } from 'react';
import {
  BackHandler,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radii, spacing } from '../theme';
import UiIcon, { type IconName } from './UiIcon';

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
  onProducts: () => void;
}

export default function SideMenu({
  visible,
  onClose,
  onProducts,
}: SideMenuProps) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [onClose, visible]);

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.root}>
        <Pressable accessibilityLabel="Cerrar menú" onPress={onClose} style={styles.scrim} />
        <View style={[styles.drawer, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.topRow}>
            <Text style={styles.logo}>NG</Text>
            <Pressable accessibilityLabel="Cerrar menú" hitSlop={10} onPress={onClose} style={styles.closeButton}>
              <UiIcon name="close" size={27} />
            </Pressable>
          </View>

          <View style={styles.separator} />
          <MenuItem icon="products" label="Productos" onPress={onProducts} selected />
          <MenuItem icon="help" label="Ayuda" />
          <MenuItem icon="desktop" label="Armá tu PC" />
        </View>
      </View>
    </Modal>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  selected = false,
}: {
  icon: IconName;
  label: string;
  onPress?: () => void;
  selected?: boolean;
}) {
  const item = (
    <View style={[styles.menuItem, selected && styles.menuItemSelected]}>
      {selected && <View style={styles.selectedLine} />}
      <UiIcon name={icon} size={24} />
      <Text style={styles.menuLabel}>{label}</Text>
      <UiIcon name="arrowRight" color={colors.textSecondary} size={24} />
    </View>
  );

  if (!onPress) {
    return <View accessibilityState={{ disabled: true }}>{item}</View>;
  }

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {item}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  scrim: { backgroundColor: colors.overlay, flex: 1 },
  drawer: {
    backgroundColor: colors.background,
    borderRightColor: colors.border,
    borderRightWidth: StyleSheet.hairlineWidth,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: '80%',
  },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  logo: { color: colors.text, fontSize: 30, fontStyle: 'italic', fontWeight: '900', letterSpacing: -2 },
  closeButton: { padding: spacing.sm },
  separator: { backgroundColor: colors.border, height: StyleSheet.hairlineWidth },
  menuItem: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.lg, minHeight: 66, paddingHorizontal: spacing.lg, position: 'relative' },
  menuItemSelected: { backgroundColor: colors.surface },
  selectedLine: { backgroundColor: colors.text, borderBottomRightRadius: radii.sm, borderTopRightRadius: radii.sm, bottom: 12, left: 0, position: 'absolute', top: 12, width: 3 },
  menuLabel: { color: colors.text, flex: 1, fontSize: 16, fontWeight: '600' },
});
