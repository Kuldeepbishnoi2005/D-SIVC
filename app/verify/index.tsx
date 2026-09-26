import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { Colors } from '../../constants/theme';
import { verificationService, VerificationResult } from '../../services/verificationService';
import { StatusBadge } from '../../components/StatusBadge';

export default function PublicVerifyScreen() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleVerify = async () => {
    if (!query.trim()) {
      setErrorMsg('Please enter a valid Credential ID or SHA-256 Hash.');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    setSearched(false);

    try {
      const res = await verificationService.verifyCredential(query.trim());
      setResult(res);
      setSearched(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error executing verification.');
    } finally {
      setLoading(false);
    }
  };

  const getTruthfulStatusText = (res: VerificationResult) => {
    if (res.is_revoked) {
      return 'Credential Revoked';
    }
    if (res.blockchain_status === 'ANCHORED') {
      return 'Anchored & Verified on Blockchain';
    }
    return 'Database Record Found - Pending Blockchain Anchor';
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.icon}>🛡️</Text>
          <Text style={styles.title}>Credential Authenticator</Text>
          <Text style={styles.subtitle}>
            Enter a student Credential ID or SHA-256 Hash to verify its authenticity and cryptographic proof against the registry.
          </Text>
        </View>

        {errorMsg ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorCardText}>{errorMsg}</Text>
          </View>
        ) : null}

        <CustomInput
          label="Credential ID or Hash *"
          placeholder="e.g. DSIVC-1710000000-123 or 0x8a9b..."
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />

        <CustomButton
          title="Verify Credential"
          onPress={handleVerify}
          loading={loading}
          style={{ marginTop: 8 }}
        />

        {searched && (
          <View style={styles.resultBox}>
            {result ? (
              <View style={styles.resultCard}>
                <View style={styles.badgeRow}>
                  <Text style={styles.resultTitle}>{result.credential_type}</Text>
                  <StatusBadge status={result.blockchain_status} />
                </View>

                <View
                  style={[
                    styles.validityBanner,
                    result.is_revoked
                      ? styles.revokedBanner
                      : result.blockchain_status === 'ANCHORED'
                      ? styles.verifiedBanner
                      : styles.pendingBanner,
                  ]}
                >
                  <Text
                    style={[
                      styles.validityText,
                      result.is_revoked
                        ? styles.revokedText
                        : result.blockchain_status === 'ANCHORED'
                        ? styles.verifiedText
                        : styles.pendingText,
                    ]}
                  >
                    {getTruthfulStatusText(result)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Credential ID:</Text>
                  <Text style={styles.infoValue}>{result.credential_id}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Student Name:</Text>
                  <Text style={styles.infoValue}>
                    {result.credential_data?.student_name || 'N/A'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Roll Number:</Text>
                  <Text style={styles.infoValue}>
                    {result.credential_data?.roll_number || 'N/A'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>SHA-256 Hash:</Text>
                  <Text style={styles.codeText} selectable>{result.credential_hash}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Blockchain Tx Hash:</Text>
                  <Text style={styles.codeText} selectable>
                    {result.blockchain_tx_hash || 'Not Yet Anchored On-Chain (Pending Sync)'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Issue Date:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(result.issued_at).toLocaleString()}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.notFoundCard}>
                <Text style={styles.notFoundTitle}>⚠️ Credential Not Found</Text>
                <Text style={styles.notFoundText}>
                  No verifiable record matching this Credential ID or SHA-256 Hash was found in the institution registry database.
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: Colors.background,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 40,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  errorCard: {
    backgroundColor: Colors.revokedBg,
    borderColor: Colors.revoked,
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorCardText: {
    color: Colors.text,
    fontSize: 13,
  },
  resultBox: {
    marginTop: 24,
  },
  resultCard: {
    backgroundColor: Colors.inputBg,
    borderRadius: 16,
    padding: 16,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  validityBanner: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  pendingBanner: {
    backgroundColor: Colors.pendingBg,
    borderColor: Colors.pending,
  },
  verifiedBanner: {
    backgroundColor: Colors.verifiedBg,
    borderColor: Colors.verified,
  },
  revokedBanner: {
    backgroundColor: Colors.revokedBg,
    borderColor: Colors.revoked,
  },
  validityText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  pendingText: {
    color: Colors.pending,
  },
  verifiedText: {
    color: Colors.verified,
  },
  revokedText: {
    color: Colors.revoked,
  },
  infoRow: {
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  codeText: {
    fontSize: 11,
    color: Colors.secondary,
    fontFamily: 'monospace',
    backgroundColor: Colors.card,
    padding: 6,
    borderRadius: 6,
  },
  notFoundCard: {
    backgroundColor: Colors.revokedBg,
    borderColor: Colors.revoked,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  notFoundTitle: {
    color: Colors.revoked,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  notFoundText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
});
