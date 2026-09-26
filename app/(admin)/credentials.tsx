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
  ScrollView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { credentialService } from '../../services/credentialService';
import { Credential } from '../../types';
import { Colors } from '../../constants/theme';
import { StatusBadge } from '../../components/StatusBadge';
import { CustomInput } from '../../components/CustomInput';

const STATUS_FILTERS = ['ALL', 'ANCHORED', 'PENDING', 'FAILED', 'REVOKED'];
const TYPE_FILTERS = ['ALL', 'Degree', 'Certificate', 'Internship', 'Achievement', 'Other'];

export default function AdminCredentialsScreen() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

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

  const filteredCredentials = credentials.filter((item) => {
    // 1. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const cId = (item.credential_id || item.id || '').toLowerCase();
      const sName = (item.credential_data?.student_name || item.student?.full_name || '').toLowerCase();
      const rNum = (item.credential_data?.roll_number || item.student?.roll_number || '').toLowerCase();
      const email = (item.student?.email || item.credential_data?.email || '').toLowerCase();

      const match = cId.includes(q) || sName.includes(q) || rNum.includes(q) || email.includes(q);
      if (!match) return false;
    }

    // 2. Status filter
    if (statusFilter !== 'ALL') {
      const actualStatus = item.revoked_at !== null ? 'REVOKED' : item.blockchain_status;
      if (actualStatus !== statusFilter) return false;
    }

    // 3. Credential Type filter
    if (typeFilter !== 'ALL') {
      const itemType = (item.credential_type || item.credential_data?.credential_type || '').toLowerCase();
      const fType = typeFilter.toLowerCase();
      if (!itemType.includes(fType)) return false;
    }

    return true;
  });

  const renderItem = ({ item }: { item: Credential }) => {
    const isRevoked = item.blockchain_status === 'REVOKED' || item.revoked_at !== null;
    const isRevokingThis = revokingId === item.id;
    const studentName = item.credential_data?.student_name || item.student?.full_name || 'N/A';
    const rollNumber = item.credential_data?.roll_number || item.student?.roll_number || 'N/A';

    return (
      <View style={[styles.card, isRevoked && styles.cardRevoked]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.studentName}>{studentName}</Text>
            <Text style={styles.rollNumber}>Roll No: {rollNumber}</Text>
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
      {/* Search & Filter Controls */}
      <View style={styles.filterSection}>
        <CustomInput
          placeholder="Search Name, Roll No, Credential ID, Email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Status Filter Pills */}
        <Text style={styles.filterGroupLabel}>Status Filter:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillContainer}>
          {STATUS_FILTERS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.pill, statusFilter === s && styles.pillActive]}
              onPress={() => setStatusFilter(s)}
            >
              <Text style={[styles.pillText, statusFilter === s && styles.pillTextActive]}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Type Filter Pills */}
        <Text style={styles.filterGroupLabel}>Credential Type:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillContainer}>
          {TYPE_FILTERS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.pill, typeFilter === t && styles.pillActive]}
              onPress={() => setTypeFilter(t)}
            >
              <Text style={[styles.pillText, typeFilter === t && styles.pillTextActive]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredCredentials}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Matching Credentials</Text>
              <Text style={styles.emptyText}>
                {searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                  ? 'No credentials match your search and filter criteria.'
                  : 'No credentials have been issued in the system yet.'}
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
  filterSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  filterGroupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 8,
    marginBottom: 6,
  },
  pillContainer: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  pillTextActive: {
    color: '#FFFFFF',
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
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  rollNumber: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  credentialType: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  publicId: {
    fontSize: 11,
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
