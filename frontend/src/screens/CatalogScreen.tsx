import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import { colors, radii, spacing } from '../theme';
import UiIcon from '../components/UiIcon';

type CustomerStackParamList = {
  Home: undefined;
  Catalog: { categoryId?: number; focusSearch?: boolean; search?: string } | undefined;
  ProductDetail: { id: number };
  Cart: undefined;
  Checkout: undefined;
  MyOrders: undefined;
  OrderDetail: undefined;
  Profile: undefined;
};

type CatalogScreenProps = NativeStackScreenProps<CustomerStackParamList, 'Catalog'>;

const PAGE_SIZE = 10;

export default function CatalogScreen({ navigation, route }: CatalogScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>();
  const [searchInput, setSearchInput] = useState(route.params?.search ?? '');
  const [search, setSearch] = useState(route.params?.search ?? '');
  const searchInputRef = useRef<TextInput>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestRequestId = useRef(0);
  const isLoadingMoreRef = useRef(false);
  const appliedRouteQuery = useRef<string | null>(null);

  const loadPage = useCallback(
    async (nextPage: number, replace = false, categoryId = selectedCategoryId, searchTerm = search) => {
      const requestId = latestRequestId.current + 1;
      latestRequestId.current = requestId;
      try {
        setError(null);
        const response = await productsApi.getAll(nextPage, PAGE_SIZE, categoryId, searchTerm);
        const { data, total: responseTotal } = response.data;
        if (requestId !== latestRequestId.current) {
          return;
        }
        setProducts((current) => (replace ? data : [...current, ...data]));
        setTotal(responseTotal);
        setPage(nextPage);
      } catch (requestError) {
        if (requestId !== latestRequestId.current) {
          return;
        }
        setError(getErrorMessage(requestError));
      }
    },
    [search, selectedCategoryId],
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
    const nextSearch = route.params?.search ?? '';
    const nextCategoryId = route.params?.categoryId;
    const routeQuery = `${nextCategoryId ?? ''}:${nextSearch}`;
    if (appliedRouteQuery.current === null) {
      appliedRouteQuery.current = routeQuery;
      return;
    }
    if (appliedRouteQuery.current === routeQuery) {
      return;
    }
    appliedRouteQuery.current = routeQuery;
    latestRequestId.current += 1;
    setSearchInput(nextSearch);
    setSearch(nextSearch);
    setSelectedCategoryId(nextCategoryId);
    setProducts([]);
    setPage(1);
    setTotal(0);
    setError(null);
  }, [route.params?.categoryId, route.params?.search]);

  useEffect(() => {
    if (route.params?.focusSearch) {
      searchInputRef.current?.focus();
    }
  }, [route.params?.focusSearch]);

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
    latestRequestId.current += 1;
    setProducts([]);
    setPage(1);
    setTotal(0);
    setError(null);
    setSelectedCategoryId(categoryId);
  };

  const submitSearch = () => {
    const nextSearch = searchInput.trim();
    if (nextSearch === search) {
      return;
    }
    latestRequestId.current += 1;
    setProducts([]);
    setPage(1);
    setTotal(0);
    setError(null);
    setSearch(nextSearch);
  };

  const loadMore = async () => {
    if (
      isLoading ||
      isRefreshing ||
      isLoadingMoreRef.current ||
      products.length >= total
    ) {
      return;
    }
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      await loadPage(page + 1);
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
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
      contentContainerStyle={products.length === 0 ? styles.emptyList : styles.list}
      style={styles.screen}
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
        <>
          <View style={styles.searchWrap}>
            <UiIcon color={colors.textSecondary} name="search" size={23} />
            <TextInput
              accessibilityLabel="Buscar productos"
              onChangeText={setSearchInput}
              onSubmitEditing={submitSearch}
              placeholder="Buscar productos"
              placeholderTextColor={colors.textSecondary}
              ref={searchInputRef}
              returnKeyType="search"
              style={styles.searchInput}
              value={searchInput}
            />
            {searchInput.length > 0 && (
              <Pressable accessibilityLabel="Limpiar búsqueda" onPress={() => { setSearchInput(''); setSearch(''); }}>
                <UiIcon color={colors.textSecondary} name="close" size={23} />
              </Pressable>
            )}
          </View>
          <ScrollView contentContainerStyle={styles.chips} horizontal showsHorizontalScrollIndicator={false}>
            <CategoryChip label="Todas" onPress={() => selectCategory()} selected={selectedCategoryId === undefined} />
            {categories.map((category) => (
              <CategoryChip key={category.id} label={category.name} onPress={() => selectCategory(category.id)} selected={selectedCategoryId === category.id} />
            ))}
          </ScrollView>
        </>
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
  screen: { backgroundColor: colors.background },
  list: { paddingBottom: spacing.xl },
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
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  footer: {
    marginVertical: 20,
  },
  chips: {
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  chipText: {
    color: colors.text,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: colors.inverseText,
  },
  searchWrap: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', marginHorizontal: spacing.lg, marginTop: spacing.lg, paddingHorizontal: spacing.md },
  searchInput: { color: colors.text, flex: 1, fontSize: 14, minHeight: 44, paddingHorizontal: spacing.sm },
});
