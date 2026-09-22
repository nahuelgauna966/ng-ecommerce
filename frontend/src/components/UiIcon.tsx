import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { colors } from '../theme';

export type IconName =
  | 'menu'
  | 'close'
  | 'search'
  | 'user'
  | 'cart'
  | 'arrowLeft'
  | 'arrowRight'
  | 'products'
  | 'help'
  | 'desktop'
  | 'cpu'
  | 'gpu'
  | 'ram'
  | 'storage'
  | 'support';

const icons: Record<IconName, keyof typeof Ionicons.glyphMap> = {
  menu: 'menu-outline',
  close: 'close-outline',
  search: 'search-outline',
  user: 'person-outline',
  cart: 'cart-outline',
  arrowLeft: 'chevron-back-outline',
  arrowRight: 'chevron-forward-outline',
  products: 'cube-outline',
  help: 'help-circle-outline',
  desktop: 'desktop-outline',
  cpu: 'hardware-chip-outline',
  gpu: 'desktop-outline',
  ram: 'server-outline',
  storage: 'save-outline',
  support: 'headset-outline',
};

export default function UiIcon({
  name,
  color = colors.text,
  size = 23,
}: {
  name: IconName;
  color?: string;
  size?: number;
}) {
  return (
    <View style={[styles.iconBox, { height: size, width: size }]}>
      <Ionicons color={color} name={icons[name]} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
