import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { z } from 'zod';

import { useAuth } from '../context/AuthContext';
import { authApi, getErrorMessage } from '../services/api';

type AuthStackParamList = {
  Home: undefined;
  Catalog: undefined;
  ProductDetail: undefined;
  Login: undefined;
  Register: undefined;
  Cart: undefined;
  Checkout: undefined;
  MyOrders: undefined;
  Profile: undefined;
};

type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const loginSchema = z.object({
  email: z.email('Ingresá un email válido.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setSubmitError(null);
    try {
      const response = await authApi.login(data);
      await login(response.data.access_token);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar sesión</Text>
      <Text style={styles.subtitle}>Ingresá para continuar con tu compra.</Text>

      <Controller
        control={control}
        name="email"
        render={({ field: { onBlur, onChange, value } }) => (
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="tu@email.com"
              style={styles.input}
              value={value}
            />
            {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}
          </View>
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onBlur, onChange, value } }) => (
          <View style={styles.field}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              autoComplete="current-password"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="********"
              secureTextEntry
              style={styles.input}
              value={value}
            />
            {errors.password && (
              <Text style={styles.error}>{errors.password.message}</Text>
            )}
          </View>
        )}
      />

      {submitError && <Text style={styles.submitError}>{submitError}</Text>}

      <Pressable
        disabled={isSubmitting}
        onPress={handleSubmit(onSubmit)}
        style={({ pressed }) => [
          styles.button,
          (pressed || isSubmitting) && styles.buttonDisabled,
        ]}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Ingresar</Text>
        )}
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>¿No tenés cuenta? Registrate</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#4b5563',
    fontSize: 16,
    marginBottom: 28,
    marginTop: 8,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderColor: '#9ca3af',
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    padding: 12,
  },
  error: {
    color: '#dc2626',
    marginTop: 4,
  },
  submitError: {
    color: '#dc2626',
    marginBottom: 16,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 8,
    marginBottom: 20,
    padding: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  link: {
    color: '#2563eb',
    fontSize: 15,
    textAlign: 'center',
  },
});
