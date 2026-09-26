import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { credentialService } from '../../services/credentialService';
import { Colors } from '../../constants/theme';
import { Credential } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { FloatingNavBar, NavItem } from '../../components/FloatingNavBar';
import { PlusCircle, Award, LogOut, X, ChevronRight, ShieldCheck } from 'lucide-react-native';

export default function AdminDashboardScreen() {
  const { profile, logout } = useAuth();
  const router = useRouter();

  const [studentCount, setStudentCount] = useState<number>(0);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

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

  const handleLogout = async () => {
    setProfileModalVisible(false);
    await logout();
    router.replace('/(auth)/login');
  };

  const totalCredentials = credentials.length;
  const anchoredCount = credentials.filter(c => c.blockchain_status === 'ANCHORED').length;
  const revokedCount = credentials.filter(c => c.blockchain_status === 'REVOKED' || c.revoked_at).length;

  const navItems: NavItem[] = [
    { key: 'dashboard', label: 'Dashboard', iconName: 'dashboard', route: '/(admin)/dashboard' },
    { key: 'students', label: 'Students', iconName: 'students', route: '/(admin)/students' },
    { key: 'credentials', label: 'Credentials', iconName: 'credentials', route: '/(admin)/credentials' },
    { key: 'profile', label: 'Profile', iconName: 'profile', route: '#admin-profile' },
  ];

  return (
    <View style={styles.mainWrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Top Header Greeting */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.greetingSub}>Good morning,</Text>
            <Text style={styles.greetingName}>Admin</Text>
          </View>

          <View style={styles.adminRolePill}>
            <ShieldCheck size={14} color={Colors.primary} />
            <Text style={styles.adminRolePillText}>Institution Admin</Text>
          </View>
        </View>

        {/* System Overview Stats Grid (PARQ Compact 2x2 Grid) */}
        <Text style={styles.sectionHeaderLabel}>OVERVIEW</Text>
        
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(admin)/students')}
            activeOpacity={0.8}
          >
            <Text style={styles.statValue}>{studentCount}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(admin)/credentials')}
            activeOpacity={0.8}
          >
            <Text style={styles.statValue}>{totalCredentials}</Text>
            <Text style={styles.statLabel}>Credentials</Text>
          </TouchableOpacity>

          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.verified }]}>{anchoredCount}</Text>
            <Text style={styles.statLabel}>Anchored</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.revoked }]}>{revokedCount}</Text>
            <Text style={styles.statLabel}>Revoked</Text>
          </View>
        </View>

        {/* Primary Action Button: Issue Credential */}
        <TouchableOpacity
          style={styles.issuePrimaryBanner}
          onPress={() => router.push('/(admin)/issue')}
          activeOpacity={0.85}
        >
          <View style={styles.issueBannerLeft}>
            <PlusCircle size={22} color={Colors.primaryText} />
            <Text style={styles.issueBannerTitle}>Issue Credential</Text>
          </View>
          <ChevronRight size={18} color={Colors.primaryText} />
        </TouchableOpacity>

        {/* Recent Credentials Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderLabel}>RECENT CREDENTIALS</Text>
          <TouchableOpacity onPress={() => router.push('/(admin)/credentials')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        {credentials.length === 0 ? (
          <View style={styles.emptyCard}>
            <Award size={32} color={Colors.textMuted} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyTitle}>No credentials issued</Text>
            <Text style={styles.emptyText}>Tap &quot;Issue Credential&quot; to issue the first credential.</Text>
          </View>
        ) : (
          credentials.slice(0, 4).map((cred) => (
            <TouchableOpacity
              key={cred.id}
              style={styles.credCard}
              onPress={() => router.push('/(admin)/credentials')}
              activeOpacity={0.8}
            >
              <View style={styles.credMain}>
                <Text style={styles.credStudentName}>{cred.student?.full_name || 'Student'}</Text>
                <Text style={styles.credType}>{cred.credential_type}</Text>
                <Text style={styles.credId}>ID: {cred.credential_id}</Text>
              </View>

              <View style={styles.credRight}>
                <StatusBadge status={cred.blockchain_status === 'REVOKED' || cred.revoked_at ? 'REVOKED' : cred.blockchain_status} />
                <Text style={styles.credDate}>
                  {new Date(cred.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Bottom Navigation Bar */}
      <FloatingNavBar items={navItems} activeKey="dashboard" />

      {/* Admin Profile Modal */}
      <Modal
        visible={profileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.profileModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Admin Profile</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.profileAvatarSection}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>A</Text>
              </View>
              <Text style={styles.profileModalName}>{profile?.full_name || 'Institution Admin'}</Text>
              <Text style={styles.profileModalEmail}>{profile?.email || 'admin@college.edu'}</Text>
            </View>

            <View style={styles.profileDetailsList}>
              <View style={styles.profileDetailRow}>
                <Text style={styles.profileDetailLabel}>Institution</Text>
                <Text style={styles.profileDetailVal}>{profile?.institution || 'Academic Institution'}</Text>
              </View>

              <View style={styles.profileDetailRow}>
                <Text style={styles.profileDetailLabel}>Role</Text>
                <Text style={[styles.profileDetailVal, { color: Colors.primary }]}>Institution Admin</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout}>
              <LogOut size={16} color={Colors.revoked} />
              <Text style={styles.signOutBtnText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 16,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingSub: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  greetingName: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  adminRolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.verifiedBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    gap: 6,
  },
  adminRolePillText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.card,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  issuePrimaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    borderRadius: 9999,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 24,
  },
  issueBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  issueBannerTitle: {
    color: Colors.primaryText,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  credCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    marginBottom: 12,
  },
  credMain: {
    flex: 1,
    marginRight: 12,
  },
  credStudentName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  credType: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  credId: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  credRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  credDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  profileModalContent: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  profileAvatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primaryText,
  },
  profileModalName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  profileModalEmail: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  profileDetailsList: {
    backgroundColor: Colors.cardSecondary,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  profileDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileDetailLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  profileDetailVal: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  signOutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.revokedBg,
    paddingVertical: 14,
    borderRadius: 9999,
  },
  signOutBtnText: {
    color: Colors.revoked,
    fontWeight: '700',
    fontSize: 14,
  },
});
