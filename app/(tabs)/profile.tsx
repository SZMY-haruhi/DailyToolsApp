import { SettingsDrawer } from '@/components/settings-drawer';
import { useTheme } from '@/contexts/ThemeContext';
import { borderRadius, fs, spacing } from '@/hooks/use-responsive';
import { HapticPresets } from '@/utils/haptics';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SettingsType = 'settings' | 'theme' | 'about' | null;

export default function ProfileScreen() {
  const { scheme, resolvedScheme, theme, setScheme } = useTheme();
  const [settingsType, setSettingsType] = useState<SettingsType>(null);

  const handleThemeChange = (newScheme: 'light' | 'dark' | 'system') => {
    setScheme(newScheme);
  };

  const openSettings = (type: SettingsType) => {
    HapticPresets.button();
    setSettingsType(type);
  };

  const closeSettings = () => {
    setSettingsType(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>个人</Text>
            <Text style={[styles.subtitle, { color: theme.tabIconDefault }]}>账号与偏好设置</Text>
          </View>
        </View>

        <View
          style={[
            styles.hero,
            {
              backgroundColor:
                resolvedScheme === 'dark' ? 'rgba(23, 26, 33, 0.72)' : 'rgba(255, 255, 255, 0.72)',
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.heroRow}>
            <View style={[styles.heroIcon, { backgroundColor: theme.cardMuted }]}>
              <MaterialIcons name="verified" size={22} color={theme.tint} />
            </View>
            <View style={styles.heroText}>
              <Text style={[styles.heroTitle, { color: theme.text }]}>游客模式</Text>
              <Text style={[styles.heroDesc, { color: theme.tabIconDefault }]}>
                这里的内容为占位，后续可接入登录与同步
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>快捷入口</Text>
        </View>

        <View style={styles.grid}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => openSettings('settings')}
          >
            <View style={[styles.cardIcon, { backgroundColor: theme.cardMuted }]}>
              <MaterialIcons name="settings" size={22} color={theme.tint} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
              设置
            </Text>
            <Text style={[styles.cardMeta, { color: theme.tabIconDefault }]}>通知、反馈、音效</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => openSettings('theme')}
          >
            <View style={[styles.cardIcon, { backgroundColor: theme.cardMuted }]}>
              <MaterialIcons name="palette" size={22} color={theme.tint} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
              外观
            </Text>
            <Text style={[styles.cardMeta, { color: theme.tabIconDefault }]}>主题切换</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => openSettings('about')}
          >
            <View style={[styles.cardIcon, { backgroundColor: theme.cardMuted }]}>
              <MaterialIcons name="info-outline" size={22} color={theme.tint} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
              关于
            </Text>
            <Text style={[styles.cardMeta, { color: theme.tabIconDefault }]}>版本信息</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <SettingsDrawer
        visible={!!settingsType}
        onClose={closeSettings}
        scheme={scheme}
        resolvedScheme={resolvedScheme}
        theme={theme}
        settingsType={settingsType}
        onThemeChange={handleThemeChange}
        onSettingsTypeChange={setSettingsType}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing(16),
    paddingTop: spacing(10),
    paddingBottom: spacing(110),
  },
  header: {
    paddingBottom: spacing(14),
  },
  title: {
    fontSize: fs(28),
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: spacing(6),
    fontSize: fs(14),
    fontWeight: '600',
  },
  hero: {
    borderRadius: borderRadius(24),
    borderWidth: 1,
    padding: spacing(16),
    marginBottom: spacing(14),
  },
  heroRow: {
    flexDirection: 'row',
    gap: spacing(12),
    alignItems: 'center',
  },
  heroIcon: {
    width: spacing(44),
    height: spacing(44),
    borderRadius: borderRadius(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
    gap: spacing(4),
  },
  heroTitle: {
    fontSize: fs(16),
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  heroDesc: {
    fontSize: fs(13),
    fontWeight: '600',
    lineHeight: 18,
  },
  sectionHeader: {
    marginTop: spacing(6),
    marginBottom: spacing(10),
  },
  sectionTitle: {
    fontSize: fs(18),
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(12),
  },
  card: {
    width: '48%',
    borderRadius: borderRadius(22),
    borderWidth: 1,
    padding: spacing(14),
  },
  cardIcon: {
    width: spacing(44),
    height: spacing(44),
    borderRadius: borderRadius(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(10),
  },
  cardTitle: {
    fontSize: fs(16),
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  cardMeta: {
    marginTop: spacing(4),
    fontSize: fs(12),
    fontWeight: '700',
  },
});
