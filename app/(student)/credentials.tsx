import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { credentialService } from '../../services/credentialService';
import { Credential } from '../../types';
import { Colors } from '../../constants/theme';
import { StatusBadge } from '../../components/StatusBadge';
import { FloatingNavBar, NavItem } from '../../components/FloatingNavBar';
import { Award } from 'lucide-react-native';

export default function StudentCredentialsScreen() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ANCHORED' | 'PENDING' | 'REVOKED'>('ALL');

  const fetchCredentials = async () => {
    try {
      const data = await credentialService.getMyCredentials();
      setCredentials(data);
    } catch (err) {
      console.error('Error fetching student credentials:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCredentials();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCredentials();
  };

  const filteredCredentials = useMemo(() => {
    if (statusFilter === 'ALL') return credentials;
    return credentials.filter(c => c.blockchain_status?.toUpperCase() === statusFilter);
  }, [credentials, statusFilter]);

  const navItems: NavItem[] = [
    { key: 'home', label: 'Home', iconName: 'home', route: '/(student)/dashboard' },
    { key: 'credentials', label: 'Credentials', iconName: 'credentials', route: '/(student)/credentials' },
    { key: 'profile', label: 'Profile', iconName: 'profile', route: '/(student)/dashboard' },
  ];

  const renderItem = ({ item }: { item: Credential }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(student)/${item.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.title}>{item.credential_type}</Text>
        <StatusBadge status={item.blockchain_status} />
      </View>

      <Text style={styles.credIdText}>ID: {item.credential_id}</Text>

      <View style={styles.cardFooter}>
        <Text style={styles.date}>
          Issued {new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </Text>
        <Text style={styles.detailsLink}>View details →</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>Credentials</Text>
        <Text style={styles.headerSubtitle}>Your verified academic credentials</Text>

        {/* Status Filter Pills */}
        <View style={styles.filterRow}>
          {(['ALL', 'ANCHORED', 'PENDING', 'REVOKED'] as const).map((status) => {
            const isActive = statusFilter === status;
            return (
              <TouchableOpacity
                key={status}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setStatusFilter(status)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {status === 'ALL' ? 'All' : status[0] + status.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
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
              <Text style={styles.emptyTitle}>No credentials found</Text>
              <Text style={styles.emptyText}>
                {statusFilter === 'ALL'
                  ? 'You do not have any verifiable credentials registered on the system yet.'
                  : `No credentials matching status "${statusFilter}".`}
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
  headerBox: {
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
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: Colors.cardSecondary,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  filterPillTextActive: {
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
    padding: 20,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  credIdText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'monospace',
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  date: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  detailsLink: {
    fontSize: 12,
    color: Colors.primary,
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
