import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const theme = Colors[scheme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>个人</Text>
            <Text style={[styles.subtitle, { color: theme.tabIconDefault }]}>账号与偏好设置</Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
            <MaterialIcons name="person" size={22} color={theme.icon} />
          </View>
        </View>

        <View
          style={[
            styles.hero,
            {
              backgroundColor:
                scheme === 'dark' ? 'rgba(23, 26, 33, 0.72)' : 'rgba(255, 255, 255, 0.72)',
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
          {[
            { key: 'settings', title: '设置', icon: 'settings' },
            { key: 'theme', title: '外观', icon: 'palette' },
            { key: 'sync', title: '同步', icon: 'cloud-sync' },
            { key: 'about', title: '关于', icon: 'info-outline' },
          ].map((item) => (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.85}
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <View style={[styles.cardIcon, { backgroundColor: theme.cardMuted }]}>
                <MaterialIcons name={item.icon as any} size={22} color={theme.tint} />
              </View>
              <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.cardMeta, { color: theme.tabIconDefault }]}>开发中</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  heroRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
    gap: 4,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  heroDesc: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  sectionHeader: {
    marginTop: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  cardMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
  },
});
