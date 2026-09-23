import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import type { Product } from '../services/api';
import { useCartStore } from '../store/cartStore';
import { colors, radii } from '../theme';
import RemoteProductImage from './RemoteProductImage';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

export default function ProductCard({ product, onPress }: ProductCardProps) {
  const { width } = useWindowDimensions();
  const quantity = useCartStore(
    (state) =>
      state.items.find((item) => item.productId === product.id)?.quantity ?? 0,
  );
  const imageHeight = Math.min(Math.max((width - 32) * 0.56, 160), 240);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <RemoteProductImage
        accessibilityLabel={`Imagen de ${product.name}`}
        containerStyle={[styles.image, { height: imageHeight }]}
        uri={product.imageUrl}
      />
      {quantity > 0 && (
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>{quantity} en carrito</Text>
        </View>
      )}
      <View style={styles.content}>
        <Text numberOfLines={2} style={styles.name}>
          {product.name}
        </Text>
        <Text style={styles.category}>{product.category?.name ?? 'Sin categoría'}</Text>
        <Text style={styles.price}>${Number(product.price).toFixed(2)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 12,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.75,
  },
  image: {
    width: '100%',
  },
  cartBadge: {
    backgroundColor: colors.text,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    position: 'absolute',
    right: 10,
    top: 10,
  },
  cartBadgeText: {
    color: colors.inverseText,
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    padding: 14,
  },
  name: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  category: {
    color: colors.textSecondary,
    marginTop: 4,
  },
  price: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
});
