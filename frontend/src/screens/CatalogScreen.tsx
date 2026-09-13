import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ProductCard from '../components/ProductCard';
import { getErrorMessage, productsApi, type Product } from '../services/api';

type CustomerStackParamList = {
  Home: undefined;
  Catalog: undefined;
  ProductDetail: { id: number };
  Cart: undefined;
  Checkout: undefined;
  MyOrders: undefined;
  OrderDetail: undefined;
  Profile: undefined;
};

type CatalogScreenProps = NativeStackScreenProps<CustomerStackParamList, 'Catalog'>;

const PAGE_SIZE = 10;

export default function CatalogScreen({ navigation }: CatalogScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(async (nextPage: number, replace = false) => {
    try {
      setError(null);
      const response = await productsApi.getAll(nextPage, PAGE_SIZE);
      const { data, total: responseTotal } = response.data;
      setProducts((current) => (replace ? data : [...current, ...data]));
      setTotal(responseTotal);
      setPage(nextPage);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }, []);

  useEffect(() => {
    void loadPage(1, true).finally(() => setIsLoading(false));
  }, [loadPage]);

  const refresh = async () => {
    setIsRefreshing(true);
    await loadPage(1, true);
    setIsRefreshing(false);
  };

  const loadMore = async () => {
    if (isLoading || isRefreshing || isLoadingMore || products.length >= total) {
      return;
    }
    setIsLoadingMore(true);
    await loadPage(page + 1);
    setIsLoadingMore(false);
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
      contentContainerStyle={products.length === 0 ? styles.emptyList : undefined}
      data={products}
      keyExtractor={(item) => String(item.id)}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            {error ?? 'No hay productos disponibles.'}
          </Text>
        </View>
      }
      ListFooterComponent={
        isLoadingMore ? <ActivityIndicator style={styles.footer} /> : null
      }
      onEndReached={() => void loadMore()}
      onEndReachedThreshold={0.4}
      onRefresh={() => void refresh()}
      refreshing={isRefreshing}
      renderItem={({ item }) => (
        <ProductCard
          onPress={() => navigation.navigate('ProductDetail', { id: item.id })}
          product={item}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyText: {
    color: '#4b5563',
    fontSize: 16,
    textAlign: 'center',
  },
  footer: {
    marginVertical: 20,
  },
});
