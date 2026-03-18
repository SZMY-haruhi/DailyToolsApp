import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ToolsScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const theme = Colors[scheme];
  const [query, setQuery] = useState('');

  const tools = useMemo(
    () => [
      { key: 'timer', title: '计时器', icon: 'timer' },
      { key: 'calc', title: '计算器', icon: 'calculate' },
      { key: 'scan', title: '扫一扫', icon: 'qr-code-scanner' },
      { key: 'unit', title: '单位换算', icon: 'swap-horiz' },
      { key: 'notes', title: '速记', icon: 'edit-note' },
      { key: 'weather', title: '天气', icon: 'wb-sunny' },
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
          <Text style={[styles.sectionHint, { color: theme.tabIconDefault }]}>占位符图标</Text>
        </View>

        <View style={styles.grid}>
          {filtered.map((tool) => (
            <TouchableOpacity
              key={tool.key}
              activeOpacity={0.85}
              style={[styles.toolCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <View style={[styles.toolIconWrap, { backgroundColor: theme.cardMuted }]}>
                <MaterialIcons name={tool.icon as any} size={22} color={theme.tint} />
              </View>
              <Text style={[styles.toolTitle, { color: theme.text }]} numberOfLines={1}>
                {tool.title}
              </Text>
              <Text style={[styles.toolMeta, { color: theme.tabIconDefault }]}>开发中</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.noteCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.noteRow}>
            <MaterialIcons name="info-outline" size={20} color={theme.icon} />
            <Text style={[styles.noteText, { color: theme.tabIconDefault }]}>
              缺少的美术资产先用占位符代替，后续可替换成品牌插画/图标包。
            </Text>
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
  },
  headerLeft: {
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    padding: 0,
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sectionHint: {
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  toolCard: {
    width: '48%',
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
  },
  toolIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  toolMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
  },
  noteCard: {
    marginTop: 14,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
  },
  noteRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});
