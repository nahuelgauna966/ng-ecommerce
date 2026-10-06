import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import CategoryCard from '../components/CategoryCard';
import ProductCard from '../components/ProductCard';
import UiIcon from '../components/UiIcon';
import { useIsMounted } from '../hooks/useIsMounted';
import {
  categoriesApi,
  getErrorMessage,
  productsApi,
  type Category,
  type Product,
} from '../services/api';
import { colors, radii, spacing } from '../theme';

type HomeStackParamList = {
  Home: undefined;
  Catalog: { categoryId?: number; focusSearch?: boolean; search?: string; brand?: string } | undefined;
  ProductDetail: { id: number };
};

type HomeScreenProps = NativeStackScreenProps<HomeStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newest, setNewest] = useState<Product[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState({ categories: true, featured: true, newest: true, brands: true });
  const [errors, setErrors] = useState<Record<string, string | null>>({ categories: null, featured: null, newest: null, brands: null });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMounted = useIsMounted();
  const bannerHeight = Math.min(Math.max((width - spacing.lg * 2) * 0.68, 230), 360);

  const loadHome = useCallback(async () => {
    const results = await Promise.allSettled([
      categoriesApi.getAll(),
      productsApi.getFeatured(),
      productsApi.getNewest(),
      productsApi.getBrands(),
    ]);
    if (!isMounted.current) return;

    const nextErrors: Record<string, string | null> = { categories: null, featured: null, newest: null, brands: null };
    const [categoryResult, featuredResult, newestResult, brandResult] = results;
    if (categoryResult.status === 'fulfilled') setCategories(categoryResult.value.data);
    else nextErrors.categories = getErrorMessage(categoryResult.reason);
    if (featuredResult.status === 'fulfilled') setFeatured(featuredResult.value.data);
    else nextErrors.featured = getErrorMessage(featuredResult.reason);
    if (newestResult.status === 'fulfilled') setNewest(newestResult.value.data);
    else nextErrors.newest = getErrorMessage(newestResult.reason);
    if (brandResult.status === 'fulfilled') setBrands(brandResult.value.data);
    else nextErrors.brands = getErrorMessage(brandResult.reason);
    setErrors(nextErrors);
    setLoading({ categories: false, featured: false, newest: false, brands: false });
    setIsRefreshing(false);
  }, [isMounted]);

  useEffect(() => {
    void loadHome();
  }, [loadHome]);

  const submitSearch = () => {
    const search = query.trim();
    navigation.navigate('Catalog', search ? { search } : undefined);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl onRefresh={() => { setIsRefreshing(true); setLoading({ categories: true, featured: true, newest: true, brands: true }); void loadHome(); }} refreshing={isRefreshing} tintColor={colors.text} />}
      style={styles.screen}
    >
      <View style={styles.searchWrap}>
        <UiIcon color={colors.textSecondary} name="search" size={23} />
        <TextInput
          accessibilityLabel="Buscar productos"
          onChangeText={setQuery}
          onSubmitEditing={submitSearch}
          placeholder="Buscar productos"
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
          style={styles.searchInput}
          value={query}
        />
      </View>

      <SectionTitle title="Hardware para tu próximo upgrade" />
      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('Catalog')}
        style={({ pressed }) => [styles.banner, { height: bannerHeight }, pressed && styles.pressed]}
      >
        <Image
          accessibilityLabel="Potenciá tu PC"
          source={require('../../assets/banner-pc.png')}
          style={styles.bannerImage}
        />
        <View style={styles.bannerShade} />
        <View style={styles.bannerContent}>
          <Text style={styles.bannerEyebrow}>ELEGÍ TU PRÓXIMO UPGRADE</Text>
          <Text style={styles.bannerTitle}>Potenciá tu PC</Text>
          <Text style={styles.bannerDescription}>Explorá componentes y encontrá lo que mejor se adapta a vos.</Text>
        </View>
        <View style={styles.bannerButton}>
          <Text style={styles.bannerButtonText}>Explorar componentes</Text>
          <UiIcon color={colors.inverseText} name="arrowRight" size={22} />
        </View>
      </Pressable>

      {loading.featured && featured.length === 0 ? (
        <>
          <SectionTitle title="Productos destacados" />
          <ActivityIndicator color={colors.text} style={styles.categoriesState} />
        </>
      ) : featured.length > 0 ? (
        <>
          <SectionTitle title="Productos destacados" />
          <DiscoveryProducts onProductPress={(product) => navigation.navigate('ProductDetail', { id: product.id })} products={featured} />
        </>
      ) : errors.featured ? (
        <DiscoveryError error={errors.featured} onRetry={() => { setLoading((current) => ({ ...current, featured: true })); void loadHome(); }} />
      ) : null}

      {loading.newest && newest.length === 0 ? (
        <>
          <SectionTitle title="Lo último en el catálogo" />
          <ActivityIndicator color={colors.text} style={styles.categoriesState} />
        </>
      ) : newest.length > 0 ? (
        <>
          <SectionTitle title="Lo último en el catálogo" />
          <DiscoveryProducts onProductPress={(product) => navigation.navigate('ProductDetail', { id: product.id })} products={newest} />
        </>
      ) : errors.newest ? (
        <DiscoveryError error={errors.newest} onRetry={() => { setLoading((current) => ({ ...current, newest: true })); void loadHome(); }} />
      ) : null}

      {loading.brands && brands.length === 0 ? (
        <>
          <SectionTitle title="Marcas para descubrir" />
          <ActivityIndicator color={colors.text} style={styles.categoriesState} />
        </>
      ) : brands.length > 0 ? (
        <>
          <SectionTitle title="Marcas para descubrir" />
          <ScrollView contentContainerStyle={styles.brands} horizontal showsHorizontalScrollIndicator={false}>
            {brands.map((brand) => (
              <Pressable accessibilityRole="button" key={brand} onPress={() => navigation.navigate('Catalog', { brand })} style={({ pressed }) => [styles.brandChip, pressed && styles.pressed]}>
                <Text style={styles.brandText}>{brand}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      ) : errors.brands ? (
        <DiscoveryError error={errors.brands} onRetry={() => { setLoading((current) => ({ ...current, brands: true })); void productsApi.getBrands().then(({ data }) => { if (isMounted.current) setBrands(data); }).catch((requestError: unknown) => { if (isMounted.current) setErrors((current) => ({ ...current, brands: getErrorMessage(requestError) })); }).finally(() => { if (isMounted.current) setLoading((current) => ({ ...current, brands: false })); }); }} />
      ) : null}

      <SectionTitle title="Buscá por categoría" />
      {loading.categories ? (
        <ActivityIndicator color={colors.text} style={styles.categoriesState} />
      ) : errors.categories ? (
        <View style={styles.categoriesState}>
          <Text style={styles.stateText}>{errors.categories}</Text>
          <Pressable accessibilityRole="button" onPress={() => { setLoading((current) => ({ ...current, categories: true })); void categoriesApi.getAll().then(({ data }) => { if (isMounted.current) setCategories(data); }).catch((requestError: unknown) => { if (isMounted.current) setErrors((current) => ({ ...current, categories: getErrorMessage(requestError) })); }).finally(() => { if (isMounted.current) setLoading((current) => ({ ...current, categories: false })); }); }} style={styles.retryButton}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : categories.length === 0 ? (
        <Text style={[styles.stateText, styles.categoriesState]}>No hay categorías disponibles.</Text>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.categories}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {categories.map((category) => (
              <CategoryCard
                category={category}
                key={category.id}
                onPress={() => navigation.navigate('Catalog', { categoryId: category.id })}
              />
            ))}
          </ScrollView>
          <View style={styles.scrollHint}><View style={styles.scrollHintActive} /></View>
        </>
      )}

      <View style={styles.helpCard}>
        <UiIcon name="support" size={23} />
        <Text style={styles.helpText}>¿Necesitás ayuda para elegir?</Text>
        <UiIcon color={colors.textSecondary} name="arrowRight" size={27} />
      </View>

      <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Catalog')} style={({ pressed }) => [styles.builderCard, pressed && styles.pressed]}>
        <View style={styles.builderCopy}>
          <Text style={styles.builderEyebrow}>ARMÁ TU SETUP</Text>
          <Text style={styles.builderTitle}>Encontrá los componentes para tu PC</Text>
          <Text style={styles.builderDescription}>Explorá el catálogo y descubrí opciones para tu próximo armado.</Text>
        </View>
        <UiIcon color={colors.text} name="arrowRight" size={24} />
      </Pressable>
    </ScrollView>
  );
}

function DiscoveryProducts({
  onProductPress,
  products,
}: {
  onProductPress: (product: Product) => void;
  products: Product[];
}) {
  if (products.length === 0) {
    return null;
  }
  return (
    <ScrollView contentContainerStyle={styles.productRail} horizontal showsHorizontalScrollIndicator={false}>
      {products.map((product) => (
        <ProductCard compact key={product.id} onPress={() => onProductPress(product)} product={product} />
      ))}
    </ScrollView>
  );
}

function DiscoveryError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <View style={styles.discoveryError}>
      <Text style={styles.stateText}>{error}</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
        <Text style={styles.retryText}>Reintentar</Text>
      </Pressable>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { paddingBottom: spacing.xxl },
  searchWrap: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', marginHorizontal: spacing.lg, marginTop: spacing.lg, paddingHorizontal: spacing.md },
  searchInput: { color: colors.text, flex: 1, fontSize: 14, minHeight: 44, paddingHorizontal: spacing.sm },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.lg, marginTop: spacing.xl },
  sectionTitle: { color: colors.text, fontSize: 10, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase' },
  sectionLine: { backgroundColor: colors.border, flex: 1, height: StyleSheet.hairlineWidth },
  banner: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, marginHorizontal: spacing.lg, marginTop: spacing.md, overflow: 'hidden', position: 'relative' },
  bannerImage: { height: '100%', opacity: 0.86, position: 'absolute', resizeMode: 'cover', width: '100%' },
  bannerShade: { backgroundColor: 'rgba(0, 0, 0, 0.2)', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  bannerContent: { padding: spacing.md },
  bannerEyebrow: { color: colors.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  bannerTitle: { color: colors.text, fontSize: 27, fontWeight: '800', letterSpacing: -0.6 },
  bannerDescription: { color: colors.text, fontSize: 14, lineHeight: 18, marginTop: spacing.xs, maxWidth: 165 },
  bannerButton: { alignItems: 'center', backgroundColor: colors.text, borderRadius: radii.sm, bottom: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', left: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, position: 'absolute', right: spacing.sm },
  bannerButtonText: { color: colors.inverseText, fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.8 },
  categories: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingRight: spacing.xl },
  categoriesState: { marginHorizontal: spacing.lg, marginTop: spacing.lg },
  productRail: { gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingRight: spacing.xl },
  brands: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingRight: spacing.xl },
  brandChip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  brandText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  discoveryError: { marginHorizontal: spacing.lg, marginTop: spacing.md },
  stateText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
  retryButton: { alignSelf: 'center', marginTop: spacing.sm, padding: spacing.sm },
  retryText: { color: colors.text, fontWeight: '700' },
  scrollHint: { backgroundColor: colors.border, borderRadius: 2, height: 3, marginLeft: spacing.lg, marginTop: spacing.md, width: 54 },
  scrollHintActive: { backgroundColor: colors.text, borderRadius: 2, height: 3, width: 27 },
  helpCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', gap: spacing.md, marginHorizontal: spacing.lg, marginTop: spacing.xl, padding: spacing.md },
  helpText: { color: colors.text, flex: 1, fontSize: 13 },
  builderCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', gap: spacing.md, marginHorizontal: spacing.lg, marginTop: spacing.xl, padding: spacing.lg },
  builderCopy: { flex: 1 },
  builderEyebrow: { color: colors.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  builderTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: spacing.xs },
  builderDescription: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: spacing.xs },
});
