import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import axios from 'axios';
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
import { colors } from '../theme';

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

type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const registerSchema = z
  .object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
    email: z.email('Ingresá un email válido.'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres.')
      .regex(/[A-Z]/, 'La contraseña debe incluir una mayúscula.')
      .regex(/\d/, 'La contraseña debe incluir un número.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async ({
    confirmPassword: _confirmPassword,
    ...data
  }: RegisterFormData) => {
    setSubmitError(null);
    try {
      await authApi.register(data);
      const response = await authApi.login({
        email: data.email,
        password: data.password,
      });
      await login(response.data.access_token);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setSubmitError('Ya existe una cuenta registrada con este email.');
        return;
      }
      setSubmitError(getErrorMessage(error));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>
      <Text style={styles.subtitle}>Registrate para comenzar a comprar.</Text>

      <Controller
        control={control}
        name="name"
        render={({ field: { onBlur, onChange, value } }) => (
          <Field label="Nombre" error={errors.name?.message}>
            <TextInput
              autoComplete="name"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Tu nombre"
              style={styles.input}
              value={value}
            />
          </Field>
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onBlur, onChange, value } }) => (
          <Field label="Email" error={errors.email?.message}>
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
          </Field>
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onBlur, onChange, value } }) => (
          <Field label="Contraseña" error={errors.password?.message}>
            <TextInput
              autoComplete="new-password"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Mínimo 8 caracteres"
              secureTextEntry
              style={styles.input}
              value={value}
            />
          </Field>
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onBlur, onChange, value } }) => (
          <Field label="Confirmar contraseña" error={errors.confirmPassword?.message}>
            <TextInput
              autoComplete="new-password"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Repetí tu contraseña"
              secureTextEntry
              style={styles.input}
              value={value}
            />
          </Field>
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
          <ActivityIndicator color={colors.interactiveText} />
        ) : (
          <Text style={styles.buttonText}>Crear cuenta</Text>
        )}
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>¿Ya tenés cuenta? Iniciá sesión</Text>
      </Pressable>
    </View>
  );
}

function Field({
  children,
  error,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    marginBottom: 28,
    marginTop: 8,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    padding: 12,
  },
  error: {
    color: colors.error,
    marginTop: 4,
  },
  submitError: {
    color: colors.error,
    marginBottom: 16,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.interactive,
    borderRadius: 8,
    marginBottom: 20,
    padding: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.interactiveText,
    fontSize: 16,
    fontWeight: '700',
  },
  link: {
    color: colors.info,
    fontSize: 15,
    textAlign: 'center',
  },
});
