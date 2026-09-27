import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.card },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: Colors.background },
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen name="dashboard" options={{ title: 'Admin Console' }} />
      <Stack.Screen name="students" options={{ title: 'Student Directory' }} />
      <Stack.Screen name="issue" options={{ title: 'Issue Credential' }} />
      <Stack.Screen name="credentials" options={{ title: 'Manage Credentials' }} />
      <Stack.Screen name="profile" options={{ title: 'Admin Profile' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.inputBg,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
  },
  logoutText: {
    color: Colors.revoked,
    fontSize: 13,
    fontWeight: '600',
  },
});
