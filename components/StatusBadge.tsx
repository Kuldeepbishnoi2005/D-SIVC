import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = (status || '').toUpperCase();

  let bgColor = Colors.pendingBg;
  let textColor = Colors.pending;
  let label = status;

  if (normalized === 'VERIFIED' || normalized === 'ANCHORED') {
    bgColor = Colors.verifiedBg;
    textColor = Colors.verified;
    label = 'VERIFIED';
  } else if (normalized === 'REVOKED' || normalized === 'FAILED') {
    bgColor = Colors.revokedBg;
    textColor = Colors.revoked;
    label = normalized;
  } else if (normalized === 'PENDING') {
    bgColor = Colors.pendingBg;
    textColor = Colors.pending;
    label = 'PENDING';
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor, borderColor: textColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
