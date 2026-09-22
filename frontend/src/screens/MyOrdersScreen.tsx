import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getErrorMessage, ordersApi, type Order } from '../services/api';
import { colors } from '../theme';

type CustomerStackParamList = {
  MyOrders: undefined;
  OrderDetail: { id: number };
};

type MyOrdersScreenProps = NativeStackScreenProps<
  CustomerStackParamList,
  'MyOrders'
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

export default function MyOrdersScreen({ navigation }: MyOrdersScreenProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setError(null);
      const response = await ordersApi.getMyOrders();
      setOrders(response.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }, []);

  useEffect(() => {
    void loadOrders().finally(() => setIsLoading(false));
  }, [loadOrders]);

  const refresh = async () => {
    setIsRefreshing(true);
    await loadOrders();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={orders.length === 0 ? styles.emptyList : styles.list}
      data={orders}
      keyExtractor={(item) => String(item.id)}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            {error ?? 'Todavía no realizaste ningún pedido.'}
          </Text>
          {error && (
            <Pressable onPress={() => void refresh()} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </Pressable>
          )}
        </View>
      }
      onRefresh={() => void refresh()}
      refreshing={isRefreshing}
      renderItem={({ item }) => (
        <OrderCard
          onPress={() => navigation.navigate('OrderDetail', { id: item.id })}
          order={item}
        />
      )}
    />
  );
}

function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  const status = order.status.toLowerCase();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.orderNumber}>
          Pedido NE-{String(order.id).padStart(4, '0')}
        </Text>
        <View
          style={[
            styles.status,
            statusStyles[status as keyof typeof statusStyles] ?? styles.pending,
          ]}
        >
          <Text style={styles.statusText}>{statusLabels[status] ?? order.status}</Text>
        </View>
      </View>
      <Text style={styles.date}>{dateFormatter.format(new Date(order.createdAt))}</Text>
      <Text style={styles.total}>{currencyFormatter.format(Number(order.total))}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  list: {
    padding: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyText: {
    color: colors.textSecondary,
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
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  cardPressed: {
    opacity: 0.75,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderNumber: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  status: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    color: colors.interactiveText,
    fontSize: 12,
    fontWeight: '700',
  },
  date: {
    color: colors.textSecondary,
    marginTop: 12,
  },
  total: {
    color: colors.info,
    fontSize: 19,
    fontWeight: '700',
    marginTop: 8,
  },
  pending: {
    backgroundColor: colors.disabled,
  },
});

const statusStyles = StyleSheet.create({
  cancelled: {
    backgroundColor: colors.error,
  },
  confirmed: {
    backgroundColor: colors.info,
  },
  delivered: {
    backgroundColor: colors.success,
  },
  pending: {
    backgroundColor: colors.disabled,
  },
  processing: {
    backgroundColor: colors.warning,
  },
  shipped: {
    backgroundColor: colors.warning,
  },
});
