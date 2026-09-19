import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Product } from '../services/api';
import { useCartStore } from '../store/cartStore';
import { colors, radii } from '../theme';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

export default function ProductCard({ product, onPress }: ProductCardProps) {
  const quantity = useCartStore(
    (state) =>
      state.items.find((item) => item.productId === product.id)?.quantity ?? 0,
  );

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {product.imageUrl ? (
        <Image source={{ uri: product.imageUrl }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>Sin imagen</Text>
        </View>
      )}
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
    height: 160,
    width: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    height: 160,
    justifyContent: 'center',
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
  placeholderText: {
    color: colors.textSecondary,
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
