import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { useCartStore } from '../store/cartStore';
import { colors, spacing } from '../theme';
import SideMenu from './SideMenu';
import UiIcon from './UiIcon';

interface AppHeaderProps {
  navigation: NavigationProp<ParamListBase>;
  showBack?: boolean;
}

export default function AppHeader({ navigation, showBack = false }: AppHeaderProps) {
  const { user } = useAuth();
  const totalItems = useCartStore((state) => state.totalItems());
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const openCatalogSearch = () => {
    navigation.navigate('Catalog', { focusSearch: true });
  };

  return (
    <>
      <View style={styles.header}>
        {showBack ? (
          <Pressable accessibilityLabel="Volver" hitSlop={8} onPress={() => navigation.goBack()} style={styles.iconButton}>
            <UiIcon name="arrowLeft" size={25} />
          </Pressable>
        ) : (
          <Pressable accessibilityLabel="Abrir menú" hitSlop={8} onPress={() => setIsMenuOpen(true)} style={styles.iconButton}>
            <UiIcon name="menu" size={25} />
          </Pressable>
        )}
        <Pressable accessibilityLabel="Ir al inicio" onPress={() => navigation.navigate('Home')} style={styles.logoButton}>
          <Text style={styles.logo}>NG</Text>
        </Pressable>
        <View style={styles.actions}>
          <Pressable accessibilityLabel="Buscar productos" hitSlop={8} onPress={openCatalogSearch} style={styles.iconButton}>
            <UiIcon name="search" size={20} />
          </Pressable>
          <Pressable accessibilityLabel={user ? 'Ver perfil' : 'Iniciar sesión'} hitSlop={8} onPress={() => navigation.navigate(user ? 'Profile' : 'Login')} style={styles.iconButton}>
            <UiIcon name="user" size={20} />
          </Pressable>
          <Pressable accessibilityLabel={`Carrito con ${totalItems} productos`} hitSlop={8} onPress={() => navigation.navigate('Cart')} style={styles.iconButton}>
            <UiIcon name="cart" size={22} />
            {totalItems > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{totalItems > 99 ? '99+' : totalItems}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
      <SideMenu
        onClose={() => setIsMenuOpen(false)}
        onProducts={() => {
          setIsMenuOpen(false);
          navigation.navigate('Catalog');
        }}
        visible={isMenuOpen}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', backgroundColor: colors.background, borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', height: 58, paddingHorizontal: spacing.sm },
  iconButton: { alignItems: 'center', justifyContent: 'center', minHeight: 40, minWidth: 38, padding: spacing.xs, position: 'relative' },
  logoButton: { marginLeft: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  logo: { color: colors.text, fontSize: 27, fontStyle: 'italic', fontWeight: '900', letterSpacing: -2 },
  actions: { alignItems: 'center', flexDirection: 'row', marginLeft: 'auto' },
  badge: { alignItems: 'center', backgroundColor: colors.text, borderColor: colors.background, borderRadius: 9, borderWidth: 1, justifyContent: 'center', minWidth: 17, paddingHorizontal: 3, position: 'absolute', right: 0, top: 1 },
  badgeText: { color: colors.inverseText, fontSize: 9, fontWeight: '800' },
});
