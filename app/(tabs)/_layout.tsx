import { Tabs, usePathname, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/ThemeContext';
import { getTabBarHeight, spacing } from '@/hooks/use-responsive';
import { loadSettings } from '@/utils/settings-storage';

export default function TabLayout() {
  const { resolvedScheme, theme } = useTheme();
  const tabBarHeight = getTabBarHeight();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;

    loadSettings().then((settings) => {
      if (settings.defaultTab !== 'index' && pathname === '/') {
        const routes: Record<string, string> = {
          explore: '/explore',
          profile: '/profile',
        };
        router.replace(routes[settings.defaultTab] || '/');
      }
    });
  }, []);

  const tabBarBottom = Platform.OS === 'android' 
    ? insets.bottom + spacing(12) 
    : spacing(18);

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
          bottom: tabBarBottom,
          height: 72,
          paddingTop: 10,
          paddingBottom: 10,
          borderTopWidth: 0,
          borderRadius: 20,
          backgroundColor:
            resolvedScheme === 'dark' ? 'rgba(23, 26, 33, 0.72)' : 'rgba(255, 255, 255, 0.72)',
          borderWidth: 1,
          borderColor: theme.border,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOpacity: resolvedScheme === 'dark' ? 0.35 : 0.12,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 10 },
            },
            android: {
              elevation: 0,
            },
            web: {
              boxShadow:
                resolvedScheme === 'dark'
                  ? '0px 10px 30px rgba(0, 0, 0, 0.45)'
                  : '0px 10px 30px rgba(15, 18, 34, 0.10)',
              backdropFilter: 'blur(18px) saturate(140%)',
              WebkitBackdropFilter: 'blur(18px) saturate(140%)',
              overflow: 'visible',
            } as any,
          }),
        },
        tabBarItemStyle: {
          marginHorizontal: spacing(6),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '待办',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: '工具',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="paperplane.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
