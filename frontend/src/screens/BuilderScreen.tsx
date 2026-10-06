import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import UiIcon from '../components/UiIcon';
import {
  compatibilityApi,
  getErrorMessage,
  productsApi,
  type CompatibilityResult,
  type ComponentType,
  type Product,
} from '../services/api';
import {
  OPTIONAL_COMPONENTS,
  REQUIRED_COMPONENTS,
  useBuilderStore,
} from '../store/builderStore';
import { useCartStore } from '../store/cartStore';
import { colors, radii, spacing } from '../theme';

type BuilderStackParamList = { Builder: undefined; Cart: undefined };
type BuilderScreenProps = NativeStackScreenProps<BuilderStackParamList, 'Builder'>;

const COMPONENT_LABELS: Record<ComponentType, string> = {
  cpu: 'Procesador',
  motherboard: 'Placa madre',
  ram: 'Memoria RAM',
  gpu: 'Placa de video',
  psu: 'Fuente',
  case: 'Gabinete',
  cooler: 'Refrigeración',
  storage: 'Almacenamiento',
  peripheral: 'Periférico',
  other: 'Otro',
};

const STATUS_LABELS = {
  compatible: 'Compatible',
  incompatible: 'Incompatible',
  incomplete: 'Incompleto',
} as const;

