import { Pressable, StyleSheet, Text, View } from 'react-native';

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
  return (
    <Pressable
      accessibilityLabel={`Ver categoría ${category.name}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        <UiIcon name={getCategoryIcon(category.name)} size={30} />
      </View>
      <Text numberOfLines={2} style={styles.label}>{category.name}</Text>
    </Pressable>
  );
}

function getCategoryIcon(name: string): IconName {
  const normalized = name.toLowerCase();
  if (normalized.includes('proces')) return 'cpu';
  if (normalized.includes('placa') || normalized.includes('video') || normalized.includes('gpu')) return 'gpu';
  if (normalized.includes('memoria') || normalized.includes('ram')) return 'ram';
  if (normalized.includes('almacen') || normalized.includes('disco') || normalized.includes('ssd')) return 'storage';
  return 'products';
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.sm, borderWidth: 1, height: 92, justifyContent: 'space-between', padding: spacing.sm, width: 88 },
  pressed: { opacity: 0.72 },
  iconWrap: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  label: { color: colors.text, fontSize: 11, lineHeight: 14, textAlign: 'center' },
});
