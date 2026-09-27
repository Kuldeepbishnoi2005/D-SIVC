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
import { FloatingNavBar, NavItem } from '../../components/FloatingNavBar';
import { Award } from 'lucide-react-native';

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

  const navItems: NavItem[] = [
    { key: 'dashboard', label: 'Dashboard', iconName: 'dashboard', route: '/(admin)/dashboard' },
    { key: 'students', label: 'Students', iconName: 'students', route: '/(admin)/students' },
    { key: 'credentials', label: 'Credentials', iconName: 'credentials', route: '/(admin)/credentials' },
    { key: 'profile', label: 'Profile', iconName: 'profile', route: '/(admin)/profile' },
  ];

  const renderItem = ({ item }: { item: Credential }) => {
    const isRevoked = item.blockchain_status === 'REVOKED' || item.revoked_at !== null;
    const isRevokingThis = revokingId === item.id;
    const studentName = item.credential_data?.student_name || item.student?.full_name || 'N/A';
    const rollNumber = item.credential_data?.roll_number || item.student?.roll_number || 'N/A';

    return (
      <View style={[styles.card, isRevoked && styles.cardRevoked]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.studentName}>{studentName}</Text>
            <Text style={styles.rollNumber}>Roll: {rollNumber}</Text>
            <Text style={styles.credentialType}>{item.credential_type}</Text>
            <Text style={styles.publicId} selectable>
              ID: {item.credential_id || item.id}
            </Text>
          </View>
          <StatusBadge status={isRevoked ? 'REVOKED' : item.blockchain_status} />
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.issuedDateText}>
            Issued {new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </Text>

          {!isRevoked ? (
            <TouchableOpacity
              style={[styles.revokePillBtn, isRevokingThis && styles.revokePillBtnDisabled]}
              disabled={isRevokingThis}
              onPress={() => handleRevoke(item)}
              activeOpacity={0.8}
            >
              {isRevokingThis ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.revokePillBtnText}>Revoke</Text>
              )}
            </TouchableOpacity>
          ) : (
            <Text style={styles.revokedTag}>Revoked</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search & Filter Controls */}
      <View style={styles.filterSection}>
        <Text style={styles.headerTitle}>Credentials</Text>
        <Text style={styles.headerSubtitle}>Manage & revoke student credentials</Text>

        <CustomInput
          placeholder="Search name, roll no, credential ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Status Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
          {STATUS_FILTERS.map((s) => {
            const isActive = statusFilter === s;
            return (
              <TouchableOpacity
                key={s}
                style={[styles.pill, isActive && styles.pillActive]}
                onPress={() => setStatusFilter(s)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                  {s === 'ALL' ? 'All Status' : s[0] + s.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Type Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
          {TYPE_FILTERS.map((t) => {
            const isActive = typeFilter === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.pill, isActive && styles.pillActive]}
                onPress={() => setTypeFilter(t)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                  {t === 'ALL' ? 'All Types' : t}
                </Text>
              </TouchableOpacity>
            );
          })}
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
              <Award size={36} color={Colors.textMuted} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>No Matching Credentials</Text>
              <Text style={styles.emptyText}>
                {searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                  ? 'No credentials match your filter criteria.'
                  : 'No credentials have been issued in the system yet.'}
              </Text>
            </View>
          ) : null
        }
      />

      <FloatingNavBar items={navItems} activeKey="credentials" />
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
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: 10,
  },
  pillRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: Colors.cardSecondary,
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
    color: Colors.primaryText,
    fontWeight: '700',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 18,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardRevoked: {
    borderColor: 'rgba(255, 107, 107, 0.3)',
    backgroundColor: 'rgba(255, 107, 107, 0.04)',
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
    marginTop: 4,
  },
  publicId: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  issuedDateText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  revokePillBtn: {
    backgroundColor: Colors.revokedBg,
    borderColor: Colors.revoked,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  revokePillBtnDisabled: {
    opacity: 0.6,
  },
  revokePillBtnText: {
    color: Colors.revoked,
    fontSize: 12,
    fontWeight: '700',
  },
  revokedTag: {
    color: Colors.revoked,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
