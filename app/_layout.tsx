import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { Colors } from '../constants/theme';

function InitialLayout() {
  const { session, profile, loading, role } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inStudentGroup = segments[0] === '(student)';
    const inAdminGroup = segments[0] === '(admin)';
    const inVerifyGroup = segments[0] === 'verify';

    // Allow public verification screen without redirecting to login
    if (inVerifyGroup) return;

    if (!session) {
      // Unauthenticated -> redirect to login
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else {
      // Authenticated -> redirect based on role
      if (role === 'admin') {
        if (!inAdminGroup) {
          router.replace('/(admin)/dashboard');
        }
      } else {
        // Default to student
        if (!inStudentGroup) {
          router.replace('/(student)/dashboard');
        }
      }
    }
  }, [session, profile, loading, role, segments, router]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.card },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(student)" options={{ headerShown: false }} />
      <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      <Stack.Screen name="verify/index" options={{ title: 'Verify Credential', headerBackTitle: 'Back' }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('D-SIVC PWA Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.warn('D-SIVC PWA Service Worker registration failed:', error);
          });
      });
    }
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <InitialLayout />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
