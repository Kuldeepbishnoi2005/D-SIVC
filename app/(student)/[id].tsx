import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Share, Modal, Linking, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { QRCodeView } from '../../components/QRCodeView';
import { credentialService } from '../../services/credentialService';
import { pdfService } from '../../services/pdfService';
import { Credential } from '../../types';
import { Colors } from '../../constants/theme';
import { StatusBadge } from '../../components/StatusBadge';
import { CustomButton } from '../../components/CustomButton';
import { CheckCircle2, AlertTriangle, ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react-native';

const BASE_VERIFIER_URL =
  process.env.EXPO_PUBLIC_VERIFIER_URL ||
  (typeof window !== 'undefined' && window.location?.origin ? `${window.location.origin}/verify` : 'dsivc://verify');

export default function StudentCredentialDetailScreen() {
  const router = useRouter();
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

  const isRevoked = credential.blockchain_status === 'REVOKED' || Boolean(credential.revoked_at);
  const isAnchored = credential.blockchain_status === 'ANCHORED';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header Navigation */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <ArrowLeft size={18} color={Colors.text} />
        <Text style={styles.backBtnText}>Credential</Text>
      </TouchableOpacity>

      {/* Credential Header */}
      <View style={styles.titleSection}>
        <Text style={styles.credentialTitle}>{credential.credential_type}</Text>
        <Text style={styles.credentialSubtitle}>
          {credential.credential_data?.course || credential.credential_data?.department || 'Digital Verifiable Credential'}
        </Text>
      </View>

      {/* Large Status Card (PARQ Style) */}
      <View style={[styles.largeStatusCard, isRevoked && styles.largeStatusCardRevoked]}>
        <View style={[styles.statusIconCircle, isRevoked ? styles.iconCircleRevoked : styles.iconCircleVerified]}>
          {isRevoked ? (
            <AlertTriangle size={28} color={Colors.revoked} />
          ) : (
            <CheckCircle2 size={32} color={Colors.primary} />
          )}
        </View>

        <Text style={[styles.statusTitleText, isRevoked && { color: Colors.revoked }]}>
          {isRevoked ? 'REVOKED' : isAnchored ? 'VERIFIED' : 'PENDING'}
        </Text>

        <Text style={styles.statusDescriptionText}>
          {isRevoked
            ? 'This credential has been revoked by the issuing authority.'
            : isAnchored
            ? 'Credential is authentic and blockchain anchored.'
            : 'Credential is awaiting blockchain confirmation.'}
        </Text>

        <View style={styles.statusCardDivider} />

        <Text style={styles.cardIdCode}>{displayId}</Text>
        <Text style={styles.cardIssuedDate}>
          Issued {new Date(credential.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </Text>
      </View>

      {/* Blockchain Details Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeaderLabel}>BLOCKCHAIN</Text>

        <View style={styles.blockchainCard}>
          <View style={styles.bcRow}>
            <Text style={styles.bcLabel}>Network</Text>
            <Text style={styles.bcValue}>Polygon Amoy Testnet</Text>
          </View>

          <View style={styles.bcRow}>
            <Text style={styles.bcLabel}>Status</Text>
            <StatusBadge status={isRevoked ? 'REVOKED' : credential.blockchain_status} />
          </View>

          <View style={styles.bcRowColumn}>
            <Text style={styles.bcLabel}>Transaction Hash</Text>
            <Text style={styles.hashCodeText} selectable numberOfLines={1} ellipsizeMode="middle">
              {credential.blockchain_tx_hash || 'Pending Anchoring'}
            </Text>
          </View>

          {Boolean(credential.blockchain_tx_hash) && (
            <TouchableOpacity style={styles.polygonScanLink} onPress={handleViewPolygonScan} activeOpacity={0.7}>
              <Text style={styles.polygonScanText}>View on PolygonScan</Text>
              <ExternalLink size={14} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Cryptographic Hash Details */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeaderLabel}>CRYPTOGRAPHY</Text>
        <View style={styles.blockchainCard}>
          <View style={styles.bcRowColumn}>
            <Text style={styles.bcLabel}>SHA-256 Digest</Text>
            <Text style={styles.hashCodeText} selectable numberOfLines={1} ellipsizeMode="middle">
              {credential.credential_hash}
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsSection}>
        {/* Primary Action: Show QR Code */}
        <CustomButton
          title="Show QR Code"
          onPress={() => setShowQrModal(true)}
          style={styles.primaryActionBtn}
        />

        {/* Secondary Actions */}
        <CustomButton
          title="Share Verification Link"
          onPress={handleShareVerification}
          variant="secondary"
        />

        <CustomButton
          title={downloading ? "Generating PDF..." : "Download Credential"}
          onPress={handleDownloadPdf}
          disabled={downloading}
          variant="secondary"
        />
      </View>

      {/* QR Code Verification Modal (Screen 6) */}
      <Modal
        visible={showQrModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQrModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalBadge}>
              <ShieldCheck size={14} color={Colors.primary} />
              <Text style={styles.modalBadgeText}>D-SIVC Verification</Text>
            </View>

            <Text style={styles.modalTitle}>Credential Verification</Text>

            <View style={styles.qrContainer}>
              <QRCodeView
                value={verifyUrl}
                size={190}
                color="#000000"
                backgroundColor="#FFFFFF"
              />
            </View>

            <Text style={styles.modalIdLabel}>Credential ID</Text>
            <Text style={styles.modalIdText} selectable>{displayId}</Text>
            <Text style={styles.modalSubtitle}>Scan to verify this credential</Text>

            <View style={styles.modalActions}>
              <CustomButton
                title="Share Verification Link"
                onPress={handleShareVerification}
                variant="secondary"
                style={{ width: '100%' }}
              />
              <CustomButton
                title="Close"
                onPress={() => setShowQrModal(false)}
                variant="outline"
                style={{ width: '100%', marginTop: 8 }}
              />
            </View>
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
    paddingBottom: 40,
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
    fontSize: 15,
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
  titleSection: {
    marginBottom: 20,
  },
  credentialTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  credentialSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  largeStatusCard: {
    backgroundColor: Colors.card,
    borderRadius: 28,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  largeStatusCardRevoked: {
    borderColor: 'rgba(255, 107, 107, 0.3)',
    backgroundColor: 'rgba(255, 107, 107, 0.04)',
  },
  statusIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconCircleVerified: {
    backgroundColor: Colors.verifiedBg,
  },
  iconCircleRevoked: {
    backgroundColor: Colors.revokedBg,
  },
  statusTitleText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.verified,
    letterSpacing: 1,
    marginBottom: 6,
  },
  statusDescriptionText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  statusCardDivider: {
    height: 1,
    width: '100%',
    backgroundColor: Colors.cardBorder,
    marginBottom: 16,
  },
  cardIdCode: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardIssuedDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  blockchainCard: {
    backgroundColor: Colors.cardSecondary,
    borderRadius: 20,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  bcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bcRowColumn: {
    gap: 4,
  },
  bcLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  bcValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  hashCodeText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: Colors.textSecondary,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  polygonScanLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  polygonScanText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  actionsSection: {
    gap: 10,
    marginTop: 10,
  },
  primaryActionBtn: {
    marginVertical: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.card,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderColor: Colors.cardBorder,
    borderWidth: 1,
  },
  modalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.verifiedBg,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    marginBottom: 12,
  },
  modalBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 20,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
  },
  modalIdLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  modalIdText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'monospace',
    marginVertical: 2,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 20,
  },
  modalActions: {
    width: '100%',
  },
});
