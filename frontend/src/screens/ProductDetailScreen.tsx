import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '../context/AuthContext';
import { getErrorMessage, productsApi, type Product } from '../services/api';
import { useCartStore } from '../store/cartStore';
import { colors } from '../theme';
import RemoteProductImage from '../components/RemoteProductImage';

type AuthStackParamList = {
  ProductDetail: { id: number };
  Login: undefined;
};

type ProductDetailRoute = RouteProp<AuthStackParamList, 'ProductDetail'>;

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  currency: 'ARS',
  style: 'currency',
});

export default function ProductDetailScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { params } = useRoute<ProductDetailRoute>();
  const cartItem = useCartStore((state) =>
    state.items.find((item) => item.productId === params.id),
  );
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadProduct = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await productsApi.getById(params.id);
      setProduct(response.data);
      setQuantity(response.data.stock?.quantity ? 1 : 0);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  useEffect(() => {
    if (!feedback) {
      return;
    }
    const timeout = setTimeout(() => setFeedback(null), 2_500);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const handleAddToCart = () => {
    if (!user) {
      Alert.alert(
        'Iniciá sesión',
        'Necesitás iniciar sesión para agregar productos al carrito.',
        [
          { style: 'cancel', text: 'Cancelar' },
          { text: 'Iniciar sesión', onPress: () => navigation.navigate('Login') },
        ],
      );
      return;
    }

    if (product) {
      addItem(product, quantity);
      setFeedback('Producto agregado al carrito.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!product || error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'No se encontró el producto.'}</Text>
        <Pressable onPress={() => void loadProduct()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  const stock = product.stock?.quantity ?? 0;
  const isOutOfStock = stock === 0;
  const selectedQuantity = cartItem?.quantity ?? quantity;

  const changeQuantity = (nextQuantity: number) => {
    if (cartItem) {
      updateQuantity(product.id, nextQuantity);
      setFeedback(
        nextQuantity === 0
          ? 'Producto quitado del carrito.'
          : 'Cantidad actualizada en el carrito.',
      );
      return;
    }
    setQuantity(nextQuantity);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <RemoteProductImage
        accessibilityLabel={`Imagen de ${product.name}`}
        containerStyle={styles.image}
        uri={product.imageUrl}
      />

      <View style={styles.content}>
        <Text style={styles.category}>{product.category?.name ?? 'Sin categoría'}</Text>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>{currencyFormatter.format(Number(product.price))}</Text>

        <Text style={styles.sectionTitle}>Descripción</Text>
        <Text style={styles.description}>
          {product.description?.trim() || 'Este producto no tiene descripción.'}
        </Text>

        <Text style={styles.stock}>
          {isOutOfStock ? 'Sin stock' : `${stock} disponibles`}
        </Text>

        {!isOutOfStock && (
          <View style={styles.quantityRow}>
            <Text style={styles.quantityLabel}>
              {cartItem ? 'En tu carrito' : 'Cantidad'}
            </Text>
            <View style={styles.quantityControl}>
              <Pressable
                accessibilityLabel="Disminuir cantidad"
                disabled={!cartItem && selectedQuantity <= 1}
                onPress={() => changeQuantity(selectedQuantity - 1)}
                style={[
                  styles.quantityButton,
                  !cartItem && selectedQuantity <= 1 && styles.controlDisabled,
                ]}
              >
                <Text style={styles.quantityButtonText}>−</Text>
              </Pressable>
              <Text style={styles.quantity}>{selectedQuantity}</Text>
              <Pressable
                accessibilityLabel="Aumentar cantidad"
                disabled={selectedQuantity >= stock}
                onPress={() => changeQuantity(selectedQuantity + 1)}
                style={[
                  styles.quantityButton,
                  selectedQuantity >= stock && styles.controlDisabled,
                ]}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </Pressable>
            </View>
          </View>
        )}

        {feedback && <Text style={styles.feedback}>{feedback}</Text>}

        {!cartItem && (
          <Pressable
            disabled={isOutOfStock}
            onPress={handleAddToCart}
            style={[styles.addButton, isOutOfStock && styles.buttonDisabled]}
          >
            <Text style={styles.addButtonText}>
              {isOutOfStock ? 'Sin stock' : 'Agregar al carrito'}
            </Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: colors.background,
    paddingBottom: 32,
  },
  image: {
    height: 300,
    width: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    height: 300,
    justifyContent: 'center',
  },
  placeholderText: {
    color: colors.textSecondary,
  },
  content: {
    padding: 20,
  },
  category: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  name: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    marginTop: 6,
  },
  price: {
    color: colors.info,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 28,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },
  stock: {
    color: colors.success,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 24,
  },
  quantityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  quantityLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  quantityControl: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  quantityButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  controlDisabled: {
    opacity: 0.45,
  },
  quantityButtonText: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '600',
  },
  quantity: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 48,
    textAlign: 'center',
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.interactive,
    borderRadius: 8,
    marginTop: 32,
    padding: 16,
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
  },
  addButtonText: {
    color: colors.interactiveText,
    fontSize: 16,
    fontWeight: '700',
  },
  feedback: {
    color: colors.success,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 24,
    textAlign: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    padding: 10,
  },
  retryButtonText: {
    color: colors.info,
    fontSize: 16,
    fontWeight: '700',
  },
});
