import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { Colors } from '../../constants/theme';
import { credentialService } from '../../services/credentialService';
import { UserProfile } from '../../types';
import { ArrowLeft } from 'lucide-react-native';

export default function AdminIssueCredentialScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ studentId?: string }>();

  const [students, setStudents] = useState<UserProfile[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(params.studentId || '');
  const [credentialType, setCredentialType] = useState('Bachelor of Technology in Computer Science');
  const [degreeClass, setDegreeClass] = useState('First Class with Distinction');
  const [cgpa, setCgpa] = useState('8.95');
  const [graduationYear, setGraduationYear] = useState('2026');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function fetchStudents() {
      try {
        const data = await credentialService.getAllStudents();
        if (isMounted) {
          setStudents(data);
          if (!params.studentId && data.length > 0) {
            setSelectedStudentId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching students for dropdown:', err);
      }
    }

    fetchStudents();

    return () => {
      isMounted = false;
    };
  }, [params.studentId]);

  const handleIssueCredential = async () => {
    if (!selectedStudentId) {
      setErrorMsg('Please select a student to issue the credential to.');
      return;
    }
    if (!credentialType) {
      setErrorMsg('Please enter a credential type.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const studentObj = students.find((s) => s.id === selectedStudentId);

    const credentialData = {
      student_id: selectedStudentId,
      student_name: studentObj?.full_name || 'N/A',
      roll_number: studentObj?.roll_number || 'N/A',
      course: studentObj?.course || 'N/A',
      department: studentObj?.department || 'N/A',
      institution: studentObj?.institution || 'Academic Institution',
      credential_type: credentialType.trim(),
      degree_class: degreeClass.trim(),
      cgpa: cgpa.trim(),
      graduation_year: graduationYear.trim(),
      issued_at: new Date().toISOString(),
    };

    try {
      const result = await credentialService.createCredential(
        selectedStudentId,
        credentialType.trim(),
        credentialData
      );

      setLoading(false);

      if (result) {
        const isAnchored = result.blockchain_status === 'ANCHORED';
        const statusMsg = isAnchored
          ? `Credential issued & anchored to Polygon Amoy! Tx: ${result.blockchain_tx_hash?.substring(0, 14)}...`
          : `Credential issued! ID: ${result.credential_id} (Status: PENDING)`;

        setSuccessMsg(statusMsg);
        Alert.alert(
          isAnchored ? 'Credential Anchored On-Chain' : 'Credential Created',
          isAnchored
            ? `Successfully generated ${result.credential_id} and anchored SHA-256 hash to Polygon Amoy Testnet.\n\nTx Hash: ${result.blockchain_tx_hash}`
            : `Successfully generated ${result.credential_id} with SHA-256 hash (${result.credential_hash.substring(0, 14)}...). Status: PENDING.`,
          [{ text: 'View Dashboard', onPress: () => router.push('/(admin)/dashboard') }]
        );
      } else {
        setErrorMsg('Failed to issue credential. Check Supabase RLS permissions.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Error occurred while issuing credential.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Top Header Navigation */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <ArrowLeft size={18} color={Colors.text} />
        <Text style={styles.backBtnText}>Dashboard</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Issue Credential</Text>
      <Text style={styles.subtitle}>
        Issue cryptographically verifiable credentials anchored to Polygon Amoy.
      </Text>

      {errorMsg ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorCardText}>{errorMsg}</Text>
        </View>
      ) : null}

      {successMsg ? (
        <View style={styles.successCard}>
          <Text style={styles.successCardText}>{successMsg}</Text>
        </View>
      ) : null}

      <View style={styles.formCard}>
        {/* Student Selection */}
        <Text style={styles.inputLabel}>Select Student *</Text>
        {students.length === 0 ? (
          <Text style={styles.noStudentsText}>No registered student accounts available.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.studentChipScroll}>
            {students.map((student) => {
              const isSelected = student.id === selectedStudentId;
              return (
                <TouchableOpacity
                  key={student.id}
                  style={[styles.studentChip, isSelected && styles.studentChipSelected]}
                  onPress={() => setSelectedStudentId(student.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.studentChipText, isSelected && styles.studentChipTextSelected]}>
                    {student.full_name} ({student.roll_number || 'No Roll'})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <CustomInput
          label="Credential Title *"
          placeholder="e.g. Bachelor of Technology in Computer Science"
          value={credentialType}
          onChangeText={setCredentialType}
        />

        <CustomInput
          label="Degree Classification"
          placeholder="e.g. First Class with Distinction"
          value={degreeClass}
          onChangeText={setDegreeClass}
        />

        <View style={styles.row}>
          <View style={styles.flex1}>
            <CustomInput
              label="CGPA / Grade"
              placeholder="8.95"
              value={cgpa}
              onChangeText={setCgpa}
            />
          </View>
          <View style={{ width: 12 }} />
          <View style={styles.flex1}>
            <CustomInput
              label="Graduation Year"
              placeholder="2026"
              value={graduationYear}
              onChangeText={setGraduationYear}
            />
          </View>
        </View>

        <CustomButton
          title="Sign & Issue Credential"
          onPress={handleIssueCredential}
          loading={loading}
          style={{ marginTop: 12 }}
        />
      </View>
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
    paddingBottom: 40,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 20,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
  },
  errorCard: {
    backgroundColor: Colors.revokedBg,
    borderColor: Colors.revoked,
    borderWidth: 1,
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
  },
  errorCardText: {
    color: Colors.revoked,
    fontSize: 13,
    fontWeight: '600',
  },
  successCard: {
    backgroundColor: Colors.verifiedBg,
    borderColor: Colors.verified,
    borderWidth: 1,
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
  },
  successCardText: {
    color: Colors.verified,
    fontSize: 13,
    fontWeight: '600',
  },
  inputLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noStudentsText: {
    color: Colors.textMuted,
    fontSize: 13,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  studentChipScroll: {
    marginBottom: 16,
  },
  studentChip: {
    backgroundColor: Colors.cardSecondary,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    marginRight: 8,
  },
  studentChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  studentChipText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  studentChipTextSelected: {
    color: Colors.primaryText,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
});
