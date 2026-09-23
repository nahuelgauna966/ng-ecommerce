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

const icons: Record<Exclude<IconName, 'gpu'>, keyof typeof Ionicons.glyphMap> = {
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
  if (name === 'gpu') {
    return <GpuIcon color={color} size={size} />;
  }

  return (
    <View style={[styles.iconBox, { height: size, width: size }]}>
      <Ionicons color={color} name={icons[name]} size={size} />
    </View>
  );
}

function GpuIcon({ color, size }: { color: string; size: number }) {
  const fanSize = size * 0.28;

  return (
    <View style={[styles.iconBox, { height: size, width: size }]}>
      <View style={[styles.gpuBody, { borderColor: color, height: size * 0.54, width: size * 0.84 }]}>
        <View style={[styles.gpuFan, { borderColor: color, height: fanSize, width: fanSize }]} />
        <View style={[styles.gpuFan, { borderColor: color, height: fanSize, width: fanSize }]} />
      </View>
      <View style={[styles.gpuConnector, { backgroundColor: color, height: size * 0.24 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpuBody: { alignItems: 'center', borderRadius: 2, borderWidth: 1.5, flexDirection: 'row', justifyContent: 'space-evenly' },
  gpuFan: { borderRadius: 99, borderWidth: 1.4 },
  gpuConnector: { borderRadius: 1, position: 'absolute', right: 0, width: 2 },
});
