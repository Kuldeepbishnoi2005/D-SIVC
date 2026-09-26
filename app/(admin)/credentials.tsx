import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { credentialService } from '../../services/credentialService';
import { Credential } from '../../types';
import { Colors } from '../../constants/theme';
import { StatusBadge } from '../../components/StatusBadge';

export default function AdminCredentialsScreen() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadCredentials = async () => {
    try {
      const data = await credentialService.getAllCredentials();
      setCredentials(data);
    } catch (err) {
      console.error('Error loading credentials:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCredentials();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadCredentials();
  };

  const handleRevoke = (item: Credential) => {
    const publicId = item.credential_id || item.id;

    Alert.alert(
      'Confirm Credential Revocation',
      `Are you sure you want to revoke credential '${publicId}'?\n\nThis will send an on-chain revocation transaction to Polygon Amoy Testnet and permanently mark this credential as REVOKED in the public verifier registry.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke On-Chain',
          style: 'destructive',
          onPress: async () => {
            setRevokingId(item.id);
            try {
              const res = await credentialService.revokeCredential(publicId);
              if (res.success) {
                Alert.alert(
                  'Credential Revoked',
                  `Revocation successful!\n\nPolygon Tx: ${res.txHash || 'N/A'}`
                );
                await loadCredentials();
              } else {
                Alert.alert('Revocation Failed', res.error || 'Failed to revoke credential.');
              }
            } catch (err: any) {
              Alert.alert('Revocation Error', err.message || 'An error occurred.');
            } finally {
              setRevokingId(null);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Credential }) => {
    const isRevoked = item.blockchain_status === 'REVOKED' || item.revoked_at !== null;
    const isRevokingThis = revokingId === item.id;

    return (
      <View style={[styles.card, isRevoked && styles.cardRevoked]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.credentialType}>{item.credential_type}</Text>
            <Text style={styles.publicId} selectable>
              ID: {item.credential_id || item.id}
            </Text>
          </View>
          <StatusBadge status={isRevoked ? 'REVOKED' : item.blockchain_status} />
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>SHA-256 Hash:</Text>
          <Text style={styles.hashText} numberOfLines={1} ellipsizeMode="middle" selectable>
            {item.credential_hash}
          </Text>
        </View>

        {item.blockchain_tx_hash && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Polygon Amoy Tx:</Text>
            <Text style={styles.hashText} numberOfLines={1} ellipsizeMode="middle" selectable>
              {item.blockchain_tx_hash}
            </Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Issued At:</Text>
          <Text style={styles.infoValue}>
            {new Date(item.created_at).toLocaleString()}
          </Text>
        </View>

        {isRevoked && item.revoked_at && (
          <View style={styles.revokedNotice}>
            <Text style={styles.revokedNoticeText}>
              Revoked on: {new Date(item.revoked_at).toLocaleString()}
            </Text>
          </View>
        )}

        {!isRevoked && (
          <TouchableOpacity
            style={[styles.revokeBtn, isRevokingThis && styles.revokeBtnDisabled]}
            disabled={isRevokingThis}
            onPress={() => handleRevoke(item)}
          >
            {isRevokingThis ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.revokeBtnText}>Revoke Credential</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={credentials}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Credentials Issued</Text>
              <Text style={styles.emptyText}>
                No credentials have been issued in the system yet.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: 20,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    marginBottom: 14,
  },
  cardRevoked: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.03)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  credentialType: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  publicId: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  infoRow: {
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 12,
    color: Colors.text,
  },
  hashText: {
    fontSize: 11,
    color: Colors.secondary,
    fontFamily: 'monospace',
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  revokedNotice: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  revokedNoticeText: {
    color: Colors.revoked,
    fontSize: 12,
    fontWeight: '600',
  },
  revokeBtn: {
    marginTop: 12,
    backgroundColor: Colors.revoked,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revokeBtnDisabled: {
    opacity: 0.6,
  },
  revokeBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
