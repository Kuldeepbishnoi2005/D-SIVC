import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { CustomButton } from '../components/CustomButton';
import { Colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export default function IndexScreen() {
  const router = useRouter();
  const { session, role } = useAuth();

  const handleGetStarted = () => {
    if (session) {
      if (role === 'admin') {
        router.replace('/(admin)/dashboard');
      } else {
        router.replace('/(student)/dashboard');
      }
    } else {
      router.replace('/(auth)/login');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>D-SIVC</Text>
        </View>

        <Text style={styles.title}>Decentralized Student Identity</Text>
        <Text style={styles.subtitle}>
          Blockchain-backed verifiable credentials for academic authenticity.
        </Text>

        <View style={styles.badgeContainer}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>Polygon Amoy Testnet</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>Off-Chain Privacy</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <CustomButton
          title="Sign In / Register"
          onPress={handleGetStarted}
          variant="primary"
        />
        <CustomButton
          title="Public Verification"
          onPress={() => router.push('/verify')}
          variant="outline"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  content: {
    alignItems: 'center',
    marginTop: 60,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  logoBadgeText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  chip: {
    backgroundColor: Colors.card,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    width: '100%',
  },
});
