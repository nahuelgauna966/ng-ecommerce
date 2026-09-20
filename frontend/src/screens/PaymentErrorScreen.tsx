import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useStripe } from '@stripe/stripe-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { paymentsApi } from '../services/api';

type CustomerStackParamList = {
  MyOrders: undefined;
  PaymentError: {
    clientSecret: string | null;
    message: string;
    orderId: number;
    total: string;
  };
  PaymentSuccess: { orderId: number; total: string };
};

type PaymentErrorScreenProps = NativeStackScreenProps<
  CustomerStackParamList,
  'PaymentError'
>;

export default function PaymentErrorScreen({
  navigation,
  route,
}: PaymentErrorScreenProps) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [clientSecret, setClientSecret] = useState(route.params.clientSecret);
  const [isRetrying, setIsRetrying] = useState(false);
  const [message, setMessage] = useState(getFriendlyMessage(route.params.message));

  const retryPayment = async () => {
    setIsRetrying(true);
    try {
      const secret =
        clientSecret ?? (await paymentsApi.create({ orderId: route.params.orderId })).data.clientSecret;
      if (!secret) {
        throw new Error('El pago no pudo procesarse.');
      }

      setClientSecret(secret);
      const { error: initializationError } = await initPaymentSheet({
        merchantDisplayName: 'ng-ecommerce',
        paymentIntentClientSecret: secret,
        returnURL: 'ng-ecommerce://payment-success',
      });
      if (initializationError) {
        throw initializationError;
      }

      const { error: paymentError } = await presentPaymentSheet();
      if (paymentError) {
        throw paymentError;
      }

      navigation.replace('PaymentSuccess', {
        orderId: route.params.orderId,
        total: route.params.total,
      });
    } catch (error) {
      setMessage(getFriendlyMessage(getStripeErrorMessage(error)));
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.errorCircle}>
        <Text style={styles.errorIcon}>!</Text>
      </View>
      <Text style={styles.title}>No pudimos procesar tu pago</Text>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.pending}>Tu pedido sigue pendiente de pago.</Text>

      <Pressable
        disabled={isRetrying}
        onPress={() => void retryPayment()}
        style={({ pressed }) => [styles.primaryButton, (pressed || isRetrying) && styles.disabled]}
      >
        {isRetrying ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.primaryButtonText}>Reintentar pago</Text>
        )}
      </Pressable>
      <Pressable onPress={() => navigation.replace('MyOrders')} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Cancelar</Text>
      </Pressable>
    </View>
  );
}

function getStripeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message);
  }
  return '';
}

function getFriendlyMessage(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes('insufficient') || normalized.includes('fondos')) {
    return 'Fondos insuficientes en la tarjeta.';
  }
  if (normalized.includes('declin') || normalized.includes('reject') || normalized.includes('rechaz')) {
    return 'Tu tarjeta fue rechazada. Verificá los datos o usá otra.';
  }
  if (normalized.includes('network') || normalized.includes('conex') || normalized.includes('internet')) {
    return 'Error de conexión. Intentá nuevamente.';
  }
  return 'El pago no pudo procesarse.';
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  errorCircle: { alignItems: 'center', backgroundColor: '#dc2626', borderRadius: 48, height: 96, justifyContent: 'center', width: 96 },
  errorIcon: { color: '#ffffff', fontSize: 58, fontWeight: '700', lineHeight: 66 },
  title: { color: '#111827', fontSize: 24, fontWeight: '700', marginTop: 28, textAlign: 'center' },
  message: { color: '#4b5563', fontSize: 16, lineHeight: 23, marginTop: 16, textAlign: 'center' },
  pending: { color: '#6b7280', marginTop: 12, textAlign: 'center' },
  primaryButton: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: '#2563eb', borderRadius: 8, marginTop: 32, padding: 16 },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  secondaryButton: { alignItems: 'center', alignSelf: 'stretch', borderColor: '#2563eb', borderRadius: 8, borderWidth: 1, marginTop: 12, padding: 15 },
  secondaryButtonText: { color: '#2563eb', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.6 },
});