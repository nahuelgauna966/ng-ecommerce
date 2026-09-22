import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStripe } from '@stripe/stripe-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getErrorMessage, ordersApi, paymentsApi } from '../services/api';
import { useCartStore } from '../store/cartStore';

type CustomerStackParamList = {
  Cart: undefined;
  MyOrders: undefined;
  PaymentError: {
    clientSecret: string | null;
    message: string;
    orderId: number;
    total: string;
  };
  PaymentSuccess: { orderId: number; total: string };
};

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  currency: 'ARS',
  style: 'currency',
});

export default function CheckoutScreen() {
  const navigation = useNavigation<
    NativeStackNavigationProp<CustomerStackParamList>
  >();
  const items = useCartStore((state) => state.items);
  const totalPrice = useCartStore((state) => state.totalPrice());
  const clearCart = useCartStore((state) => state.clearCart);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payForOrder = async (
    orderId: number,
    orderTotal: string,
  ) => {
    setError(null);
    setIsSubmitting(true);
    let clientSecret: string | null = null;

    try {
      clientSecret = (await paymentsApi.create({ orderId })).data.clientSecret;

      if (!clientSecret) {
        throw new Error('No se pudo iniciar el pago. Intentá nuevamente.');
      }

      const { error: initializationError } = await initPaymentSheet({
        merchantDisplayName: 'ng-ecommerce',
        paymentIntentClientSecret: clientSecret,
        returnURL: 'ng-ecommerce://payment-success',
      });
      if (initializationError) {
        throw new Error(initializationError.message);
      }

      const { error: paymentError } = await presentPaymentSheet();
      if (paymentError) {
        throw new Error(paymentError.message);
      }

      clearCart();
      navigation.replace('PaymentSuccess', { orderId, total: orderTotal ?? '0' });
    } catch (requestError) {
      navigation.replace('PaymentError', {
        clientSecret,
        message: requestError instanceof Error ? requestError.message : getErrorMessage(requestError),
        orderId,
        total: orderTotal,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmOrder = async () => {
    if (items.length === 0 || isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const response = await ordersApi.create({
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });
      await payForOrder(response.data.id, response.data.total);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay productos para confirmar.</Text>
        <Pressable onPress={() => navigation.navigate('Cart')} style={styles.backButton}>
          <Text style={styles.backButtonText}>Volver al carrito</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Resumen del pedido</Text>
      <View style={styles.card}>
        {items.map((item) => (
          <View key={item.productId} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text numberOfLines={1} style={styles.itemName}>
                {item.name}
              </Text>
              <Text style={styles.itemQuantity}>Cantidad: {item.quantity}</Text>
            </View>
            <Text style={styles.itemPrice}>
              {currencyFormatter.format(Number(item.price) * item.quantity)}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Dirección de envío</Text>
      <View style={styles.addressCard}>
        <Text style={styles.addressText}>
          Todavía no tenés una dirección de envío cargada en tu perfil.
        </Text>
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalPrice}>{currencyFormatter.format(totalPrice)}</Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        disabled={isSubmitting}
        onPress={() => void confirmOrder()}
        style={({ pressed }) => [
          styles.confirmButton,
          (pressed || isSubmitting) && styles.buttonDisabled,
        ]}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.confirmButtonText}>Confirmar y pagar</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    padding: 16,
  },
  itemRow: {
    alignItems: 'center',
    borderBottomColor: '#e5e7eb',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: 12,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 12,
  },
  itemName: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  itemQuantity: {
    color: '#6b7280',
    marginTop: 4,
  },
  itemPrice: {
    color: '#111827',
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 28,
  },
  addressCard: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    padding: 14,
  },
  addressText: {
    color: '#4b5563',
    lineHeight: 21,
  },
  totalRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 28,
  },
  totalLabel: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
  },
  totalPrice: {
    color: '#2563eb',
    fontSize: 24,
    fontWeight: '700',
  },
  error: {
    color: '#b91c1c',
    fontSize: 15,
    marginTop: 20,
    textAlign: 'center',
  },
  confirmButton: {
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 8,
    marginTop: 24,
    padding: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#4b5563',
    fontSize: 16,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
