import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect } from 'react';

import AppHeader from '../components/AppHeader';
import { type ProtectedRouteName, useAuth } from '../context/AuthContext';
import CartScreen from '../screens/CartScreen';
import CatalogScreen from '../screens/CatalogScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import MyOrdersScreen from '../screens/MyOrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import PaymentErrorScreen from '../screens/PaymentErrorScreen';
import PaymentSuccessScreen from '../screens/PaymentSuccessScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RegisterScreen from '../screens/RegisterScreen';
import { colors } from '../theme';

type CatalogParams = { categoryId?: number; focusSearch?: boolean; search?: string } | undefined;

type AuthStackParamList = {
  Home: undefined;
  Catalog: CatalogParams;
  ProductDetail: { id: number };
  Login: undefined;
  Register: undefined;
  Cart: undefined;
  Checkout: undefined;
  MyOrders: undefined;
  Profile: undefined;
};

type CustomerStackParamList = {
  Home: undefined;
  Catalog: CatalogParams;
  ProductDetail: { id: number };
  Cart: undefined;
  Checkout: undefined;
  MyOrders: undefined;
  OrderDetail: { id: number };
  PaymentError: { clientSecret: string | null; message: string; orderId: number; total: string };
  PaymentSuccess: { orderId: number; total: string };
  EditProfile: undefined;
  Profile: undefined;
};

type AdminStackParamList = {
  Dashboard: undefined;
  Products: undefined;
  Categories: undefined;
  Orders: undefined;
  Users: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const CustomerStack = createNativeStackNavigator<CustomerStackParamList>();
const AdminStack = createNativeStackNavigator<AdminStackParamList>();

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator color={colors.text} size="large" />
      <Text style={styles.loadingText}>Cargando sesión...</Text>
    </View>
  );
}

function AdminPlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>{title}</Text>
    </View>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      initialRouteName="Home"
      screenOptions={({ navigation }) => ({
        contentStyle: { backgroundColor: colors.background },
        header: ({ back }) => <AppHeader navigation={navigation} showBack={Boolean(back)} />,
      })}
    >
      <AuthStack.Screen name="Home" component={HomeScreen} />
      <AuthStack.Screen name="Catalog" component={CatalogScreen} />
      <AuthStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="Cart">
        {({ navigation }) => <ProtectedRoute destination="Cart" redirectToLogin={() => navigation.replace('Login')} />}
      </AuthStack.Screen>
      <AuthStack.Screen name="Checkout">
        {({ navigation }) => <ProtectedRoute destination="Checkout" redirectToLogin={() => navigation.replace('Login')} />}
      </AuthStack.Screen>
      <AuthStack.Screen name="MyOrders">
        {({ navigation }) => <ProtectedRoute destination="MyOrders" redirectToLogin={() => navigation.replace('Login')} />}
      </AuthStack.Screen>
      <AuthStack.Screen name="Profile">
        {({ navigation }) => <ProtectedRoute destination="Profile" redirectToLogin={() => navigation.replace('Login')} />}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

function ProtectedRoute({ destination, redirectToLogin }: { destination: ProtectedRouteName; redirectToLogin: () => void }) {
  const { requestProtectedRoute } = useAuth();

  useEffect(() => {
    requestProtectedRoute(destination);
    redirectToLogin();
  }, [destination, redirectToLogin, requestProtectedRoute]);

  return <LoadingScreen />;
}

function CustomerNavigator({ initialRouteName }: { initialRouteName: ProtectedRouteName | null }) {
  const { clearIntendedRoute } = useAuth();

  useEffect(() => {
    clearIntendedRoute();
  }, [clearIntendedRoute]);

  return (
    <CustomerStack.Navigator
      initialRouteName={initialRouteName ?? 'Home'}
      screenOptions={({ navigation }) => ({
        contentStyle: { backgroundColor: colors.background },
        header: ({ back }) => <AppHeader navigation={navigation} showBack={Boolean(back)} />,
      })}
    >
      <CustomerStack.Screen name="Home" component={HomeScreen} />
      <CustomerStack.Screen name="Catalog" component={CatalogScreen} />
      <CustomerStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <CustomerStack.Screen name="Cart" component={CartScreen} />
      <CustomerStack.Screen name="Checkout" component={CheckoutScreen} />
      <CustomerStack.Screen name="MyOrders" component={MyOrdersScreen} />
      <CustomerStack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <CustomerStack.Screen name="PaymentError" component={PaymentErrorScreen} options={{ gestureEnabled: false, headerBackVisible: false }} />
      <CustomerStack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} options={{ gestureEnabled: false, headerBackVisible: false }} />
      <CustomerStack.Screen name="EditProfile" component={EditProfileScreen} />
      <CustomerStack.Screen name="Profile" component={ProfileScreen} />
    </CustomerStack.Navigator>
  );
}

function AdminNavigator() {
  const { logout } = useAuth();
  const confirmLogout = () => {
    Alert.alert('Cerrar sesión', '¿Querés cerrar sesión?', [
      { style: 'cancel', text: 'Cancelar' },
      { style: 'destructive', text: 'Cerrar sesión', onPress: () => void logout() },
    ]);
  };

  return (
    <AdminStack.Navigator initialRouteName="Dashboard">
      <AdminStack.Screen name="Dashboard" options={{ title: 'Dashboard', headerRight: () => <Pressable onPress={confirmLogout} style={styles.headerLogout}><Text style={styles.headerLogoutText}>Salir</Text></Pressable> }}>
        {() => <AdminPlaceholderScreen title="Dashboard" />}
      </AdminStack.Screen>
      <AdminStack.Screen name="Products" options={{ title: 'Productos' }}>{() => <AdminPlaceholderScreen title="Productos" />}</AdminStack.Screen>
      <AdminStack.Screen name="Categories" options={{ title: 'Categorías' }}>{() => <AdminPlaceholderScreen title="Categorías" />}</AdminStack.Screen>
      <AdminStack.Screen name="Orders" options={{ title: 'Pedidos' }}>{() => <AdminPlaceholderScreen title="Pedidos" />}</AdminStack.Screen>
      <AdminStack.Screen name="Users" options={{ title: 'Usuarios' }}>{() => <AdminPlaceholderScreen title="Usuarios" />}</AdminStack.Screen>
    </AdminStack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, isLoading, intendedRoute } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <AuthNavigator />;
  return user.role === 'admin' ? <AdminNavigator /> : <CustomerNavigator initialRouteName={intendedRoute} />;
}

const styles = StyleSheet.create({
  loadingContainer: { alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center', padding: 24 },
  loadingText: { color: colors.text, fontSize: 20, fontWeight: '600', marginTop: 12 },
  headerLogout: { padding: 8 },
  headerLogoutText: { color: colors.error, fontSize: 15, fontWeight: '600' },
});
