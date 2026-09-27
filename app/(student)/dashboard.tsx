import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { credentialService } from '../../services/credentialService';
import { Credential } from '../../types';
import { Colors } from '../../constants/theme';
import { StatusBadge } from '../../components/StatusBadge';
import { FloatingNavBar, NavItem } from '../../components/FloatingNavBar';
import { ShieldCheck, LogOut, X, CheckCircle2, Award } from 'lucide-react-native';

export default function StudentDashboardScreen() {
  const { profile, logout } = useAuth();
  const router = useRouter();

  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

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
    setProfileModalVisible(false);
    await logout();
    router.replace('/(auth)/login');
  };

  const totalCount = credentials.length;
  const anchoredCount = credentials.filter(c => c.blockchain_status === 'ANCHORED').length;
  const revokedCount = credentials.filter(c => c.blockchain_status === 'REVOKED').length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 18) return 'Good afternoon,';
    return 'Good evening,';
  };

  const navItems: NavItem[] = [
    { key: 'home', label: 'Home', iconName: 'home', route: '/(student)/dashboard' },
    { key: 'credentials', label: 'Credentials', iconName: 'credentials', route: '/(student)/credentials' },
    { key: 'profile', label: 'Profile', iconName: 'profile', route: '/(student)/profile' },
  ];

  return (
    <View style={styles.mainWrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Top Greeting & Verification Badge */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greetingSub}>{getGreeting()}</Text>
            <Text style={styles.greetingName}>{profile?.full_name || 'Student'}</Text>
          </View>
          
          <View style={styles.identityPill}>
            <View style={styles.dotGreen} />
            <Text style={styles.identityPillText}>Identity Verified</Text>
          </View>
        </View>

        {/* Main Digital Identity Card (PARQ Large Rounded Style) */}
        <View style={styles.digitalIdCard}>
          <View style={styles.digitalIdHeader}>
            <View style={styles.brandRow}>
              <ShieldCheck size={20} color={Colors.primary} />
              <Text style={styles.brandText}>D-SIVC</Text>
            </View>
            <Text style={styles.cardSubtitle}>Digital Student Identity</Text>
          </View>

          <View style={styles.digitalIdBody}>
            <Text style={styles.idStudentName}>{profile?.full_name || 'Student Name'}</Text>
            <Text style={styles.idRollNo}>{profile?.roll_number || 'Roll No: Unassigned'}</Text>
            
            <View style={styles.idDetailGroup}>
              <Text style={styles.idCourseText}>{profile?.course || 'Degree Program'}</Text>
              <Text style={styles.idInstitutionText}>{profile?.institution || 'Academic Institution'}</Text>
            </View>
          </View>

          <View style={styles.digitalIdFooter}>
            <View style={styles.verifiedFooterPill}>
              <CheckCircle2 size={13} color={Colors.primary} />
              <Text style={styles.verifiedFooterText}>Identity Verified</Text>
            </View>
            <Text style={styles.idDeptText}>{profile?.department || 'Department'}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalCount}</Text>
            <Text style={styles.statLabel}>Credentials</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: Colors.verified }]}>{anchoredCount}</Text>
            <Text style={styles.statLabel}>Anchored</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: Colors.revoked }]}>{revokedCount}</Text>
            <Text style={styles.statLabel}>Revoked</Text>
          </View>
        </View>

        {/* Section Header: YOUR CREDENTIALS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>YOUR CREDENTIALS</Text>
          <TouchableOpacity onPress={() => router.push('/(student)/credentials')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        {/* Credential Cards */}
        {credentials.length === 0 ? (
          <View style={styles.emptyCard}>
            <Award size={32} color={Colors.textMuted} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyTitle}>No credentials yet</Text>
            <Text style={styles.emptyText}>
              Your institution has not issued any verifiable credentials to your account yet.
            </Text>
          </View>
        ) : (
          credentials.slice(0, 4).map((cred) => (
            <TouchableOpacity
              key={cred.id}
              style={styles.credCard}
              onPress={() => router.push(`/(student)/${cred.id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.credMainInfo}>
                <Text style={styles.credTitle}>{cred.credential_type}</Text>
                <Text style={styles.credSubtitle}>{profile?.course || 'Degree Certificate'}</Text>
                <Text style={styles.credIdCode}>ID: {cred.credential_id}</Text>
              </View>

              <View style={styles.credMetaRow}>
                <StatusBadge status={cred.blockchain_status} />
                <Text style={styles.credDateText}>
                  {new Date(cred.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Bottom Navigation Bar */}
      <FloatingNavBar 
        items={navItems} 
        activeKey="home" 
      />

      {/* Profile Modal */}
      <Modal
        visible={profileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.profileModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Student Profile</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.profileAvatarSection}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{(profile?.full_name || 'S')[0]}</Text>
              </View>
              <Text style={styles.profileModalName}>{profile?.full_name || 'Student'}</Text>
              <Text style={styles.profileModalEmail}>{profile?.email || 'student@college.edu'}</Text>
            </View>

            <View style={styles.profileDetailsList}>
              <View style={styles.profileDetailRow}>
                <Text style={styles.profileDetailLabel}>Roll Number</Text>
                <Text style={styles.profileDetailVal}>{profile?.roll_number || 'N/A'}</Text>
              </View>

              <View style={styles.profileDetailRow}>
                <Text style={styles.profileDetailLabel}>Course</Text>
                <Text style={styles.profileDetailVal}>{profile?.course || 'N/A'}</Text>
              </View>

              <View style={styles.profileDetailRow}>
                <Text style={styles.profileDetailLabel}>Department</Text>
                <Text style={styles.profileDetailVal}>{profile?.department || 'N/A'}</Text>
              </View>

              <View style={styles.profileDetailRow}>
                <Text style={styles.profileDetailLabel}>Institution</Text>
                <Text style={styles.profileDetailVal}>{profile?.institution || 'Academic Institution'}</Text>
              </View>

              <View style={styles.profileDetailRow}>
                <Text style={styles.profileDetailLabel}>Role</Text>
                <Text style={[styles.profileDetailVal, { color: Colors.primary }]}>Student</Text>
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
  contentContainer: {
    padding: 20,
    paddingTop: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingSub: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  greetingName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  identityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.verifiedBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    gap: 6,
  },
  dotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.verified,
  },
  identityPillText: {
    color: Colors.verified,
    fontSize: 11,
    fontWeight: '700',
  },
  digitalIdCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  digitalIdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  digitalIdBody: {
    marginBottom: 16,
  },
  idStudentName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  idRollNo: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 12,
  },
  idDetailGroup: {
    gap: 2,
  },
  idCourseText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  idInstitutionText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  digitalIdFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  verifiedFooterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  verifiedFooterText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
  },
  idDeptText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.cardSecondary,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1.2,
  },
  seeAllText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
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
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 18,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    marginBottom: 12,
  },
  credMainInfo: {
    marginBottom: 12,
  },
  credTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  credSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  credIdCode: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  credMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  credDateText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
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
