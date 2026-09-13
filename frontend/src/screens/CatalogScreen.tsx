import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ProductCard from '../components/ProductCard';
import {
  categoriesApi,
  getErrorMessage,
  productsApi,
  type Category,
  type Product,
} from '../services/api';

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>();
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(
    async (nextPage: number, replace = false, categoryId = selectedCategoryId) => {
      try {
        setError(null);
        const response = await productsApi.getAll(nextPage, PAGE_SIZE, categoryId);
        const { data, total: responseTotal } = response.data;
        setProducts((current) => (replace ? data : [...current, ...data]));
        setTotal(responseTotal);
        setPage(nextPage);
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      }
    },
    [selectedCategoryId],
  );

  const loadCategories = useCallback(async () => {
    try {
      const response = await categoriesApi.getAll();
      setCategories(response.data);
    } catch {
      // El catálogo sigue disponible aunque no pueda cargar los filtros.
    }
  }, []);

  useEffect(() => {
    void loadPage(1, true).finally(() => setIsLoading(false));
  }, [loadPage]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const refresh = async () => {
    setIsRefreshing(true);
    await loadPage(1, true);
    await loadCategories();
    setIsRefreshing(false);
  };

  const selectCategory = (categoryId?: number) => {
    if (categoryId === selectedCategoryId) {
      return;
    }
    setProducts([]);
    setPage(1);
    setTotal(0);
    setSelectedCategoryId(categoryId);
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
      ListHeaderComponent={
        <ScrollView
          contentContainerStyle={styles.chips}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <CategoryChip
            label="Todas"
            onPress={() => selectCategory()}
            selected={selectedCategoryId === undefined}
          />
          {categories.map((category) => (
            <CategoryChip
              key={category.id}
              label={category.name}
              onPress={() => selectCategory(category.id)}
              selected={selectedCategoryId === category.id}
            />
          ))}
        </ScrollView>
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

function CategoryChip({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
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
  chips: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chip: {
    borderColor: '#9ca3af',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  chipText: {
    color: '#374151',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
});
