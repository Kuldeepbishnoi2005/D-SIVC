import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Share, Modal, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { QRCodeView } from '../../components/QRCodeView';
import { credentialService } from '../../services/credentialService';
import { pdfService } from '../../services/pdfService';
import { Credential } from '../../types';
import { Colors } from '../../constants/theme';
import { StatusBadge } from '../../components/StatusBadge';
import { CustomButton } from '../../components/CustomButton';

const BASE_VERIFIER_URL =
  process.env.EXPO_PUBLIC_VERIFIER_URL ||
  (typeof window !== 'undefined' && window.location?.origin ? `${window.location.origin}/verify` : 'dsivc://verify');

export default function StudentCredentialDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [credential, setCredential] = useState<Credential | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

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

  const displayId = credential ? (credential.credential_id || credential.id) : '';
  const verifyUrl = `${BASE_VERIFIER_URL}?credential=${encodeURIComponent(displayId)}`;

  const handleShareVerification = async () => {
    if (!credential) return;
    try {
      await Share.share({
        message: `Verify my D-SIVC credential: ${verifyUrl}`,
        url: verifyUrl,
      });
    } catch (error) {
      console.error('Error sharing verification link:', error);
    }
  };

  const handleViewPolygonScan = () => {
    if (!credential?.blockchain_tx_hash) return;
    const url = `https://amoy.polygonscan.com/tx/${credential.blockchain_tx_hash}`;
    Linking.openURL(url);
  };

  const handleDownloadPdf = async () => {
    if (!credential) return;
    setDownloading(true);
    try {
      await pdfService.generateCredentialPdf(credential, verifyUrl);
    } catch (err) {
      console.error('Failed to generate credential PDF:', err);
    } finally {
      setDownloading(false);
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
        <Text style={styles.idText} selectable>{displayId}</Text>

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

        {/* Action Buttons */}
        <View style={{ marginTop: 24 }}>
          <View style={styles.buttonRow}>
            <CustomButton
              title="Show QR Code"
              onPress={() => setShowQrModal(true)}
              style={{ flex: 1, marginRight: 6 }}
            />
            <CustomButton
              title="Share Link"
              onPress={handleShareVerification}
              variant="secondary"
              style={{ flex: 1, marginLeft: 6 }}
            />
          </View>

          {Boolean(credential.blockchain_tx_hash) && (
            <CustomButton
              title="View on PolygonScan"
              onPress={handleViewPolygonScan}
              variant="secondary"
              style={{ width: '100%', marginTop: 12 }}
            />
          )}

          <CustomButton
            title={downloading ? "Generating PDF..." : "Download Credential"}
            onPress={handleDownloadPdf}
            disabled={downloading}
            style={{ width: '100%', marginTop: 12 }}
          />
        </View>
      </View>

      {/* QR Code Verification Modal */}
      <Modal
        visible={showQrModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQrModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalBrand}>D-SIVC</Text>
            <Text style={styles.modalTitle}>Credential Verification</Text>

            <View style={styles.qrContainer}>
              <QRCodeView
                value={verifyUrl}
                size={180}
                color="#000000"
                backgroundColor="#FFFFFF"
              />
            </View>

            <Text style={styles.modalIdLabel}>Credential ID:</Text>
            <Text style={styles.modalIdText} selectable>{displayId}</Text>
            <Text style={styles.modalSubtitle}>Scan to verify this credential</Text>

            <CustomButton
              title="Share Verification Link"
              onPress={handleShareVerification}
              variant="secondary"
              style={{ width: '100%', marginBottom: 10 }}
            />
            <CustomButton
              title="Close"
              onPress={() => setShowQrModal(false)}
              style={{ width: '100%' }}
            />
          </View>
        </View>
      </Modal>
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
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  modalBrand: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
  },
  modalIdLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  modalIdText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
});
