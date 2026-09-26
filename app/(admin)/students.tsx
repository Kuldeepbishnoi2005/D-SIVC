import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { credentialService } from '../../services/credentialService';
import { UserProfile } from '../../types';
import { Colors } from '../../constants/theme';
import { CustomInput } from '../../components/CustomInput';
import { FloatingNavBar, NavItem } from '../../components/FloatingNavBar';
import { Users, Plus } from 'lucide-react-native';

export default function AdminStudentsScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadStudents = async () => {
    try {
      const data = await credentialService.getAllStudents();
      setStudents(data);
    } catch (err) {
      console.error('Error loading student directory:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStudents();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadStudents();
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(s =>
      s.full_name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.roll_number?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q) ||
      s.course?.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  const navItems: NavItem[] = [
    { key: 'dashboard', label: 'Dashboard', iconName: 'dashboard', route: '/(admin)/dashboard' },
    { key: 'students', label: 'Students', iconName: 'students', route: '/(admin)/students' },
    { key: 'credentials', label: 'Credentials', iconName: 'credentials', route: '/(admin)/credentials' },
    { key: 'profile', label: 'Profile', iconName: 'profile', route: '/(admin)/dashboard' },
  ];

  const renderItem = ({ item }: { item: UserProfile }) => (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.full_name?.charAt(0) || 'S'}</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.name}>{item.full_name}</Text>
        <Text style={styles.rollText}>Roll: {item.roll_number || 'Unassigned'}</Text>
        <Text style={styles.detailsText}>{item.course || item.department || 'Student'}</Text>
      </View>

      <TouchableOpacity
        style={styles.issueBtn}
        onPress={() => router.push({ pathname: '/(admin)/issue', params: { studentId: item.id } })}
        activeOpacity={0.8}
      >
        <Plus size={14} color={Colors.primaryText} />
        <Text style={styles.issueBtnText}>Issue</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>Students</Text>
        <Text style={styles.headerSubtitle}>Registered student directory</Text>

        <CustomInput
          placeholder="Search students by name, roll no, department..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Users size={36} color={Colors.textMuted} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>No Students Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No student accounts matching your search.' : 'There are currently no registered student accounts.'}
              </Text>
            </View>
          ) : null
        }
      />

      <FloatingNavBar items={navItems} activeKey="students" />
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
    paddingBottom: 4,
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
    marginBottom: 12,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 16,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.cardSecondary,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: Colors.primary,
    fontWeight: '800',
    fontSize: 18,
  },
  infoBox: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  rollText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  detailsText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  issueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  issueBtnText: {
    color: Colors.primaryText,
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
