import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEffect } from 'react';

import { type ProtectedRouteName, useAuth } from '../context/AuthContext';
import { useCartStore } from '../store/cartStore';
import CartScreen from '../screens/CartScreen';
import CatalogScreen from '../screens/CatalogScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import MyOrdersScreen from '../screens/MyOrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RegisterScreen from '../screens/RegisterScreen';

type AuthStackParamList = {
  Home: undefined;
  Catalog: undefined;
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
  Catalog: undefined;
  ProductDetail: { id: number };
  Cart: undefined;
  Checkout: undefined;
  MyOrders: undefined;
  OrderDetail: { id: number };
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
      <ActivityIndicator size="large" />
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

function CartHeaderButton({ onPress }: { onPress: () => void }) {
  const totalItems = useCartStore((state) => state.totalItems());

  return (
    <Pressable
      accessibilityLabel={`Carrito con ${totalItems} productos`}
      onPress={onPress}
      style={styles.cartHeaderButton}
    >
      <Text style={styles.cartIcon}>🛒</Text>
      {totalItems > 0 && (
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>{totalItems}</Text>
        </View>
      )}
    </Pressable>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator initialRouteName="Home">
      <AuthStack.Screen name="Home" component={HomeScreen} />
      <AuthStack.Screen name="Catalog" component={CatalogScreen} />
      <AuthStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: 'Producto' }}
      />
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Iniciar sesión' }}
      />
      <AuthStack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Crear cuenta' }}
      />
      <AuthStack.Screen name="Cart" options={{ title: 'Carrito' }}>
        {({ navigation }) => (
          <ProtectedRoute
            destination="Cart"
            redirectToLogin={() => navigation.replace('Login')}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name="Checkout" options={{ title: 'Checkout' }}>
        {({ navigation }) => (
          <ProtectedRoute
            destination="Checkout"
            redirectToLogin={() => navigation.replace('Login')}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name="MyOrders" options={{ title: 'Mis pedidos' }}>
        {({ navigation }) => (
          <ProtectedRoute
            destination="MyOrders"
            redirectToLogin={() => navigation.replace('Login')}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name="Profile" options={{ title: 'Perfil' }}>
        {({ navigation }) => (
          <ProtectedRoute
            destination="Profile"
            redirectToLogin={() => navigation.replace('Login')}
          />
        )}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

function ProtectedRoute({
  destination,
  redirectToLogin,
}: {
  destination: ProtectedRouteName;
  redirectToLogin: () => void;
}) {
  const { requestProtectedRoute } = useAuth();

  useEffect(() => {
    requestProtectedRoute(destination);
    redirectToLogin();
  }, [destination, redirectToLogin, requestProtectedRoute]);

  return <LoadingScreen />;
}

function CustomerNavigator({
  initialRouteName,
}: {
  initialRouteName: ProtectedRouteName | null;
}) {
  const { clearIntendedRoute, logout } = useAuth();

  useEffect(() => {
    clearIntendedRoute();
  }, [clearIntendedRoute]);

  const confirmLogout = () => {
    Alert.alert('Cerrar sesión', '¿Querés cerrar sesión?', [
      { style: 'cancel', text: 'Cancelar' },
      {
        style: 'destructive',
        text: 'Cerrar sesión',
        onPress: () => void logout(),
      },
    ]);
  };

  return (
    <CustomerStack.Navigator initialRouteName={initialRouteName ?? 'Home'}>
      <CustomerStack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerRight: () => (
            <Pressable onPress={confirmLogout} style={styles.headerLogout}>
              <Text style={styles.headerLogoutText}>Salir</Text>
            </Pressable>
          ),
        }}
      />
      <CustomerStack.Screen
        name="Catalog"
        component={CatalogScreen}
        options={({ navigation }) => ({
          headerRight: () => (
            <CartHeaderButton onPress={() => navigation.navigate('Cart')} />
          ),
        })}
      />
      <CustomerStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={({ navigation }) => ({
          title: 'Producto',
          headerRight: () => (
            <CartHeaderButton onPress={() => navigation.navigate('Cart')} />
          ),
        })}
      />
      <CustomerStack.Screen name="Cart" component={CartScreen} />
      <CustomerStack.Screen name="Checkout" component={CheckoutScreen} />
      <CustomerStack.Screen
        name="MyOrders"
        component={MyOrdersScreen}
        options={{ title: 'Mis pedidos' }}
      />
      <CustomerStack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: 'Pedido' }}
      />
      <CustomerStack.Screen name="Profile" component={ProfileScreen} />
    </CustomerStack.Navigator>
  );
}

function AdminNavigator() {
  const { logout } = useAuth();

  const confirmLogout = () => {
    Alert.alert('Cerrar sesión', '¿Querés cerrar sesión?', [
      { style: 'cancel', text: 'Cancelar' },
      {
        style: 'destructive',
        text: 'Cerrar sesión',
        onPress: () => void logout(),
      },
    ]);
  };

  return (
    <AdminStack.Navigator initialRouteName="Dashboard">
      <AdminStack.Screen
        name="Dashboard"
        options={{
          title: 'Dashboard',
          headerRight: () => (
            <Pressable onPress={confirmLogout} style={styles.headerLogout}>
              <Text style={styles.headerLogoutText}>Salir</Text>
            </Pressable>
          ),
        }}
      >
        {() => <AdminPlaceholderScreen title="Dashboard" />}
      </AdminStack.Screen>
      <AdminStack.Screen name="Products" options={{ title: 'Productos' }}>
        {() => <AdminPlaceholderScreen title="Productos" />}
      </AdminStack.Screen>
      <AdminStack.Screen name="Categories" options={{ title: 'Categorías' }}>
        {() => <AdminPlaceholderScreen title="Categorías" />}
      </AdminStack.Screen>
      <AdminStack.Screen name="Orders" options={{ title: 'Pedidos' }}>
        {() => <AdminPlaceholderScreen title="Pedidos" />}
      </AdminStack.Screen>
      <AdminStack.Screen name="Users" options={{ title: 'Usuarios' }}>
        {() => <AdminPlaceholderScreen title="Usuarios" />}
      </AdminStack.Screen>
    </AdminStack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, isLoading, intendedRoute } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthNavigator />;
  }

  return user.role === 'admin' ? (
    <AdminNavigator />
  ) : (
    <CustomerNavigator initialRouteName={intendedRoute} />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '600',
  },
  headerLogout: {
    padding: 8,
  },
  headerLogoutText: {
    color: '#dc2626',
    fontSize: 15,
    fontWeight: '600',
  },
  cartHeaderButton: {
    padding: 8,
    position: 'relative',
  },
  cartIcon: {
    fontSize: 21,
  },
  cartBadge: {
    alignItems: 'center',
    backgroundColor: '#dc2626',
    borderRadius: 9,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    position: 'absolute',
    right: 0,
    top: 2,
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
