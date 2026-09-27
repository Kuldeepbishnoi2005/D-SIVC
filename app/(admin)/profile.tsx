import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/theme';
import { FloatingNavBar, NavItem } from '../../components/FloatingNavBar';
import { ShieldCheck, Mail, Building, Award, Calendar, LogOut, KeyRound, UserCheck } from 'lucide-react-native';

export default function AdminProfileScreen() {
  const { profile, user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Confirm Sign Out',
      'Are you sure you want to sign out of the Administrator Console?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const navItems: NavItem[] = [
    { key: 'dashboard', label: 'Dashboard', iconName: 'dashboard', route: '/(admin)/dashboard' },
    { key: 'students', label: 'Students', iconName: 'students', route: '/(admin)/students' },
    { key: 'credentials', label: 'Credentials', iconName: 'credentials', route: '/(admin)/credentials' },
    { key: 'profile', label: 'Profile', iconName: 'profile', route: '/(admin)/profile' },
  ];

  const adminName = profile?.full_name || 'System Administrator';
  const adminEmail = profile?.email || user?.email || 'admin@institution.edu';
  const institutionName = profile?.institution || 'Academic Institution';
  const departmentName = profile?.department || 'System & Identity Administration';
  const createdAt = profile?.created_at || user?.created_at;

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  // Get Initials for Avatar
  const initials = adminName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('') || 'AD';

  return (
    <View style={styles.mainWrapper}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card Header */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <Text style={styles.adminNameText}>{adminName}</Text>
          <Text style={styles.adminEmailText}>{adminEmail}</Text>

          <View style={styles.roleBadge}>
            <ShieldCheck size={14} color={Colors.primary} />
            <Text style={styles.roleBadgeText}>System Administrator</Text>
          </View>
        </View>

        {/* Institution & Account Details */}
        <Text style={styles.sectionHeader}>ACCOUNT INFORMATION</Text>

        <View style={styles.infoCard}>
          {/* Institution */}
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Building size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Institution</Text>
              <Text style={styles.infoValue}>{institutionName}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Department */}
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Award size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Department</Text>
              <Text style={styles.infoValue}>{departmentName}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Email Address */}
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Mail size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Primary Email</Text>
              <Text style={styles.infoValue}>{adminEmail}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Account Registered */}
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Calendar size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Registered Since</Text>
              <Text style={styles.infoValue}>{formattedDate}</Text>
            </View>
          </View>
        </View>

        {/* System Credentials & Security */}
        <Text style={styles.sectionHeader}>SECURITY & ACCESS</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <UserCheck size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Access Control Level</Text>
              <Text style={styles.infoValue}>Full Institutional Read / Write</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <KeyRound size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Smart Contract Authority</Text>
              <Text style={styles.infoValue}>Supabase Server-Side Key Vault</Text>
            </View>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={18} color={Colors.revoked} />
          <Text style={styles.logoutButtonText}>Sign Out of Admin Console</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Floating Icon-Only Navigation Bar */}
      <FloatingNavBar items={navItems} activeKey="profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 110,
  },
  profileHeaderCard: {
    backgroundColor: Colors.card,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: Colors.primary,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primary,
  },
  adminNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  adminEmailText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 16,
    textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    gap: 6,
  },
  roleBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: Colors.card,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginHorizontal: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    gap: 8,
    marginTop: 8,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.revoked,
  },
});
