import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import type { Category } from '../services/api';
import { colors, radii, spacing } from '../theme';
import UiIcon, { type IconName } from './UiIcon';

export default function CategoryCard({
  category,
  onPress,
}: {
  category: Category;
  onPress: () => void;
}) {
  const { width } = useWindowDimensions();
  const cardSize = Math.min(Math.max((width - spacing.lg * 2 - spacing.sm * 3) / 4, 76), 96);

  return (
    <Pressable
      accessibilityLabel={`Ver categoría ${category.name}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, { height: cardSize, width: cardSize }, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        <UiIcon name={getCategoryIcon(category.name)} size={28} />
      </View>
      <Text numberOfLines={2} style={styles.label}>{category.name}</Text>
    </Pressable>
  );
}

function getCategoryIcon(name: string): IconName {
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  if (normalized.includes('proces')) return 'cpu';
  if (normalized.includes('placa') || normalized.includes('video') || normalized.includes('gpu') || normalized.includes('grafica') || normalized.includes('tarjeta')) return 'gpu';
  if (normalized.includes('memoria') || normalized.includes('ram')) return 'ram';
  if (normalized.includes('almacen') || normalized.includes('disco') || normalized.includes('ssd')) return 'storage';
  return 'products';
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.sm, borderWidth: 1, justifyContent: 'space-between', padding: spacing.xs },
  pressed: { opacity: 0.72 },
  iconWrap: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  label: { color: colors.text, fontSize: 10, lineHeight: 13, textAlign: 'center' },
});
