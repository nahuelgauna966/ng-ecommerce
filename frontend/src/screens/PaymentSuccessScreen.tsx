import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

type CustomerStackParamList = {
  Catalog: undefined;
  OrderDetail: { id: number };
  PaymentSuccess: { orderId: number; total: string };
};

type PaymentSuccessScreenProps = NativeStackScreenProps<
  CustomerStackParamList,
  'PaymentSuccess'
>;

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  currency: 'ARS',
  style: 'currency',
});

export default function PaymentSuccessScreen({
  navigation,
  route,
}: PaymentSuccessScreenProps) {
  const scale = useRef(new Animated.Value(0.4)).current;
  const { orderId, total } = route.params;

  useEffect(() => {
    Animated.spring(scale, {
      friction: 4,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.checkCircle, { transform: [{ scale }] }]}>
        <Text style={styles.check}>✓</Text>
      </Animated.View>
      <Text style={styles.title}>¡Pago realizado con éxito!</Text>
      <Text style={styles.orderNumber}>
        Pedido NE-{String(orderId).padStart(4, '0')}
      </Text>
      <Text style={styles.total}>{currencyFormatter.format(Number(total))}</Text>
      <Text style={styles.delivery}>Recibirás novedades sobre la entrega de tu pedido.</Text>

      <Pressable
        onPress={() => navigation.replace('OrderDetail', { id: orderId })}
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonText}>Ver mi pedido</Text>
      </Pressable>
      <Pressable
        onPress={() => navigation.replace('Catalog')}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>Seguir comprando</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  checkCircle: {
    alignItems: 'center',
    backgroundColor: colors.success,
    borderRadius: 48,
    height: 96,
    justifyContent: 'center',
    width: 96,
  },
  check: {
    color: colors.interactiveText,
    fontSize: 58,
    fontWeight: '700',
    lineHeight: 66,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 28,
    textAlign: 'center',
  },
  orderNumber: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 16,
  },
  total: {
    color: colors.info,
    fontSize: 28,
    fontWeight: '700',
    marginTop: 8,
  },
  delivery: {
    color: colors.textSecondary,
    lineHeight: 21,
    marginTop: 20,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.interactive,
    borderRadius: 8,
    marginTop: 32,
    padding: 16,
  },
  primaryButtonText: {
    color: colors.interactiveText,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderColor: colors.info,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 15,
  },
  secondaryButtonText: {
    color: colors.info,
    fontSize: 16,
    fontWeight: '700',
  },
});