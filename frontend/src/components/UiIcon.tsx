import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

export type IconName =
  | 'menu'
  | 'close'
  | 'search'
  | 'user'
  | 'cart'
  | 'arrowRight'
  | 'products'
  | 'help'
  | 'desktop'
  | 'cpu'
  | 'gpu'
  | 'ram'
  | 'storage'
  | 'support';

const symbols: Record<IconName, string> = {
  menu: '☰',
  close: '×',
  search: '',
  user: '',
  cart: '',
  arrowRight: '›',
  products: '▦',
  help: '?',
  desktop: '▣',
  cpu: '▧',
  gpu: '▤',
  ram: '▥',
  storage: '◫',
  support: '▱',
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
  const ioniconName =
    name === 'search'
      ? 'search-outline'
      : name === 'user'
        ? 'person-outline'
        : name === 'cart'
          ? 'cart-outline'
          : null;

  if (ioniconName) {
    return (
      <View style={[styles.iconBox, { height: size, width: size }]}>
        <Ionicons color={color} name={ioniconName} size={size} />
      </View>
    );
  }

  return (
    <Text allowFontScaling={false} style={[styles.icon, { color, fontSize: size, lineHeight: size + 3 }]}>
      {symbols[name]}
    </Text>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontWeight: '400',
    textAlign: 'center',
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
