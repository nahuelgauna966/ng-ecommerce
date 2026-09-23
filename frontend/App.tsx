import { NavigationContainer } from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { apiConfiguration } from './src/config/api-config';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { colors, radii, spacing } from './src/theme';

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
  if (apiConfiguration.error) {
    return (
      <SafeAreaProvider>
        <View style={styles.configurationErrorScreen}>
          <View style={styles.configurationErrorCard}>
            <Text style={styles.configurationErrorTitle}>
              Configuración del servidor
            </Text>
            <Text style={styles.configurationErrorMessage}>
              {apiConfiguration.error}
            </Text>
            <Text style={styles.configurationErrorHint}>
              En Expo Go usá la IP local de la computadora, por ejemplo:
              {'\n'}http://192.168.1.10:3000/api/v1
            </Text>
          </View>
        </View>
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

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

const styles = StyleSheet.create({
  configurationErrorScreen: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  configurationErrorCard: {
    backgroundColor: colors.errorSurface,
    borderColor: colors.error,
    borderRadius: radii.md,
    borderWidth: 1,
    maxWidth: 420,
    padding: spacing.lg,
    width: '100%',
  },
  configurationErrorTitle: {
    color: colors.error,
    fontSize: 20,
    fontWeight: '700',
  },
  configurationErrorMessage: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.md,
  },
  configurationErrorHint: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.lg,
  },
});
