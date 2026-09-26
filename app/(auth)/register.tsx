import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [course, setCourse] = useState('B.Tech Computer Science');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [role, setRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      setErrorMsg('Full Name, Email, and Password are required.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    const { error } = await register({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      rollNumber: rollNumber.trim(),
      course: course.trim(),
      department: department.trim(),
      role,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message || 'Registration failed.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.appTitle}>D-SIVC</Text>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Register your identity on the platform</Text>
      </View>

      <View style={styles.formCard}>
        {errorMsg ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorCardText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Role Selector */}
        <View style={styles.roleContainer}>
          <Text style={styles.roleLabel}>Account Role:</Text>
          <View style={styles.roleButtons}>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'student' && styles.roleBtnActive]}
              onPress={() => setRole('student')}
            >
              <Text style={[styles.roleBtnText, role === 'student' && styles.roleBtnTextActive]}>Student</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'admin' && styles.roleBtnActive]}
              onPress={() => setRole('admin')}
            >
              <Text style={[styles.roleBtnText, role === 'admin' && styles.roleBtnTextActive]}>Admin</Text>
            </TouchableOpacity>
          </View>
        </View>

        <CustomInput
          label="Full Name *"
          placeholder="e.g. Rahul Sharma"
          value={fullName}
          onChangeText={setFullName}
        />

        <CustomInput
          label="Email Address *"
          placeholder="rahul@student.edu"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <CustomInput
          label="Password *"
          placeholder="At least 6 characters"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {role === 'student' ? (
          <>
            <CustomInput
              label="Roll Number"
              placeholder="e.g. CS-2026-042"
              value={rollNumber}
              onChangeText={setRollNumber}
            />

            <CustomInput
              label="Course"
              placeholder="e.g. B.Tech Computer Science"
              value={course}
              onChangeText={setCourse}
            />

            <CustomInput
              label="Department"
              placeholder="e.g. Computer Science & Eng."
              value={department}
              onChangeText={setDepartment}
            />
          </>
        ) : null}

        <CustomButton
          title="Complete Registration"
          onPress={handleRegister}
          loading={loading}
          style={{ marginTop: 16 }}
        />

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already registered? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.linkText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  appTitle: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  formCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
  },
  errorCard: {
    backgroundColor: Colors.revokedBg,
    borderColor: Colors.revoked,
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorCardText: {
    color: Colors.text,
    fontSize: 13,
  },
  roleContainer: {
    marginBottom: 16,
  },
  roleLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  roleButtons: {
    flexDirection: 'row',
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  roleBtnActive: {
    backgroundColor: Colors.primary,
  },
  roleBtnText: {
    color: Colors.textMuted,
    fontWeight: '600',
    fontSize: 14,
  },
  roleBtnTextActive: {
    color: Colors.text,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  linkText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
