import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

interface StatusBadgeProps {
  status: string;
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showDot = true }) => {
  const normalized = (status || '').toUpperCase();

  let bgColor = Colors.pendingBg;
  let textColor = Colors.pending;
  let label = status;

  if (normalized === 'VERIFIED' || normalized === 'ANCHORED') {
    bgColor = Colors.verifiedBg;
    textColor = Colors.verified;
    label = normalized === 'ANCHORED' ? 'ANCHORED' : 'VERIFIED';
  } else if (normalized === 'REVOKED') {
    bgColor = Colors.revokedBg;
    textColor = Colors.revoked;
    label = 'REVOKED';
  } else if (normalized === 'FAILED' || normalized === 'INVALID') {
    bgColor = Colors.revokedBg;
    textColor = Colors.revoked;
    label = normalized;
  } else if (normalized === 'PENDING') {
    bgColor = Colors.pendingBg;
    textColor = Colors.pending;
    label = 'PENDING';
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      {showDot && <Text style={[styles.dot, { color: textColor }]}>● </Text>}
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  dot: {
    fontSize: 8,
    marginRight: 2,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
