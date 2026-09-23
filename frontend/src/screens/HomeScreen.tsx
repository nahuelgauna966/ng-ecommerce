import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import CategoryCard from '../components/CategoryCard';
import RemoteProductImage from '../components/RemoteProductImage';
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
  Catalog: { categoryId?: number; focusSearch?: boolean; search?: string } | undefined;
  ProductDetail: { id: number };
};

type HomeScreenProps = NativeStackScreenProps<HomeStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProduct, setFeaturedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useIsMounted();
  const bannerHeight = Math.min(Math.max((width - spacing.lg * 2) * 0.62, 220), 360);

  const loadHome = useCallback(async () => {
    try {
      setError(null);
      const [categoriesResponse, productsResponse] = await Promise.all([
        categoriesApi.getAll(),
        productsApi.getAll(1, 1),
      ]);
      if (!isMounted.current) {
        return;
      }
      setCategories(categoriesResponse.data);
      setFeaturedProduct(productsResponse.data.data[0] ?? null);
    } catch (requestError) {
      if (!isMounted.current) {
        return;
      }
      setError(getErrorMessage(requestError));
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [isMounted]);

  useEffect(() => {
    void loadHome();
  }, [loadHome]);

  const submitSearch = () => {
    const search = query.trim();
    navigation.navigate('Catalog', search ? { search } : undefined);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
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

      <SectionTitle title="Hardware destacado" />
      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('Catalog')}
        style={({ pressed }) => [styles.banner, { height: bannerHeight }, pressed && styles.pressed]}
      >
        <RemoteProductImage
          accessibilityLabel={`Imagen destacada de ${featuredProduct?.name ?? 'hardware'}`}
          containerStyle={styles.bannerImage}
          uri={featuredProduct?.imageUrl}
        />
        <View style={styles.bannerShade} />
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>Potenciá tu PC</Text>
          <Text style={styles.bannerDescription}>Rendimiento para llegar más lejos.</Text>
        </View>
        <View style={styles.bannerButton}>
          <Text style={styles.bannerButtonText}>Explorar componentes</Text>
          <UiIcon color={colors.inverseText} name="arrowRight" size={28} />
        </View>
      </Pressable>

      <SectionTitle title="Buscá por categoría" />
      {isLoading ? (
        <ActivityIndicator color={colors.text} style={styles.categoriesState} />
      ) : error ? (
        <View style={styles.categoriesState}>
          <Text style={styles.stateText}>{error}</Text>
          <Pressable onPress={() => void loadHome()} style={styles.retryButton}>
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
    </ScrollView>
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
  bannerImage: { height: '100%', opacity: 0.72, position: 'absolute', resizeMode: 'cover', width: '100%' },
  bannerShade: { backgroundColor: 'rgba(0, 0, 0, 0.32)', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  bannerContent: { padding: spacing.lg },
  bannerTitle: { color: colors.text, fontSize: 29, fontWeight: '800', letterSpacing: -0.6 },
  bannerDescription: { color: colors.text, fontSize: 15, lineHeight: 19, marginTop: spacing.xs, maxWidth: 180 },
  bannerButton: { alignItems: 'center', backgroundColor: colors.text, borderRadius: radii.sm, bottom: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', left: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 10, position: 'absolute', right: spacing.sm },
  bannerButtonText: { color: colors.inverseText, fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.8 },
  categories: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingRight: 52 },
  categoriesState: { marginHorizontal: spacing.lg, marginTop: spacing.lg },
  stateText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
  retryButton: { alignSelf: 'center', marginTop: spacing.sm, padding: spacing.sm },
  retryText: { color: colors.text, fontWeight: '700' },
  scrollHint: { backgroundColor: colors.border, borderRadius: 2, height: 3, marginLeft: spacing.lg, marginTop: spacing.md, width: 54 },
  scrollHintActive: { backgroundColor: colors.text, borderRadius: 2, height: 3, width: 27 },
  helpCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', gap: spacing.md, marginHorizontal: spacing.lg, marginTop: spacing.xl, padding: spacing.md },
  helpText: { color: colors.text, flex: 1, fontSize: 13 },
});
