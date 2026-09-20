import { NavigationContainer } from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

const linking = {
  prefixes: ['ng-ecommerce://'],
  config: {
    screens: {
      Checkout: 'payment-cancel',
      MyOrders: 'payment-success',
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StripeProvider
        publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''}
        urlScheme="ng-ecommerce"
      >
        <AuthProvider>
          <NavigationContainer linking={linking}>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </StripeProvider>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
