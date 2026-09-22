import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getErrorMessage,
  ordersApi,
  type OrderDetails,
  type OrderDetailItem,
} from '../services/api';
import { colors } from '../theme';

type CustomerStackParamList = {
  MyOrders: undefined;
  OrderDetail: { id: number };
};

type OrderDetailScreenProps = NativeStackScreenProps<
  CustomerStackParamList,
  'OrderDetail'
>;

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  currency: 'ARS',
  style: 'currency',
});

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const statusLabels: Record<string, string> = {
  cancelled: 'Cancelado',
  confirmed: 'Confirmado',
  delivered: 'Entregado',
  pending: 'Pendiente',
  processing: 'En preparación',
  shipped: 'Enviado',
};

const paymentMethodLabels: Record<string, string> = {
  card: 'Tarjeta',
  cash: 'Efectivo',
  transfer: 'Transferencia',
};

const paymentStatusLabels: Record<string, string> = {
  completed: 'Completado',
  failed: 'Fallido',
  pending: 'Pendiente',
  refunded: 'Reintegrado',
};

export default function OrderDetailScreen({
  navigation,
  route,
}: OrderDetailScreenProps) {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    try {
      setError(null);
      const response = await ordersApi.getById(route.params.id);
      setOrder(response.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }, [route.params.id]);

  useEffect(() => {
    void loadOrder().finally(() => setIsLoading(false));
  }, [loadOrder]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
        <Pressable onPress={() => void loadOrder()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </Pressable>
        <BackToOrdersButton onPress={() => navigation.navigate('MyOrders')} />
      </View>
    );
  }

  const status = order.status.toLowerCase();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.orderNumber}>
            Pedido NE-{String(order.id).padStart(4, '0')}
          </Text>
          <Text style={styles.date}>{dateFormatter.format(new Date(order.createdAt))}</Text>
        </View>
        <View style={[styles.status, statusStyles[status as keyof typeof statusStyles] ?? styles.pending]}>
          <Text style={styles.statusText}>{statusLabels[status] ?? order.status}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Productos</Text>
      <View style={styles.card}>
        {order.orderDetails.map((item) => (
          <OrderItem key={item.id} item={item} />
        ))}
      </View>

      {order.payment && (
        <>
          <Text style={styles.sectionTitle}>Información de pago</Text>
          <View style={styles.card}>
            <InfoRow label="Método" value={paymentMethodLabels[order.payment.method] ?? order.payment.method} />
            <InfoRow label="Estado" value={paymentStatusLabels[order.payment.status] ?? order.payment.status} />
            <InfoRow label="Fecha" value={dateFormatter.format(new Date(order.payment.createdAt))} />
          </View>
        </>
      )}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.total}>{currencyFormatter.format(Number(order.total))}</Text>
      </View>

      <BackToOrdersButton onPress={() => navigation.navigate('MyOrders')} />
    </ScrollView>
  );
}

function OrderItem({ item }: { item: OrderDetailItem }) {
  const subtotal = Number(item.unitPrice) * item.quantity;

  return (
    <View style={styles.item}>
      {item.product?.imageUrl ? (
        <Image source={{ uri: item.product.imageUrl }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text>📦</Text>
        </View>
      )}
      <View style={styles.itemContent}>
        <Text numberOfLines={2} style={styles.itemName}>
          {item.product?.name ?? 'Producto no disponible'}
        </Text>
        <Text style={styles.itemMeta}>
          {item.quantity} × {currencyFormatter.format(Number(item.unitPrice))}
        </Text>
        <Text style={styles.subtotal}>{currencyFormatter.format(subtotal)}</Text>
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function BackToOrdersButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.backButton}>
      <Text style={styles.backButtonText}>Volver a Mis Pedidos</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, padding: 20 },
  centered: { alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  orderNumber: { color: colors.text, fontSize: 22, fontWeight: '700' },
  date: { color: colors.textSecondary, marginTop: 6 },
  status: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { color: colors.interactiveText, fontSize: 12, fontWeight: '700' },
  pending: { backgroundColor: colors.disabled },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 28 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, marginTop: 10, paddingHorizontal: 16 },
  item: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', paddingVertical: 14 },
  image: { borderRadius: 8, height: 64, width: 64 },
  imagePlaceholder: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 8, height: 64, justifyContent: 'center', width: 64 },
  itemContent: { flex: 1, paddingLeft: 12 },
  itemName: { color: colors.text, fontSize: 16, fontWeight: '600' },
  itemMeta: { color: colors.textSecondary, marginTop: 4 },
  subtotal: { color: colors.text, fontWeight: '700', marginTop: 6 },
  infoRow: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13 },
  infoLabel: { color: colors.textSecondary },
  infoValue: { color: colors.text, fontWeight: '600', textTransform: 'capitalize' },
  totalRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 28 },
  totalLabel: { color: colors.text, fontSize: 20, fontWeight: '700' },
  total: { color: colors.info, fontSize: 24, fontWeight: '700' },
  error: { color: colors.error, fontSize: 16, textAlign: 'center' },
  retryButton: { marginTop: 16, padding: 10 },
  retryButtonText: { color: colors.info, fontSize: 16, fontWeight: '700' },
  backButton: { alignItems: 'center', borderColor: colors.info, borderRadius: 8, borderWidth: 1, marginTop: 28, padding: 14 },
  backButtonText: { color: colors.info, fontWeight: '700' },
});

const statusStyles = StyleSheet.create({
  cancelled: { backgroundColor: colors.error },
  confirmed: { backgroundColor: colors.info },
  delivered: { backgroundColor: colors.success },
  pending: { backgroundColor: colors.disabled },
  processing: { backgroundColor: colors.warning },
  shipped: { backgroundColor: colors.warning },
});
