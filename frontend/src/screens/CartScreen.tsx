import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { CartItem } from '../store/cartStore';
import { useCartStore } from '../store/cartStore';
import { colors } from '../theme';
import UiIcon from '../components/UiIcon';

type CustomerStackParamList = {
  Catalog: undefined;
  Cart: undefined;
  Checkout: undefined;
};

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  currency: 'ARS',
  style: 'currency',
});

export default function CartScreen() {
  const navigation = useNavigation<
    NativeStackNavigationProp<CustomerStackParamList, 'Cart'>
  >();
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const totalPrice = useCartStore((state) => state.totalPrice());

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <UiIcon name="cart" size={56} />
        <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
        <Text style={styles.emptyText}>
          Agregá productos para continuar con tu compra.
        </Text>
        <Pressable
          onPress={() => navigation.navigate('Catalog')}
          style={styles.catalogButton}
        >
          <Text style={styles.catalogButtonText}>Ir al catálogo</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={items}
      keyExtractor={(item) => String(item.productId)}
      ListFooterComponent={
        <View style={styles.summary}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>{currencyFormatter.format(totalPrice)}</Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('Checkout')}
            style={styles.checkoutButton}
          >
            <Text style={styles.checkoutButtonText}>Proceder al checkout</Text>
          </Pressable>
        </View>
      }
      renderItem={({ item }) => (
        <CartItemRow
          item={item}
          onRemove={() => removeItem(item.productId)}
          onUpdateQuantity={(quantity) => updateQuantity(item.productId, quantity)}
        />
      )}
    />
  );
}

function CartItemRow({
  item,
  onRemove,
  onUpdateQuantity,
}: {
  item: CartItem;
  onRemove: () => void;
  onUpdateQuantity: (quantity: number) => void;
}) {
  const subtotal = Number(item.price) * item.quantity;

  return (
    <View style={styles.item}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>Sin imagen</Text>
        </View>
      )}
      <View style={styles.itemContent}>
        <Text numberOfLines={2} style={styles.name}>
          {item.name}
        </Text>
        <Text style={styles.unitPrice}>
          {currencyFormatter.format(Number(item.price))} c/u
        </Text>
        <View style={styles.quantityRow}>
          <Pressable
            accessibilityLabel="Disminuir cantidad"
            onPress={() => onUpdateQuantity(item.quantity - 1)}
            style={styles.quantityButton}
          >
            <Text style={styles.quantityButtonText}>−</Text>
          </Pressable>
          <Text style={styles.quantity}>{item.quantity}</Text>
          <Pressable
            accessibilityLabel="Aumentar cantidad"
            disabled={item.quantity >= item.maxStock}
            onPress={() => onUpdateQuantity(item.quantity + 1)}
            style={[
              styles.quantityButton,
              item.quantity >= item.maxStock && styles.controlDisabled,
            ]}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Eliminar producto"
            onPress={onRemove}
            style={styles.removeButton}
          >
            <Text style={styles.removeButtonText}>Eliminar</Text>
          </Pressable>
        </View>
        <Text style={styles.subtotal}>
          Subtotal: {currencyFormatter.format(subtotal)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: colors.background,
    padding: 16,
  },
  item: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 12,
    overflow: 'hidden',
    padding: 12,
  },
  image: {
    borderRadius: 8,
    height: 92,
    width: 92,
  },
  imagePlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    height: 92,
    justifyContent: 'center',
    width: 92,
  },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  unitPrice: {
    color: colors.textSecondary,
    marginTop: 4,
  },
  quantityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 10,
  },
  quantityButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  controlDisabled: {
    opacity: 0.45,
  },
  quantityButtonText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 38,
    textAlign: 'center',
  },
  removeButton: {
    marginLeft: 'auto',
    padding: 6,
  },
  removeButtonText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  subtotal: {
    color: colors.text,
    fontWeight: '700',
    marginTop: 10,
  },
  summary: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 20,
  },
  totalRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  totalPrice: {
    color: colors.info,
    fontSize: 22,
    fontWeight: '700',
  },
  checkoutButton: {
    alignItems: 'center',
    backgroundColor: colors.interactive,
    borderRadius: 8,
    marginTop: 20,
    padding: 16,
  },
  checkoutButtonText: {
    color: colors.interactiveText,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  catalogButton: {
    backgroundColor: colors.interactive,
    borderRadius: 8,
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  catalogButtonText: {
    color: colors.interactiveText,
    fontSize: 16,
    fontWeight: '700',
  },
});
