import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/theme';
import { Home, Award, User, Users, PlusCircle, LayoutDashboard } from 'lucide-react-native';

export interface NavItem {
  key: string;
  label: string;
  iconName: 'home' | 'credentials' | 'profile' | 'students' | 'issue' | 'dashboard';
  route: string;
  onPress?: () => void;
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
        return <Home size={22} color={color} />;
      case 'credentials':
        return <Award size={22} color={color} />;
      case 'profile':
        return <User size={22} color={color} />;
      case 'students':
        return <Users size={22} color={color} />;
      case 'issue':
        return <PlusCircle size={22} color={color} />;
      default:
        return <LayoutDashboard size={22} color={color} />;
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.navBar}>
        {items.map((item) => {
          const isActive = item.key === activeKey;
          const iconColor = isActive ? Colors.primary : Colors.textMuted;

          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => {
                if (item.onPress) {
                  item.onPress();
                } else if (item.route && !item.route.startsWith('#')) {
                  router.push(item.route as any);
                }
              }}
              activeOpacity={0.7}
            >
              {renderIcon(item.iconName, iconColor)}
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
    paddingHorizontal: 6,
    paddingVertical: 6,
    width: '100%',
    maxWidth: 420,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 9999,
  },
  navItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
});
