import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/theme';
import { Home, Award, User, Users, PlusCircle, LayoutDashboard } from 'lucide-react-native';

export interface NavItem {
  key: string;
  label: string;
  iconName: 'home' | 'credentials' | 'profile' | 'students' | 'issue' | 'dashboard';
  route: string;
}

interface FloatingNavBarProps {
  items: NavItem[];
  activeKey: string;
}

export const FloatingNavBar: React.FC<FloatingNavBarProps> = ({ items, activeKey }) => {
  const router = useRouter();

  const renderIcon = (iconName: string, color: string) => {
    switch (iconName) {
      case 'home':
      case 'dashboard':
        return <Home size={18} color={color} />;
      case 'credentials':
        return <Award size={18} color={color} />;
      case 'profile':
        return <User size={18} color={color} />;
      case 'students':
        return <Users size={18} color={color} />;
      case 'issue':
        return <PlusCircle size={18} color={color} />;
      default:
        return <LayoutDashboard size={18} color={color} />;
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.navBar}>
        {items.map((item) => {
          const isActive = item.key === activeKey;
          const iconColor = isActive ? Colors.primary : Colors.textMuted;
          const textColor = isActive ? Colors.text : Colors.textMuted;

          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              {renderIcon(item.iconName, iconColor)}
              <Text style={[styles.navText, { color: textColor }]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 999,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#181B1C',
    borderColor: '#303535',
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 6,
    width: '100%',
    maxWidth: 420,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    gap: 6,
  },
  navItemActive: {
    backgroundColor: '#202425',
  },
  navText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
