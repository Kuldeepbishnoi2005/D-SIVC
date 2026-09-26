import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { credentialService } from '../../services/credentialService';
import { Credential } from '../../types';
import { Colors } from '../../constants/theme';
import { StatusBadge } from '../../components/StatusBadge';

export default function StudentDashboardScreen() {
  const { profile, logout } = useAuth();
  const router = useRouter();

  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCredentials = async () => {
    try {
      const data = await credentialService.getMyCredentials();
      setCredentials(data);
    } catch (err) {
      console.error('Error loading credentials:', err);
    } finally {
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

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const totalCount = credentials.length;
  const anchoredCount = credentials.filter(c => c.blockchain_status === 'ANCHORED').length;
  const pendingCount = credentials.filter(c => c.blockchain_status === 'PENDING').length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Platform Branding */}
      <View style={styles.brandRow}>
        <Text style={styles.appTitle}>D-SIVC</Text>
        <Text style={styles.roleBadge}>Role: Student</Text>
      </View>

      {/* Digital Student Identity Card */}
      <View style={styles.profileCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Digital Student Identity</Text>
          <Text style={styles.institutionText}>{profile?.institution || 'Academic Institution'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Welcome,</Text>
            <Text style={styles.nameText}>{profile?.full_name || 'Student'}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Roll Number</Text>
            <Text style={styles.infoValue}>{profile?.roll_number || 'N/A'}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Course</Text>
            <Text style={styles.infoValue}>{profile?.course || 'N/A'}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Department</Text>
            <Text style={styles.infoValue}>{profile?.department || 'N/A'}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{profile?.email || 'N/A'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{totalCount}</Text>
          <Text style={styles.metricLabel}>Total Credentials</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: Colors.verified }]}>{anchoredCount}</Text>
          <Text style={styles.metricLabel}>On-Chain Anchored</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: Colors.pending }]}>{pendingCount}</Text>
          <Text style={styles.metricLabel}>Pending Sync</Text>
        </View>
      </View>

      {/* Quick Navigation */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push('/(student)/credentials')}
        >
          <Text style={styles.actionBtnText}>🎓 View All Credentials</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnSecondary]}
          onPress={() => router.push('/verify')}
        >
          <Text style={styles.actionBtnTextSecondary}>🔍 Verify Credential</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Credentials Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Credentials</Text>
        <TouchableOpacity onPress={() => router.push('/(student)/credentials')}>
          <Text style={styles.seeAllText}>See All ({totalCount})</Text>
        </TouchableOpacity>
      </View>

      {credentials.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No credentials yet.</Text>
          <Text style={styles.emptyText}>
            Your institution has not issued any verifiable credentials to your account yet.
          </Text>
        </View>
      ) : (
        credentials.slice(0, 3).map((cred) => (
          <TouchableOpacity
            key={cred.id}
            style={styles.credCard}
            onPress={() => router.push(`/(student)/${cred.id}`)}
          >
            <View style={styles.credHeader}>
              <Text style={styles.credTitle}>{cred.credential_type}</Text>
              <StatusBadge status={cred.blockchain_status} />
            </View>

            <Text style={styles.credDate}>
              Issued: {new Date(cred.created_at).toLocaleDateString()}
            </Text>

            <View style={styles.hashRow}>
              <Text style={styles.hashLabel}>SHA-256 Hash: </Text>
              <Text style={styles.hashValue} numberOfLines={1} ellipsizeMode="middle">
                {cred.credential_hash}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 20,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 2,
  },
  roleBadge: {
    backgroundColor: Colors.inputBg,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    color: Colors.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  institutionText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginVertical: 14,
  },
  infoGrid: {
    gap: 10,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  nameText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  infoValue: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  logoutBtn: {
    marginTop: 16,
    backgroundColor: Colors.revokedBg,
    borderColor: Colors.revoked,
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: Colors.revoked,
    fontWeight: '600',
    fontSize: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  actionsRow: {
    gap: 10,
    marginBottom: 24,
  },
  actionBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  actionBtnSecondary: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  actionBtnTextSecondary: {
    color: Colors.secondary,
    fontWeight: '600',
    fontSize: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  seeAllText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  credCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    marginBottom: 12,
  },
  credHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  credTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  credDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  hashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    padding: 8,
    borderRadius: 8,
  },
  hashLabel: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  hashValue: {
    color: Colors.secondary,
    fontSize: 11,
    fontFamily: 'monospace',
    flex: 1,
  },
});
