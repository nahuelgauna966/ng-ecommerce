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
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '../context/AuthContext';
import { getErrorMessage, productsApi, type Product } from '../services/api';

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
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const actionDisabled = isOutOfStock || Boolean(user);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {product.imageUrl ? (
        <Image source={{ uri: product.imageUrl }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>Sin imagen</Text>
        </View>
      )}

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
            <Text style={styles.quantityLabel}>Cantidad</Text>
            <View style={styles.quantityControl}>
              <Pressable
                accessibilityLabel="Disminuir cantidad"
                disabled={quantity <= 1}
                onPress={() => setQuantity((current) => current - 1)}
                style={[styles.quantityButton, quantity <= 1 && styles.controlDisabled]}
              >
                <Text style={styles.quantityButtonText}>−</Text>
              </Pressable>
              <Text style={styles.quantity}>{quantity}</Text>
              <Pressable
                accessibilityLabel="Aumentar cantidad"
                disabled={quantity >= stock}
                onPress={() => setQuantity((current) => current + 1)}
                style={[
                  styles.quantityButton,
                  quantity >= stock && styles.controlDisabled,
                ]}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </Pressable>
            </View>
          </View>
        )}

        <Pressable
          disabled={actionDisabled}
          onPress={handleAddToCart}
          style={[styles.addButton, actionDisabled && styles.buttonDisabled]}
        >
          <Text style={styles.addButtonText}>
            {isOutOfStock
              ? 'Sin stock'
              : user
                ? 'Carrito disponible próximamente'
                : 'Agregar al carrito'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    paddingBottom: 32,
  },
  image: {
    height: 300,
    width: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
    height: 300,
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#6b7280',
  },
  content: {
    padding: 20,
  },
  category: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '600',
  },
  name: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 6,
  },
  price: {
    color: '#2563eb',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 28,
  },
  description: {
    color: '#4b5563',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },
  stock: {
    color: '#15803d',
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
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  quantityControl: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  quantityButton: {
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  controlDisabled: {
    opacity: 0.45,
  },
  quantityButtonText: {
    color: '#111827',
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
    backgroundColor: '#2563eb',
    borderRadius: 8,
    marginTop: 32,
    padding: 16,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    padding: 10,
  },
  retryButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '700',
  },
});
