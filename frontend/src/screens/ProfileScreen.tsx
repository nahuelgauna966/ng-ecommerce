import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '../context/AuthContext';
import { getErrorMessage, ordersApi, usersApi, type UserProfile } from '../services/api';
import { colors } from '../theme';

type CustomerStackParamList = {
  EditProfile: undefined;
  MyOrders: undefined;
};

const dateFormatter = new Intl.DateTimeFormat('es-AR', { dateStyle: 'long' });

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CustomerStackParamList>>();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setError(null);
      const [profileResponse, ordersResponse] = await Promise.all([
        usersApi.getMe(),
        ordersApi.getMyOrders(),
      ]);
      setProfile(profileResponse.data);
      setOrderCount(ordersResponse.data.length);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }, []);

  useEffect(() => {
    void loadProfile().finally(() => setIsLoading(false));
  }, [loadProfile]);

  const refresh = async () => {
    setIsRefreshing(true);
    await loadProfile();
    setIsRefreshing(false);
  };

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

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
        <Pressable onPress={() => void refresh()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  const initial = profile.name.trim().charAt(0).toUpperCase();

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl onRefresh={() => void refresh()} refreshing={isRefreshing} />}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <Text style={styles.name}>{profile.name}</Text>
      <Text style={styles.email}>{profile.email}</Text>

      <View style={styles.infoCard}>
        <InfoRow label="Miembro desde" value={dateFormatter.format(new Date(profile.createdAt))} />
        <InfoRow label="Pedidos realizados" value={String(orderCount ?? 0)} />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('MyOrders')}
        style={({ pressed }) => [styles.ordersButton, pressed && styles.buttonPressed]}
      >
        <Text style={styles.ordersButtonText}>Mis Pedidos</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('EditProfile')}
        style={({ pressed }) => [styles.editButton, pressed && styles.buttonPressed]}
      >
        <Text style={styles.editButtonText}>Editar perfil</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={confirmLogout}
        style={({ pressed }) => [styles.logoutButton, pressed && styles.buttonPressed]}
      >
        <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  centered: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.info,
    borderRadius: 48,
    height: 96,
    justifyContent: 'center',
    width: 96,
  },
  avatarText: {
    color: colors.interactiveText,
    fontSize: 40,
    fontWeight: '700',
  },
  name: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
  },
  email: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 8,
  },
  infoCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 28,
  },
  infoRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  infoLabel: {
    color: colors.textSecondary,
  },
  infoValue: {
    color: colors.text,
    fontWeight: '600',
  },
  ordersButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.interactive,
    borderRadius: 8,
    marginTop: 32,
    padding: 14,
  },
  buttonPressed: {
    opacity: 0.75,
  },
  ordersButtonText: {
    color: colors.interactiveText,
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderColor: colors.error,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  editButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderColor: colors.info,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  editButtonText: {
    color: colors.info,
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '700',
  },
  error: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    padding: 10,
  },
  retryButtonText: {
    color: colors.info,
    fontSize: 16,
    fontWeight: '700',
  },
});
