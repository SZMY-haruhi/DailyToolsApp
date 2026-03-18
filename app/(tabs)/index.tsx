import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddTaskDrawer } from '@/components/add-task-drawer';
import { MessagesDrawer } from '@/components/messages-drawer';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  borderRadius,
  fs,
  getTabBarHeight,
  iconSize,
  spacing
} from '@/hooks/use-responsive';

type Task = {
  id: string;
  text: string;
  done: boolean;
  remindAt?: number | null;
  reminded?: boolean;
};

type DmMessage = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
};

const STORAGE = {
  firstOpen: 'dt_first_open_v1',
  noticeDot: 'dt_unread_notice_v1',
  dmDot: 'dt_unread_dm_intro_v1',
  tasks: 'dt_tasks_v1',
  dm: 'dt_dm_messages_v1',
};

export default function HomeScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const theme = Colors[scheme];
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [hasDmDot, setHasDmDot] = useState(false);
  const [hasNoticeDot, setHasNoticeDot] = useState(false);
  const [dismissAllSeq, setDismissAllSeq] = useState(0);
  const [dmMessages, setDmMessages] = useState<DmMessage[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const first = await AsyncStorage.getItem(STORAGE.firstOpen);
        if (first !== '1') {
          await Promise.all([
            AsyncStorage.setItem(STORAGE.firstOpen, '1'),
            AsyncStorage.setItem(STORAGE.dmDot, '1'),
            AsyncStorage.setItem(STORAGE.noticeDot, '1'),
            AsyncStorage.setItem(STORAGE.tasks, '[]'),
            AsyncStorage.setItem(STORAGE.dm, '[]'),
          ]);
          if (!cancelled) {
            setHasDmDot(true);
            setHasNoticeDot(true);
            setTasks([]);
            setDmMessages([]);
          }
          return;
        }

        const [dmDot, noticeDot, tasksJson, dmJson] = await Promise.all([
          AsyncStorage.getItem(STORAGE.dmDot),
          AsyncStorage.getItem(STORAGE.noticeDot),
          AsyncStorage.getItem(STORAGE.tasks),
          AsyncStorage.getItem(STORAGE.dm),
        ]);

        const parsedTasks = tasksJson ? (JSON.parse(tasksJson) as Task[]) : [];
        const parsedDm = dmJson ? (JSON.parse(dmJson) as DmMessage[]) : [];

        if (!cancelled) {
          setHasDmDot(dmDot === '1');
          setHasNoticeDot(noticeDot === '1');
          setTasks(Array.isArray(parsedTasks) ? parsedTasks : []);
          setDmMessages(Array.isArray(parsedDm) ? parsedDm : []);
        }
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE.tasks, JSON.stringify(tasks)).catch(() => {});
  }, [tasks]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE.dm, JSON.stringify(dmMessages)).catch(() => {});
  }, [dmMessages]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE.dmDot, hasDmDot ? '1' : '0').catch(() => {});
  }, [hasDmDot]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE.noticeDot, hasNoticeDot ? '1' : '0').catch(() => {});
  }, [hasNoticeDot]);

  const [now, setNow] = useState(() => new Date());
  const tasksRef = useRef<Task[]>([]);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    const id = setInterval(() => {
      const current = new Date();
      setNow(current);

      const currentTasks = tasksRef.current;
      const due = currentTasks.filter(
        (t) => typeof t.remindAt === 'number' && !t.reminded && (t.remindAt as number) <= current.getTime()
      );

      if (!due.length) return;

      const hh = String(current.getHours()).padStart(2, '0');
      const mm = String(current.getMinutes()).padStart(2, '0');
      const time = `${hh}:${mm}`;

      const nextMessages: DmMessage[] = due.map((t) => ({
        id: `dm_${t.id}`,
        title: '任务提醒',
        body: `到时间啦：${t.text}`,
        time,
        unread: true,
      }));

      setTasks((prev) =>
        prev.map((t) => (due.some((d) => d.id === t.id) ? { ...t, reminded: true } : t))
      );
      setDmMessages((prev) => [...nextMessages, ...prev]);
      setHasDmDot(true);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const timeText = useMemo(() => {
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }, [now]);

  const addTask = (text: string, remindAt: number | null, note: string) => {
    const id = Date.now().toString();
    setTasks((prev) => [
      ...prev,
      {
        id,
        text,
        done: false,
        remindAt,
        reminded: false,
      },
    ]);
  };

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const doneCount = tasks.filter(t => t.done).length;
  const totalCount = tasks.length;
  const percent = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  const markDmDotRead = () => {
    setHasDmDot(false);
  };

  const markNoticeRead = () => {
    setHasNoticeDot(false);
  };

  const markAllRead = () => {
    setHasDmDot(false);
    setHasNoticeDot(false);
    setDismissAllSeq((s) => s + 1);
  };

  const dismissDmMessage = (id: string) => {
    setDmMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const hasBellDot = hasNoticeDot || hasDmDot || dmMessages.length > 0;

  const tabBarHeight = getTabBarHeight();
  const listPaddingBottom = tabBarHeight + spacing(20);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: theme.text }]}>{timeText}</Text>
            <Text style={[styles.subtitle, { color: theme.tabIconDefault }]}>欢迎回来</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.iconButton, { backgroundColor: theme.card }]}
              onPress={() => setIsMessagesOpen(true)}
            >
              <MaterialIcons name="notifications-none" size={iconSize(22)} color={theme.icon} />
              {hasBellDot && <View style={[styles.notifyDot, { backgroundColor: theme.tint }]} />}
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={[styles.heroTitle, { color: theme.text }]}>今日待办</Text>
              <Text style={[styles.heroMeta, { color: theme.tabIconDefault }]}>
                已完成 {doneCount}/{totalCount}
              </Text>
            </View>
            <View style={[styles.heroBadge, { backgroundColor: 'rgba(255, 77, 141, 0.14)' }]}>
              <Text style={[styles.heroBadgeText, { color: theme.tint }]}>{percent}%</Text>
            </View>
          </View>

          <View
            style={[
              styles.progressTrack,
              {
                backgroundColor:
                  scheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 18, 34, 0.08)',
              },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${percent}%`,
                  backgroundColor: theme.tint,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>任务</Text>
          <View style={[styles.pill, { backgroundColor: theme.card }]}>
            <MaterialIcons name="filter-list" size={iconSize(18)} color={theme.icon} />
            <Text style={[styles.pillText, { color: theme.tabIconDefault }]}>全部</Text>
          </View>
        </View>

        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: listPaddingBottom }]}
          renderItem={({ item }) => (
            <View style={[styles.taskRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <TouchableOpacity
                onPress={() => toggleTask(item.id)}
                activeOpacity={0.8}
                style={styles.taskLeft}
              >
                <MaterialIcons
                  name={item.done ? 'check-box' : 'check-box-outline-blank'}
                  size={iconSize(22)}
                  color={item.done ? theme.tint : theme.tabIconDefault}
                />
                <Text
                  style={[
                    styles.taskText,
                    { color: theme.text },
                    item.done ? styles.taskDone : undefined,
                  ]}
                  numberOfLines={2}
                >
                  {item.text}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteTask(item.id)} activeOpacity={0.8}>
                <MaterialIcons name="delete-outline" size={iconSize(22)} color={theme.tabIconDefault} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <TouchableOpacity
              style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => setIsAddTaskOpen(true)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="add-circle-outline" size={iconSize(32)} color={theme.tabIconDefault} />
              <Text style={[styles.empty, { color: theme.tabIconDefault }]}>还没有任务，点击添加</Text>
            </TouchableOpacity>
          }
        />

        {tasks.length > 0 && (
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: theme.tint }]}
            onPress={() => setIsAddTaskOpen(true)}
            activeOpacity={0.85}
          >
            <MaterialIcons name="add" size={iconSize(28)} color="#0D0F14" />
          </TouchableOpacity>
        )}
      </SafeAreaView>

      <AddTaskDrawer
        visible={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        scheme={scheme}
        theme={theme}
        onAddTask={addTask}
      />

      <MessagesDrawer
        visible={isMessagesOpen}
        onClose={() => setIsMessagesOpen(false)}
        scheme={scheme}
        theme={theme}
        dmMessages={dmMessages}
        hasDmDot={hasDmDot || dmMessages.length > 0}
        hasNoticeDot={hasNoticeDot}
        dismissAllSeq={dismissAllSeq}
        onMarkDmDotRead={markDmDotRead}
        onMarkNoticeRead={markNoticeRead}
        onDismissDmMessage={dismissDmMessage}
        onMarkAllRead={markAllRead}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
    paddingHorizontal: spacing(16),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing(10),
    paddingBottom: spacing(14),
  },
  headerLeft: {
    gap: spacing(6),
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(10),
  },
  iconButton: {
    width: spacing(40),
    height: spacing(40),
    borderRadius: borderRadius(14),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifyDot: {
    position: 'absolute',
    top: spacing(8),
    right: spacing(9),
    width: spacing(8),
    height: spacing(8),
    borderRadius: 999,
  },
  greeting: {
    fontSize: fs(28),
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: fs(14),
    fontWeight: '600',
  },
  heroCard: {
    borderRadius: borderRadius(22),
    padding: spacing(16),
    borderWidth: 1,
    marginBottom: spacing(14),
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(14),
  },
  heroTitle: {
    fontSize: fs(18),
    fontWeight: '800',
  },
  heroMeta: {
    marginTop: spacing(4),
    fontSize: fs(13),
    fontWeight: '600',
  },
  heroBadge: {
    paddingHorizontal: spacing(10),
    paddingVertical: spacing(6),
    borderRadius: 999,
  },
  heroBadgeText: {
    fontSize: fs(12),
    fontWeight: '700',
  },
  progressTrack: {
    height: spacing(10),
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing(6),
    marginBottom: spacing(10),
  },
  sectionTitle: {
    fontSize: fs(18),
    fontWeight: '800',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(6),
    paddingHorizontal: spacing(12),
    paddingVertical: spacing(8),
    borderRadius: 999,
  },
  pillText: {
    fontSize: fs(13),
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: spacing(130),
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(14),
    paddingVertical: spacing(12),
    borderRadius: borderRadius(18),
    borderWidth: 1,
    marginBottom: spacing(10),
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing(10),
  },
  taskText: {
    fontSize: fs(16),
    flex: 1,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  taskDone: {
    textDecorationLine: 'line-through',
    opacity: 0.55,
  },
  empty: {
    marginTop: spacing(8),
    fontSize: fs(14),
    fontWeight: '600',
  },
  emptyCard: {
    borderRadius: borderRadius(22),
    borderWidth: 1,
    paddingVertical: spacing(32),
    alignItems: 'center',
    gap: spacing(8),
  },
  fab: {
    position: 'absolute',
    bottom: spacing(24),
    right: spacing(16),
    width: spacing(56),
    height: spacing(56),
    borderRadius: borderRadius(28),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4D8D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