export default function BuilderScreen(_props: BuilderScreenProps) {
  const currentStep = useBuilderStore((state) => state.currentStep);
  const selectedProducts = useBuilderStore((state) => state.selectedProducts);
  const selectProduct = useBuilderStore((state) => state.selectProduct);
  const setStep = useBuilderStore((state) => state.setStep);
  const removeProduct = useBuilderStore((state) => state.removeProduct);
  const reset = useBuilderStore((state) => state.reset);
  const cartItems = useCartStore((state) => state.items);
  const addToCart = useCartStore((state) => state.addItem);
  const [optionalPicker, setOptionalPicker] = useState<ComponentType | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [compatibility, setCompatibility] = useState<CompatibilityResult | null>(null);
  const [compatibilityError, setCompatibilityError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const productRequestId = useRef(0);
  const compatibilityRequestId = useRef(0);

  const requiredType = currentStep < REQUIRED_COMPONENTS.length
    ? REQUIRED_COMPONENTS[currentStep]
    : null;
  const pickerType = optionalPicker ?? requiredType;
  const selectedIds = Object.values(selectedProducts)
    .filter((product): product is Product => Boolean(product))
    .map((product) => product.id)
    .sort((first, second) => first - second);
  const selectedIdsKey = selectedIds.join(',');

  const loadProducts = useCallback(async (componentType: ComponentType, requestId: number) => {
    try {
      setProductsError(null);
      const response = await productsApi.getAll(1, 50, undefined, undefined, undefined, componentType);
      if (requestId !== productRequestId.current) return;
      setProducts(response.data.data);
    } catch (error: unknown) {
      if (requestId !== productRequestId.current) return;
      setProductsError(getErrorMessage(error));
      setProducts([]);
    } finally {
      if (requestId === productRequestId.current) setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    const requestId = ++productRequestId.current;
    if (!pickerType) {
      setProducts([]);
      setProductsError(null);
      setIsLoadingProducts(false);
      return;
    }
    setIsLoadingProducts(true);
    void loadProducts(pickerType, requestId);
    return () => {
      productRequestId.current += 1;
    };
  }, [loadProducts, pickerType, reloadKey]);

  useEffect(() => {
    const requestId = ++compatibilityRequestId.current;
    const productIds = selectedIdsKey ? selectedIdsKey.split(',').map(Number) : [];
    if (productIds.length === 0) {
      setCompatibility(null);
      setCompatibilityError(null);
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    setCompatibilityError(null);
    void compatibilityApi.validate(productIds).then(({ data }) => {
      if (requestId === compatibilityRequestId.current) setCompatibility(data);
    }).catch((error: unknown) => {
      if (requestId === compatibilityRequestId.current) {
        setCompatibilityError(getErrorMessage(error));
        setCompatibility(null);
      }
    }).finally(() => {
      if (requestId === compatibilityRequestId.current) setIsChecking(false);
    });

    return () => {
      compatibilityRequestId.current += 1;
    };
  }, [selectedIdsKey]);

  const retryProducts = () => setReloadKey((key) => key + 1);
  const chooseProduct = (product: Product) => {
    if (!pickerType) return;
    selectProduct(pickerType, product);
    if (OPTIONAL_COMPONENTS.includes(pickerType)) setOptionalPicker(null);
  };

  const pickerTitle = pickerType ? COMPONENT_LABELS[pickerType] : '';
  const buildTotal = Object.values(selectedProducts).reduce(
    (total, product) => total + (product ? Number(product.price) : 0),
    0,
  );
  const hasAllRequired = REQUIRED_COMPONENTS.every((type) => selectedProducts[type]);
  const cannotAddToCart = !hasAllRequired
    || isAddingToCart
    || isChecking
    || compatibility?.status === 'incompatible';

  const addBuildToCart = () => {
    setTransferError(null);
    if (!hasAllRequired) {
      setTransferError('Completá todos los componentes obligatorios antes de agregar el armado.');
      return;
    }

    const productsToAdd = Object.values(selectedProducts).filter(
      (product): product is Product => Boolean(product),
    );
    const unavailableProduct = productsToAdd.find((product) => {
      const stock = product.stock?.quantity;
      const cartQuantity = cartItems.find((item) => item.productId === product.id)?.quantity ?? 0;
      return stock === undefined || cartQuantity + 1 > stock;
    });

    if (unavailableProduct) {
      setTransferError(`No hay stock suficiente para agregar ${unavailableProduct.name}. Actualizá el armado e intentá nuevamente.`);
      return;
    }
    if (compatibility?.status === 'incompatible') {
      setTransferError('Corregí las incompatibilidades indicadas antes de agregar el armado.');
      return;
    }

    setIsAddingToCart(true);
    productsToAdd.forEach((product) => addToCart(product, 1));
    setIsAddingToCart(false);
    _props.navigation.navigate('Cart');
  };

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>CONFIGURADOR</Text>
        <Text style={styles.title}>Armá tu PC</Text>
        <Text style={styles.description}>Elegí tus componentes y revisá las reglas de compatibilidad disponibles.</Text>
      </View>

      <View style={styles.progressTrack}>
        {REQUIRED_COMPONENTS.map((type, index) => {
          const isSelected = Boolean(selectedProducts[type]);
          const isCurrent = requiredType === type;
          return (
            <Pressable
              accessibilityLabel={`${COMPONENT_LABELS[type]}${isSelected ? ', seleccionado' : ''}`}
              accessibilityRole="button"
              key={type}
              onPress={() => { setOptionalPicker(null); setStep(index); }}
              style={[styles.progressItem, isCurrent && styles.progressItemCurrent, isSelected && styles.progressItemSelected]}
            >
              <Text style={[styles.progressNumber, isSelected && styles.progressNumberSelected]}>
                {isSelected ? '✓' : index + 1}
              </Text>
              <Text numberOfLines={1} style={[styles.progressLabel, isCurrent && styles.progressLabelCurrent]}>
                {COMPONENT_LABELS[type]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {pickerType ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Elegí {pickerTitle.toLocaleLowerCase()}</Text>
          <Text style={styles.sectionDescription}>Mostramos productos activos con stock disponible.</Text>
          {isLoadingProducts ? (
            <ActivityIndicator color={colors.text} style={styles.loader} size="large" />
          ) : productsError ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{productsError}</Text>
              <ActionButton label="Reintentar" onPress={retryProducts} />
            </View>
          ) : products.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay {pickerTitle.toLocaleLowerCase()} disponibles con stock en este momento.</Text>
              {optionalPicker ? <ActionButton label="Volver al armado" onPress={() => setOptionalPicker(null)} /> : null}
            </View>
          ) : (
            products.map((product) => (
              <ProductOption
                key={product.id}
                onPress={() => chooseProduct(product)}
                product={product}
                selected={selectedProducts[pickerType]?.id === product.id}
              />
            ))
          )}
          {optionalPicker ? <ActionButton label="Volver al armado" onPress={() => setOptionalPicker(null)} /> : null}
        </View>
      ) : (
        <View style={styles.section}>
          <View style={styles.summaryHeading}>
            <View>
              <Text style={styles.sectionTitle}>Tu armado</Text>
              <Text style={styles.sectionDescription}>Componentes elegidos y validación.</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={reset} style={styles.resetButton}>
              <Text style={styles.resetText}>Reiniciar</Text>
            </Pressable>
          </View>
          {REQUIRED_COMPONENTS.map((type, index) => (
            <SelectedProductRow
              key={type}
              onPress={() => setStep(index)}
              product={selectedProducts[type]}
              required
              type={type}
            />
          ))}
          {OPTIONAL_COMPONENTS.map((type) => (
            <SelectedProductRow
              key={type}
              onPress={() => setOptionalPicker(type)}
              onRemove={selectedProducts[type] ? () => removeProduct(type) : undefined}
              product={selectedProducts[type]}
              type={type}
            />
          ))}
          <View style={styles.optionalActions}>
            {OPTIONAL_COMPONENTS.filter((type) => !selectedProducts[type]).map((type) => (
              <Pressable accessibilityRole="button" key={type} onPress={() => setOptionalPicker(type)} style={styles.optionalButton}>
                <Text style={styles.optionalButtonText}>+ {COMPONENT_LABELS[type]}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total estimado</Text>
            <Text style={styles.totalValue}>${buildTotal.toFixed(2)}</Text>
          </View>
          <CompatibilityPanel
            error={compatibilityError}
            isChecking={isChecking}
            result={compatibility}
          />
          <Text style={styles.disclaimer}>La validación cubre únicamente las reglas indicadas. No confirma dimensiones físicas ni compatibilidad de almacenamiento.</Text>
          {compatibility?.status === 'incomplete' && hasAllRequired ? (
            <Text style={styles.compatibilityNotice}>Algunas especificaciones no alcanzan para confirmar todas las reglas de compatibilidad. Revisá las advertencias antes de comprar.</Text>
          ) : null}
          {transferError ? <Text accessibilityRole="alert" style={styles.transferError}>{transferError}</Text> : null}
          {compatibility?.status === 'incompatible' ? (
            <Text style={styles.transferHint}>Este armado tiene incompatibilidades y no se puede agregar al carrito.</Text>
          ) : !hasAllRequired ? (
            <Text style={styles.transferHint}>Completá los cinco componentes obligatorios para continuar.</Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            disabled={cannotAddToCart}
            onPress={addBuildToCart}
            style={[styles.addBuildButton, cannotAddToCart && styles.addBuildButtonDisabled]}
          >
            {isAddingToCart ? <ActivityIndicator color={colors.interactiveText} /> : (
              <Text style={styles.addBuildButtonText}>Agregar armado al carrito</Text>
            )}
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

function ProductOption({ product, selected, onPress }: { product: Product; selected: boolean; onPress: () => void }) {
  const specs = product.hardwareSpecs ?? {};
  const specText = Object.entries(specs)
    .slice(0, 2)
    .map(([key, value]) => `${formatSpecName(key)}: ${Array.isArray(value) ? value.join(', ') : value}`)
    .join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.productOption, selected && styles.productOptionSelected, pressed && styles.pressed]}
    >
      <View style={styles.productCopy}>
        <Text numberOfLines={2} style={styles.productName}>{product.name}</Text>
        <Text style={styles.productMeta}>{product.brand ?? 'NG'}{specText ? ` · ${specText}` : ''}</Text>
        <Text style={styles.productPrice}>${Number(product.price).toFixed(2)}</Text>
      </View>
      <UiIcon color={selected ? colors.success : colors.textSecondary} name={selected ? 'check' : 'arrowRight'} size={22} />
    </Pressable>
  );
}

function SelectedProductRow({
  type,
  product,
  required = false,
  onPress,
  onRemove,
}: {
  type: ComponentType;
  product?: Product;
  required?: boolean;
  onPress: () => void;
  onRemove?: () => void;
}) {
  return (
    <View style={styles.selectedRow}>
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.selectedPressable}>
        <View style={styles.selectedCopy}>
          <Text style={styles.selectedType}>{COMPONENT_LABELS[type]}{required ? ' · obligatorio' : ' · opcional'}</Text>
          <Text numberOfLines={1} style={product ? styles.selectedName : styles.missingText}>
            {product?.name ?? 'Elegir componente'}
          </Text>
        </View>
        <UiIcon color={colors.textSecondary} name="arrowRight" size={20} />
      </Pressable>
      {onRemove ? (
        <Pressable accessibilityLabel={`Quitar ${COMPONENT_LABELS[type]}`} accessibilityRole="button" onPress={onRemove} style={styles.removeButton}>
          <UiIcon color={colors.error} name="close" size={19} />
        </Pressable>
      ) : null}
    </View>
  );
}

function CompatibilityPanel({
  result,
  error,
  isChecking,
}: {
  result: CompatibilityResult | null;
  error: string | null;
  isChecking: boolean;
}) {
  const status = result?.status;
  return (
    <View style={[styles.compatibilityPanel, status === 'compatible' && styles.compatiblePanel, status === 'incompatible' && styles.incompatiblePanel]}>
      <View style={styles.compatibilityHeading}>
        <Text style={styles.compatibilityTitle}>Compatibilidad</Text>
        {isChecking ? <ActivityIndicator color={colors.text} size="small" /> : status ? (
          <Text style={[styles.statusBadge, status === 'compatible' && styles.compatibleText, status === 'incompatible' && styles.incompatibleText]}>
            {STATUS_LABELS[status]}
          </Text>
        ) : null}
      </View>
      {error ? <Text style={styles.compatibilityMessage}>{error}</Text> : null}
      {!error && !result ? <Text style={styles.compatibilityMessage}>Elegí componentes para iniciar la validación.</Text> : null}
      {result?.checks.map((check, index) => (
        <Text key={`${check.rule}-${index}`} style={[styles.checkMessage, check.status === 'incompatible' && styles.incompatibleText]}>
          {check.message}
        </Text>
      ))}
    </View>
  );
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.actionButton}>
      <Text style={styles.actionButtonText}>{label}</Text>
    </Pressable>
  );
}

function formatSpecName(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (first) => first.toUpperCase());
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  intro: { marginBottom: spacing.lg },
  eyebrow: { color: colors.info, fontSize: 12, fontWeight: '800', letterSpacing: 1.3 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: spacing.xs },
  description: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: spacing.sm },
  progressTrack: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xl },
  progressItem: { alignItems: 'center', flex: 1, gap: spacing.xs },
  progressItemCurrent: {},
  progressItemSelected: {},
  progressNumber: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, color: colors.textSecondary, fontSize: 12, fontWeight: '700', height: 30, overflow: 'hidden', paddingTop: 6, textAlign: 'center', width: 30 },
  progressNumberSelected: { backgroundColor: colors.successSurface, borderColor: colors.success, color: colors.success },
  progressLabel: { color: colors.textSecondary, fontSize: 9, textAlign: 'center' },
  progressLabelCurrent: { color: colors.text, fontWeight: '700' },
  section: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg, borderWidth: 1, padding: spacing.md },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  sectionDescription: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: spacing.xs },
  loader: { padding: spacing.xl },
  emptyState: { alignItems: 'center', padding: spacing.xl },
  emptyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  actionButton: { alignItems: 'center', backgroundColor: colors.interactive, borderRadius: radii.md, marginTop: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  actionButtonText: { color: colors.interactiveText, fontSize: 14, fontWeight: '700' },
  productOption: { alignItems: 'center', backgroundColor: colors.background, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, padding: spacing.md },
  productOptionSelected: { borderColor: colors.success },
  pressed: { opacity: 0.75 },
  productCopy: { flex: 1 },
  productName: { color: colors.text, fontSize: 14, fontWeight: '700' },
  productMeta: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, marginTop: spacing.xs },
  productPrice: { color: colors.text, fontSize: 14, fontWeight: '700', marginTop: spacing.xs },
  summaryHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  resetButton: { padding: spacing.sm },
  resetText: { color: colors.info, fontSize: 13, fontWeight: '700' },
  selectedRow: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 58 },
  selectedPressable: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm },
  selectedCopy: { flex: 1 },
  selectedType: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  selectedName: { color: colors.text, fontSize: 13, fontWeight: '600', marginTop: 3 },
  missingText: { color: colors.info, fontSize: 13, marginTop: 3 },
  removeButton: { padding: spacing.sm },
  optionalActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  optionalButton: { borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  optionalButtonText: { color: colors.info, fontSize: 12, fontWeight: '700' },
  totalRow: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, paddingTop: spacing.md },
  totalLabel: { color: colors.textSecondary, fontSize: 14 },
  totalValue: { color: colors.text, fontSize: 18, fontWeight: '800' },
  compatibilityPanel: { backgroundColor: colors.infoSurface, borderRadius: radii.md, marginTop: spacing.lg, padding: spacing.md },
  compatiblePanel: { backgroundColor: colors.successSurface },
  incompatiblePanel: { backgroundColor: colors.errorSurface },
  compatibilityHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  compatibilityTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  statusBadge: { color: colors.info, fontSize: 12, fontWeight: '800' },
  compatibleText: { color: colors.success },
  incompatibleText: { color: colors.error },
  compatibilityMessage: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: spacing.sm },
  checkMessage: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: spacing.sm },
  disclaimer: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, marginTop: spacing.md },
  compatibilityNotice: { color: colors.warning, fontSize: 12, lineHeight: 17, marginTop: spacing.sm },
  transferError: { color: colors.error, fontSize: 13, lineHeight: 18, marginTop: spacing.md },
  transferHint: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: spacing.md },
  addBuildButton: { alignItems: 'center', backgroundColor: colors.interactive, borderRadius: radii.md, marginTop: spacing.lg, minHeight: 50, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  addBuildButtonDisabled: { backgroundColor: colors.disabled },
  addBuildButtonText: { color: colors.interactiveText, fontSize: 15, fontWeight: '800' },
});
