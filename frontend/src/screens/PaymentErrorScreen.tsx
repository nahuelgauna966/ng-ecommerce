import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useStripe } from '@stripe/stripe-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { paymentsApi } from '../services/api';
import { colors } from '../theme';

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

const DEFAULT_PAYMENT_ERROR_MESSAGE = 'El pago no pudo procesarse.';

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
          <ActivityIndicator color={colors.interactiveText} />
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
    return error.message.trim() || DEFAULT_PAYMENT_ERROR_MESSAGE;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = error.message;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
  }
  return DEFAULT_PAYMENT_ERROR_MESSAGE;
}

function getFriendlyMessage(message: string): string {
  const normalized = message.trim().toLowerCase();
  if (normalized.includes('insufficient') || normalized.includes('fondos')) {
    return 'Fondos insuficientes en la tarjeta.';
  }
  if (normalized.includes('declin') || normalized.includes('reject') || normalized.includes('rechaz')) {
    return 'Tu tarjeta fue rechazada. Verificá los datos o usá otra.';
  }
  if (normalized.includes('network') || normalized.includes('conex') || normalized.includes('internet')) {
    return 'Error de conexión. Intentá nuevamente.';
  }
  return DEFAULT_PAYMENT_ERROR_MESSAGE;
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center', padding: 24 },
  errorCircle: { alignItems: 'center', backgroundColor: colors.error, borderRadius: 48, height: 96, justifyContent: 'center', width: 96 },
  errorIcon: { color: colors.interactiveText, fontSize: 58, fontWeight: '700', lineHeight: 66 },
  title: { color: colors.text, fontSize: 24, fontWeight: '700', marginTop: 28, textAlign: 'center' },
  message: { color: colors.textSecondary, fontSize: 16, lineHeight: 23, marginTop: 16, textAlign: 'center' },
  pending: { color: colors.textSecondary, marginTop: 12, textAlign: 'center' },
  primaryButton: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: colors.interactive, borderRadius: 8, marginTop: 32, padding: 16 },
  primaryButtonText: { color: colors.interactiveText, fontSize: 16, fontWeight: '700' },
  secondaryButton: { alignItems: 'center', alignSelf: 'stretch', borderColor: colors.info, borderRadius: 8, borderWidth: 1, marginTop: 12, padding: 15 },
  secondaryButtonText: { color: colors.info, fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.6 },
});