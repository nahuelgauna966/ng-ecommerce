import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import { useAuth } from '../context/AuthContext';
import { useIsMounted } from '../hooks/useIsMounted';
import { getErrorMessage, usersApi } from '../services/api';
import { colors } from '../theme';

type CustomerStackParamList = { EditProfile: undefined; Profile: undefined };
type EditProfileScreenProps = NativeStackScreenProps<CustomerStackParamList, 'EditProfile'>;

const profileSchema = z
  .object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
    email: z.email('Ingresá un email válido.'),
    password: z.string().refine((value) => value === '' || value.length >= 8, 'La contraseña debe tener al menos 8 caracteres.'),
    confirmPassword: z.string(),
    currentPassword: z.string(),
  })
  .refine((data) => !data.password || data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })
  .refine((data) => !data.password || Boolean(data.currentPassword), {
    message: 'Ingresá tu contraseña actual.',
    path: ['currentPassword'],
  });

type ProfileFormData = z.infer<typeof profileSchema>;

export default function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const { updateUser, user } = useAuth();
  const [initialValues, setInitialValues] = useState<{ name: string; email: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const isMounted = useIsMounted();
  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', currentPassword: '' },
  });

  useEffect(() => {
    let isActive = true;
    void usersApi.getMe().then(({ data }) => {
      if (!isActive) {
        return;
      }
      const values = { name: data.name, email: data.email };
      setInitialValues(values);
      reset({ ...values, password: '', confirmPassword: '', currentPassword: '' });
    }).catch((error) => {
      if (isActive) {
        setSubmitError(getErrorMessage(error));
      }
    });
    return () => {
      isActive = false;
    };
  }, [reset]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!initialValues) return;
    setSubmitError(null);
    setSuccess(null);
    const payload = {
      ...(data.name !== initialValues.name ? { name: data.name } : {}),
      ...(data.email !== initialValues.email ? { email: data.email } : {}),
      ...(data.password ? { password: data.password, currentPassword: data.currentPassword } : {}),
    };
    if (Object.keys(payload).length === 0) {
      setSuccess('No hay cambios para guardar.');
      return;
    }
    try {
      const { data: updatedProfile } = await usersApi.updateMe(payload);
      if (!isMounted.current) {
        return;
      }
      updateUser({ id: updatedProfile.id, email: updatedProfile.email, role: user?.role ?? 'customer' });
      setInitialValues({ name: updatedProfile.name, email: updatedProfile.email });
      reset({ name: updatedProfile.name, email: updatedProfile.email, password: '', confirmPassword: '', currentPassword: '' });
      setSuccess(data.email !== initialValues.email ? 'Perfil actualizado. El cambio de email podría afectar tu sesión.' : 'Perfil actualizado correctamente.');
    } catch (error) {
      if (isMounted.current) {
        setSubmitError(getErrorMessage(error));
      }
    }
  };

  if (!initialValues) return <View style={styles.centered}><ActivityIndicator size="large" /></View>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Field control={control} error={errors.name?.message} label="Nombre" name="name" />
      <Field autoCapitalize="none" autoComplete="email" control={control} error={errors.email?.message} keyboardType="email-address" label="Email" name="email" />
      <Field autoComplete="new-password" control={control} error={errors.password?.message} label="Nueva contraseña (opcional)" name="password" secureTextEntry />
      <Field autoComplete="new-password" control={control} error={errors.confirmPassword?.message} label="Confirmar nueva contraseña" name="confirmPassword" secureTextEntry />
      <Field autoComplete="current-password" control={control} error={errors.currentPassword?.message} label="Contraseña actual" name="currentPassword" secureTextEntry />
      {submitError && <Text style={styles.error}>{submitError}</Text>}
      {success && <Text style={styles.success}>{success}</Text>}
      <Pressable disabled={isSubmitting} onPress={handleSubmit(onSubmit)} style={({ pressed }) => [styles.button, (pressed || isSubmitting) && styles.disabled]}>
        {isSubmitting ? <ActivityIndicator color={colors.interactiveText} /> : <Text style={styles.buttonText}>Guardar cambios</Text>}
      </Pressable>
      <Pressable onPress={() => navigation.goBack()} style={styles.cancelButton}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
    </ScrollView>
  );
}

function Field({ control, error, label, name, ...inputProps }: { control: ReturnType<typeof useForm<ProfileFormData>>['control']; error?: string; label: string; name: keyof ProfileFormData } & React.ComponentProps<typeof TextInput>) {
  return <Controller control={control} name={name} render={({ field: { onBlur, onChange, value } }) => <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput onBlur={onBlur} onChangeText={onChange} style={styles.input} value={value} {...inputProps} />{error && <Text style={styles.error}>{error}</Text>}</View>} />;
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, padding: 24 }, centered: { alignItems: 'center', flex: 1, justifyContent: 'center' }, field: { marginBottom: 16 }, label: { color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 6 }, input: { borderColor: colors.border, borderRadius: 8, borderWidth: 1, color: colors.text, fontSize: 16, padding: 12 }, error: { color: colors.error, marginTop: 5 }, success: { color: colors.success, marginBottom: 16 }, button: { alignItems: 'center', backgroundColor: colors.interactive, borderRadius: 8, marginTop: 8, padding: 15 }, buttonText: { color: colors.interactiveText, fontSize: 16, fontWeight: '700' }, cancelButton: { alignItems: 'center', marginTop: 16, padding: 12 }, cancelText: { color: colors.info, fontWeight: '700' }, disabled: { opacity: 0.6 },
});