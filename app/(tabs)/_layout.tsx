import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { spacing, borderRadius, iconSize, getTabBarHeight } from '@/hooks/use-responsive';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme ?? 'light';
  const theme = Colors[scheme];
  const tabBarHeight = getTabBarHeight();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: 'absolute',
          left: spacing(16),
          right: spacing(16),
          bottom: spacing(18),
          height: tabBarHeight,
          paddingTop: spacing(8),
          paddingBottom: spacing(12),
          borderTopWidth: 0,
          borderRadius: borderRadius(24),
          backgroundColor:
            scheme === 'dark' ? 'rgba(23, 26, 33, 0.72)' : 'rgba(255, 255, 255, 0.72)',
          borderWidth: 1,
          borderColor: theme.border,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOpacity: scheme === 'dark' ? 0.35 : 0.12,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 10 },
            },
            android: {
              elevation: 18,
            },
            web: {
              boxShadow:
                scheme === 'dark'
                  ? '0px 10px 30px rgba(0, 0, 0, 0.45)'
                  : '0px 10px 30px rgba(15, 18, 34, 0.10)',
              backdropFilter: 'blur(18px) saturate(140%)',
              WebkitBackdropFilter: 'blur(18px) saturate(140%)',
            } as any,
          }),
        },
        tabBarItemStyle: {
          borderRadius: borderRadius(18),
          marginHorizontal: spacing(6),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          lineHeight: 14,
          marginTop: 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '待办',
          tabBarIcon: ({ color }) => <IconSymbol size={iconSize(28)} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: '工具',
          tabBarIcon: ({ color }) => <IconSymbol size={iconSize(28)} name="paperplane.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => <IconSymbol size={iconSize(28)} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
