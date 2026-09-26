import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { credentialService } from '../../services/credentialService';
import { Colors } from '../../constants/theme';
import { Credential } from '../../types';

export default function AdminDashboardScreen() {
  const { profile } = useAuth();
  const router = useRouter();

  const [studentCount, setStudentCount] = useState<number>(0);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const students = await credentialService.getAllStudents();
      setStudentCount(students.length);

      const allCreds = await credentialService.getAllCredentials();
      setCredentials(allCreds);
    } catch (err) {
      console.error('Admin dashboard error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const totalCredentials = credentials.length;
  const anchoredCount = credentials.filter(c => c.blockchain_status === 'ANCHORED').length;
  const pendingCount = credentials.filter(c => c.blockchain_status === 'PENDING').length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Admin Header Card */}
      <View style={styles.adminCard}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>INSTITUTION ADMIN</Text>
        </View>
        <Text style={styles.adminName}>{profile?.full_name || 'Admin Officer'}</Text>
        <Text style={styles.institutionName}>{profile?.institution || 'Academic Institution'}</Text>
      </View>

      {/* Metrics Grid */}
      <Text style={styles.sectionTitle}>System Overview</Text>
      <View style={styles.metricsGrid}>
        <TouchableOpacity
          style={styles.metricCard}
          onPress={() => router.push('/(admin)/students')}
        >
          <Text style={styles.metricValue}>{studentCount}</Text>
          <Text style={styles.metricLabel}>Total Students</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.metricCard}
          onPress={() => router.push('/(admin)/credentials')}
        >
          <Text style={[styles.metricValue, { color: Colors.secondary }]}>{totalCredentials}</Text>
          <Text style={styles.metricLabel}>Total Credentials</Text>
        </TouchableOpacity>

        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: Colors.verified }]}>{anchoredCount}</Text>
          <Text style={styles.metricLabel}>Anchored Credentials</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: Colors.pending }]}>{pendingCount}</Text>
          <Text style={styles.metricLabel}>Pending Credentials</Text>
        </View>
      </View>

      {/* Primary Actions */}
      <Text style={styles.sectionTitle}>Administrative Actions</Text>

      <TouchableOpacity
        style={styles.primaryActionCard}
        onPress={() => router.push('/(admin)/issue')}
      >
        <View style={styles.actionIconBox}>
          <Text style={styles.actionIcon}>➕</Text>
        </View>
        <View style={styles.actionTextBox}>
          <Text style={styles.actionTitle}>Issue New Credential</Text>
          <Text style={styles.actionSub}>Create and issue verifiable credential to a student</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryActionCard}
        onPress={() => router.push('/(admin)/credentials')}
      >
        <View style={styles.actionIconBox}>
          <Text style={styles.actionIcon}>🚫</Text>
        </View>
        <View style={styles.actionTextBox}>
          <Text style={styles.actionTitle}>Manage & Revoke Credentials</Text>
          <Text style={styles.actionSub}>View all issued credentials and execute on-chain revocation</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryActionCard}
        onPress={() => router.push('/(admin)/students')}
      >
        <View style={styles.actionIconBox}>
          <Text style={styles.actionIcon}>👥</Text>
        </View>
        <View style={styles.actionTextBox}>
          <Text style={styles.actionTitle}>Student Directory</Text>
          <Text style={styles.actionSub}>Browse registered student accounts and details</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryActionCard}
        onPress={() => router.push('/verify')}
      >
        <View style={styles.actionIconBox}>
          <Text style={styles.actionIcon}>🔍</Text>
        </View>
        <View style={styles.actionTextBox}>
          <Text style={styles.actionTitle}>Public Verification Console</Text>
          <Text style={styles.actionSub}>Verify credential integrity by hash or ID</Text>
        </View>
      </TouchableOpacity>
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
  adminCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    marginBottom: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  adminName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  institutionName: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 14,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  metricCard: {
    width: '48%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  primaryActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderColor: Colors.primary,
    borderWidth: 1.5,
    marginBottom: 14,
  },
  secondaryActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    marginBottom: 14,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionTextBox: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  actionSub: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
