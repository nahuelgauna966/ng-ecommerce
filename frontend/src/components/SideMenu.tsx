import { useEffect, useState } from 'react';
import {
  BackHandler,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usersApi } from '../services/api';
import { colors, radii, spacing } from '../theme';
import UiIcon, { type IconName } from './UiIcon';

interface SideMenuProps {
  visible: boolean;
  user: { email: string } | null;
  onClose: () => void;
  onProducts: () => void;
  onLogin: () => void;
  onRegister: () => void;
  onProfile: () => void;
  onOrders: () => void;
  onLogout: () => void;
}

export default function SideMenu({
  visible,
  user,
  onClose,
  onProducts,
  onLogin,
  onRegister,
  onProfile,
  onOrders,
  onLogout,
}: SideMenuProps) {
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    if (!visible || !user) {
      setDisplayName(null);
      return () => {
        isActive = false;
      };
    }

    setDisplayName(null);
    void usersApi.getMe().then(({ data }) => {
      if (isActive) setDisplayName(data.name);
    }).catch(() => {
      if (isActive) setDisplayName(null);
    });

    return () => {
      isActive = false;
    };
  }, [user, visible]);

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
          {user ? (
            <View accessibilityLabel={`Sesión iniciada como ${displayName ?? user.email}`} style={styles.accountCard}>
              <View style={styles.accountAvatar}><UiIcon name="user" size={22} /></View>
              <View style={styles.accountCopy}>
                <Text numberOfLines={1} style={styles.accountName}>{displayName ?? user.email}</Text>
                {displayName ? <Text numberOfLines={1} style={styles.accountEmail}>{user.email}</Text> : null}
              </View>
            </View>
          ) : (
            <View style={styles.guestCard}>
              <Text style={styles.guestTitle}>Tu próxima compra empieza acá</Text>
              <Text style={styles.guestDescription}>Ingresá o creá una cuenta para acceder a tus pedidos y perfil.</Text>
            </View>
          )}
          <MenuItem accessibilityLabel="Ver productos" icon="products" label="Productos" onPress={onProducts} selected />
          {user ? (
            <>
              <MenuItem accessibilityLabel="Ver mi perfil" icon="user" label="Mi perfil" onPress={onProfile} />
              <MenuItem accessibilityLabel="Ver mis pedidos" icon="orders" label="Mis pedidos" onPress={onOrders} />
              <MenuItem accessibilityLabel="Cerrar sesión" icon="logout" label="Cerrar sesión" onPress={onLogout} />
            </>
          ) : (
            <>
              <MenuItem accessibilityLabel="Crear una cuenta" icon="register" label="Crear cuenta" onPress={onRegister} />
              <MenuItem accessibilityLabel="Iniciar sesión" icon="login" label="Iniciar sesión" onPress={onLogin} />
            </>
          )}
          <MenuItem accessibilityLabel="Ayuda, próximamente disponible" icon="help" label="Ayuda" />
          <MenuItem accessibilityLabel="Armá tu PC, próximamente disponible" icon="desktop" label="Armá tu PC" />
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
  accessibilityLabel,
}: {
  icon: IconName;
  label: string;
  accessibilityLabel: string;
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
    return <View accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled: true }}>{item}</View>;
  }

  return (
    <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole="button" onPress={onPress}>
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
  accountCard: { alignItems: 'center', backgroundColor: colors.surface, flexDirection: 'row', gap: spacing.md, margin: spacing.md, padding: spacing.md, borderRadius: radii.md },
  accountAvatar: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 24, height: 44, justifyContent: 'center', width: 44 },
  accountCopy: { flex: 1 },
  accountName: { color: colors.text, fontSize: 14, fontWeight: '700' },
  accountEmail: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  guestCard: { backgroundColor: colors.surface, margin: spacing.md, padding: spacing.md, borderRadius: radii.md },
  guestTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  guestDescription: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: spacing.xs },
  menuItem: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.lg, minHeight: 66, paddingHorizontal: spacing.lg, position: 'relative' },
  menuItemSelected: { backgroundColor: colors.surface },
  selectedLine: { backgroundColor: colors.text, borderBottomRightRadius: radii.sm, borderTopRightRadius: radii.sm, bottom: 12, left: 0, position: 'absolute', top: 12, width: 3 },
  menuLabel: { color: colors.text, flex: 1, fontSize: 16, fontWeight: '600' },
});
