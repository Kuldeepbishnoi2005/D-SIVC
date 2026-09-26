import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { credentialService } from '../../services/credentialService';
import { Credential } from '../../types';
import { Colors } from '../../constants/theme';
import { StatusBadge } from '../../components/StatusBadge';

export default function StudentCredentialsScreen() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const renderItem = ({ item }: { item: Credential }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(student)/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.title}>{item.credential_type}</Text>
        <StatusBadge status={item.blockchain_status} />
      </View>

      <Text style={styles.date}>Issued: {new Date(item.created_at).toLocaleDateString()}</Text>

      <View style={styles.hashBox}>
        <Text style={styles.hashLabel}>Credential Hash:</Text>
        <Text style={styles.hashText} numberOfLines={1} ellipsizeMode="middle">
          {item.credential_hash}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>My Credentials</Text>
        <Text style={styles.headerSubtitle}>Official academic credentials issued to your account</Text>
      </View>

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
              <Text style={styles.emptyTitle}>No credentials yet.</Text>
              <Text style={styles.emptyText}>You do not have any verifiable credentials registered on the system yet.</Text>
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
  headerBox: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  date: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  hashBox: {
    backgroundColor: Colors.inputBg,
    padding: 10,
    borderRadius: 10,
  },
  hashLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  hashText: {
    fontSize: 11,
    color: Colors.secondary,
    fontFamily: 'monospace',
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
