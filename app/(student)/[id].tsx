import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Share } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { credentialService } from '../../services/credentialService';
import { Credential } from '../../types';
import { Colors } from '../../constants/theme';
import { StatusBadge } from '../../components/StatusBadge';
import { CustomButton } from '../../components/CustomButton';

export default function StudentCredentialDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [credential, setCredential] = useState<Credential | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchDetail() {
      if (!id) return;
      try {
        const data = await credentialService.getCredentialById(id as string);
        if (isMounted) {
          setCredential(data);
        }
      } catch (err) {
        console.error('Failed to load credential:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleShareVerification = async () => {
    if (!credential) return;
    try {
      await Share.share({
        message: `Verify my academic credential (ID: ${credential.id}) on D-SIVC! Hash: ${credential.credential_hash}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!credential) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Credential not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Credential Card */}
      <View style={styles.card}>
        {/* Revoked Warning Banner */}
        {(credential.blockchain_status === 'REVOKED' || credential.revoked_at) && (
          <View style={styles.revokedBanner}>
            <Text style={styles.revokedBannerTitle}>⚠️ CREDENTIAL REVOKED</Text>
            <Text style={styles.revokedBannerText}>
              This credential was revoked on {credential.revoked_at ? new Date(credential.revoked_at).toLocaleString() : 'Record Date'} by the issuing institution.
            </Text>
          </View>
        )}

        <View style={styles.headerRow}>
          <Text style={styles.typeText}>{credential.credential_type}</Text>
          <StatusBadge status={credential.blockchain_status === 'REVOKED' || credential.revoked_at ? 'REVOKED' : credential.blockchain_status} />
        </View>

        <Text style={styles.idLabel}>Credential ID:</Text>
        <Text style={styles.idText} selectable>{credential.credential_id || credential.id}</Text>

        <View style={styles.divider} />

        {/* Cryptographic Proof Section */}
        <Text style={styles.sectionHeading}>Cryptographic Proof & Blockchain Anchor</Text>
        
        <View style={styles.infoGroup}>
          <Text style={styles.infoLabel}>SHA-256 Hash (Digest):</Text>
          <Text style={styles.codeText} selectable>{credential.credential_hash}</Text>
        </View>

        <View style={styles.infoGroup}>
          <Text style={styles.infoLabel}>Polygon Amoy Transaction Hash:</Text>
          <Text style={styles.codeText} selectable>
            {credential.blockchain_tx_hash || 'Pending On-Chain Anchoring'}
          </Text>
        </View>

        <View style={styles.infoGroup}>
          <Text style={styles.infoLabel}>Issued Timestamp:</Text>
          <Text style={styles.infoValue}>
            {new Date(credential.created_at).toLocaleString()}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Off-Chain Verified Data */}
        <Text style={styles.sectionHeading}>Off-Chain Credential Payload</Text>
        <View style={styles.jsonBox}>
          <Text style={styles.jsonText} selectable>
            {JSON.stringify(credential.credential_data, null, 2)}
          </Text>
        </View>

        <CustomButton
          title="Share Credential Proof"
          onPress={handleShareVerification}
          variant="secondary"
          style={{ marginTop: 24 }}
        />
      </View>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: {
    color: Colors.revoked,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
  },
  revokedBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: Colors.revoked,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  revokedBannerTitle: {
    color: Colors.revoked,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
  revokedBannerText: {
    color: Colors.text,
    fontSize: 12,
    lineHeight: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  idLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  idText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginVertical: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  infoGroup: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
  },
  codeText: {
    fontSize: 12,
    color: Colors.secondary,
    fontFamily: 'monospace',
    backgroundColor: Colors.inputBg,
    padding: 8,
    borderRadius: 8,
  },
  jsonBox: {
    backgroundColor: Colors.inputBg,
    padding: 12,
    borderRadius: 12,
    borderColor: Colors.inputBorder,
    borderWidth: 1,
  },
  jsonText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
