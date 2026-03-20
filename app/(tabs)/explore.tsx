import { useTheme } from '@/contexts/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { borderRadius, fs, spacing } from '@/hooks/use-responsive';

export default function ToolsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');

  const tools = useMemo(
    () => [
      { key: 'scan', title: '扫一扫', icon: 'qr-code-scanner', route: '/tools/scanner' },
      { key: 'timer', title: '计时器', icon: 'timer', route: '/tools/timer' },
      { key: 'unit', title: '单位换算', icon: 'swap-horiz', route: '/tools/unit-converter' },
      { key: 'notes', title: '速记本', icon: 'edit-note', route: '/tools/quick-notes' },
    ],
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return tools;
    return tools.filter(t => t.title.includes(q));
  }, [query, tools]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: theme.text }]}>工具</Text>
            <Text style={[styles.subtitle, { color: theme.tabIconDefault }]}>常用功能一键直达</Text>
          </View>
        </View>

        <View style={[styles.searchWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <MaterialIcons name="search" size={20} color={theme.tabIconDefault} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="搜索工具..."
            placeholderTextColor={theme.tabIconDefault}
            style={[styles.searchInput, { color: theme.text }]}
            returnKeyType="search"
          />
          {!!query && (
            <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.8} style={styles.clearBtn}>
              <MaterialIcons name="close" size={18} color={theme.tabIconDefault} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>常用工具</Text>
        </View>

        <View style={styles.grid}>
          {filtered.map((tool) => (
            <TouchableOpacity
              key={tool.key}
              activeOpacity={0.85}
              style={[styles.toolCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => router.push(tool.route as any)}
            >
              <View style={[styles.toolIconWrap, { backgroundColor: theme.cardMuted }]}>
                <MaterialIcons name={tool.icon as any} size={22} color={theme.tint} />
              </View>
              <Text style={[styles.toolTitle, { color: theme.text }]} numberOfLines={1}>
                {tool.title}
              </Text>
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
    paddingHorizontal: spacing(16),
    paddingTop: spacing(10),
    paddingBottom: spacing(110),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing(14),
  },
  headerLeft: {
    gap: spacing(6),
  },
  title: {
    fontSize: fs(28),
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: fs(14),
    fontWeight: '600',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(10),
    borderRadius: borderRadius(18),
    borderWidth: 1,
    paddingHorizontal: spacing(14),
    paddingVertical: spacing(12),
    marginBottom: spacing(16),
  },
  searchInput: {
    flex: 1,
    fontSize: fs(16),
    fontWeight: '600',
    padding: 0,
  },
  clearBtn: {
    width: spacing(28),
    height: spacing(28),
    borderRadius: borderRadius(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
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
  toolCard: {
    width: '48%',
    borderRadius: borderRadius(22),
    borderWidth: 1,
    padding: spacing(14),
  },
  toolIconWrap: {
    width: spacing(44),
    height: spacing(44),
    borderRadius: borderRadius(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(10),
  },
  toolTitle: {
    fontSize: fs(16),
    fontWeight: '800',
    letterSpacing: -0.1,
  },
});
