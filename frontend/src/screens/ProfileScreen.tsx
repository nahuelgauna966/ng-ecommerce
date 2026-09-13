import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { logout, user } = useAuth();

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
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={confirmLogout}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  email: {
    color: '#4b5563',
    fontSize: 16,
    marginTop: 8,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#dc2626',
    borderRadius: 8,
    marginTop: 32,
    padding: 14,
  },
  buttonPressed: {
    opacity: 0.75,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
