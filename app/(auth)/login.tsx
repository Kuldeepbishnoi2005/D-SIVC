import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, ArrowRight, Search } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    const { error } = await login(email.trim(), password);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message || 'Failed to sign in. Please check your credentials.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        {/* Subtle Blockchain Identity Badge */}
        <View style={styles.identityBadge}>
          <ShieldCheck size={14} color={Colors.primary} />
          <Text style={styles.identityBadgeText}>Polygon Amoy Anchored</Text>
        </View>

        <Text style={styles.brandTitle}>D-SIVC</Text>
        <Text style={styles.brandSubtitle}>Decentralized Student Identity</Text>
        
        <Text style={styles.welcomeHeading}>Welcome back</Text>
      </View>

      <View style={styles.formCard}>
        {errorMsg ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorCardText}>{errorMsg}</Text>
          </View>
        ) : null}

        <CustomInput
          label="Email"
          placeholder="student@college.edu"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <CustomInput
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <CustomButton
          title="Sign In"
          onPress={handleLogin}
          loading={loading}
          style={{ marginTop: 20 }}
        />

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>{"Don't have an account? "}</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.linkText}>Create account</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.verifyBtn}
          onPress={() => router.push('/verify')}
          activeOpacity={0.8}
        >
          <Search size={15} color={Colors.secondary} />
          <Text style={styles.verifyBtnText}>Public Credential Verifier</Text>
          <ArrowRight size={14} color={Colors.secondary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 28,
    alignItems: 'center',
  },
  identityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.verifiedBg,
    borderColor: 'rgba(101, 230, 163, 0.2)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
    gap: 6,
    marginBottom: 16,
  },
  identityBadgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  brandTitle: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 2,
    marginVertical: 2,
  },
  brandSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  welcomeHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  formCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 24,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
  },
  errorCard: {
    backgroundColor: Colors.revokedBg,
    borderColor: Colors.revoked,
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorCardText: {
    color: Colors.text,
    fontSize: 13,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  linkText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    gap: 8,
  },
  verifyBtnText: {
    color: Colors.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
