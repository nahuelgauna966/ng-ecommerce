import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Product } from '../services/api';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

export default function ProductCard({ product, onPress }: ProductCardProps) {
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
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 12,
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
    backgroundColor: '#e5e7eb',
    height: 160,
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#6b7280',
  },
  content: {
    padding: 14,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
  },
  category: {
    color: '#6b7280',
    marginTop: 4,
  },
  price: {
    color: '#2563eb',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
});
