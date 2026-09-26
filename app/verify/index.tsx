import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { Colors } from '../../constants/theme';
import { verificationService, VerificationResult } from '../../services/verificationService';
import { StatusBadge } from '../../components/StatusBadge';
import { ShieldCheck, CheckCircle2, AlertTriangle, ExternalLink, ArrowLeft } from 'lucide-react-native';

export default function PublicVerifyScreen() {
  const router = useRouter();
  const { credential } = useLocalSearchParams<{ credential?: string }>();
  const initialCred = typeof credential === 'string' ? credential.trim() : '';

  const [query, setQuery] = useState(initialCred);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const executeVerification = useCallback(async (targetQuery: string) => {
    if (!targetQuery.trim()) {
      setErrorMsg('Please enter a valid Credential ID or SHA-256 Hash.');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    setSearched(false);

    try {
      const res = await verificationService.verifyCredential(targetQuery.trim());
      setResult(res);
      setSearched(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error executing verification.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleVerify = () => {
    executeVerification(query);
  };

  useEffect(() => {
    if (initialCred) {
      const timer = setTimeout(() => {
        executeVerification(initialCred);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [initialCred, executeVerification]);

  const handleViewPolygonScan = () => {
    if (!result?.blockchain_tx_hash) return;
    const url = `https://amoy.polygonscan.com/tx/${result.blockchain_tx_hash}`;
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Navigation header if router can go back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <ArrowLeft size={18} color={Colors.text} />
        <Text style={styles.backBtnText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.badge}>
          <ShieldCheck size={14} color={Colors.primary} />
          <Text style={styles.badgeText}>D-SIVC Public Verifier</Text>
        </View>

        <Text style={styles.title}>Credential Authenticator</Text>
        <Text style={styles.subtitle}>
          Verify the authenticity and on-chain status of any D-SIVC verifiable credential.
        </Text>
      </View>

      <View style={styles.searchCard}>
        {errorMsg ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorCardText}>{errorMsg}</Text>
          </View>
        ) : null}

        <CustomInput
          label="Credential ID or Hash"
          placeholder="e.g. DSIVC-1790382448286-428"
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
      </View>

      {searched && (
        <View style={styles.resultBox}>
          {result ? (
            <View style={[styles.resultCard, result.is_revoked && styles.resultCardRevoked]}>
              <View style={styles.cardTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.credentialTitle}>{result.credential_type}</Text>
                  <Text style={styles.studentName}>{result.credential_data?.student_name || 'N/A'}</Text>
                </View>
                <StatusBadge status={result.is_revoked ? 'REVOKED' : result.blockchain_status} />
              </View>

              {/* Status Banner */}
              <View
                style={[
                  styles.statusBanner,
                  result.is_revoked
                    ? styles.statusBannerRevoked
                    : result.blockchain_status === 'ANCHORED'
                    ? styles.statusBannerVerified
                    : styles.statusBannerPending,
                ]}
              >
                {result.is_revoked ? (
                  <AlertTriangle size={16} color={Colors.revoked} />
                ) : (
                  <CheckCircle2 size={16} color={Colors.verified} />
                )}
                <Text
                  style={[
                    styles.statusBannerText,
                    result.is_revoked
                      ? { color: Colors.revoked }
                      : result.blockchain_status === 'ANCHORED'
                      ? { color: Colors.verified }
                      : { color: Colors.pending },
                  ]}
                >
                  {result.is_revoked
                    ? 'Credential Revoked by Issuer'
                    : result.blockchain_status === 'ANCHORED'
                    ? 'Authentic & Blockchain Anchored'
                    : 'Database Record Found (Pending Anchor)'}
                </Text>
              </View>

              {/* Detail Rows */}
              <View style={styles.detailGrid}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Credential ID</Text>
                  <Text style={styles.detailValCode} selectable>{result.credential_id}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Roll Number</Text>
                  <Text style={styles.detailVal}>{result.credential_data?.roll_number || 'N/A'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Institution</Text>
                  <Text style={styles.detailVal}>{result.credential_data?.institution || 'Academic Institution'}</Text>
                </View>

                <View style={styles.detailRowColumn}>
                  <Text style={styles.detailLabel}>SHA-256 Digest</Text>
                  <Text style={styles.hashCodeText} selectable numberOfLines={1} ellipsizeMode="middle">
                    {result.credential_hash}
                  </Text>
                </View>

                {Boolean(result.blockchain_tx_hash) && (
                  <View style={styles.detailRowColumn}>
                    <Text style={styles.detailLabel}>Transaction Hash</Text>
                    <Text style={styles.hashCodeText} selectable numberOfLines={1} ellipsizeMode="middle">
                      {result.blockchain_tx_hash}
                    </Text>
                  </View>
                )}
              </View>

              {Boolean(result.blockchain_tx_hash) && (
                <TouchableOpacity style={styles.polygonScanBtn} onPress={handleViewPolygonScan} activeOpacity={0.8}>
                  <Text style={styles.polygonScanText}>View on PolygonScan</Text>
                  <ExternalLink size={14} color={Colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.notFoundCard}>
              <AlertTriangle size={32} color={Colors.revoked} style={{ marginBottom: 10 }} />
              <Text style={styles.notFoundTitle}>Credential Not Found</Text>
              <Text style={styles.notFoundText}>
                No verifiable record matching this Credential ID or SHA-256 Hash was found in the institution registry database.
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.verifiedBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
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
  searchCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 20,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
  },
  errorCard: {
    backgroundColor: Colors.revokedBg,
    borderColor: Colors.revoked,
    borderWidth: 1,
    padding: 12,
    borderRadius: 16,
    marginBottom: 14,
  },
  errorCardText: {
    color: Colors.revoked,
    fontSize: 13,
    fontWeight: '600',
  },
  resultBox: {
    marginTop: 20,
  },
  resultCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 20,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
  },
  resultCardRevoked: {
    borderColor: 'rgba(255, 107, 107, 0.3)',
    backgroundColor: 'rgba(255, 107, 107, 0.04)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  credentialTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  studentName: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  statusBannerVerified: {
    backgroundColor: Colors.verifiedBg,
    borderColor: Colors.verified,
  },
  statusBannerPending: {
    backgroundColor: Colors.pendingBg,
    borderColor: Colors.pending,
  },
  statusBannerRevoked: {
    backgroundColor: Colors.revokedBg,
    borderColor: Colors.revoked,
  },
  statusBannerText: {
    fontSize: 13,
    fontWeight: '700',
  },
  detailGrid: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailRowColumn: {
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  detailValCode: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.text,
  },
  hashCodeText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: Colors.textSecondary,
    backgroundColor: Colors.cardSecondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  polygonScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  polygonScanText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  notFoundCard: {
    backgroundColor: Colors.card,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  notFoundTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  notFoundText: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
