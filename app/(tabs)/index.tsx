import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
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
import { HapticPresets } from '@/utils/haptics';
import {
    cancelTaskReminder,
    requestNotificationPermissions,
    scheduleTaskReminder,
} from '@/utils/notifications';

type Task = {
  id: string;
  text: string;
  done: boolean;
  remindAt?: number | null;
  reminded?: boolean;
  notificationId?: string | null;
  note?: string;
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
  const [editTask, setEditTask] = useState<EditTaskData>(null);
  const [hasDmDot, setHasDmDot] = useState(false);
  const [hasNoticeDot, setHasNoticeDot] = useState(false);
  const [dismissAllSeq, setDismissAllSeq] = useState(0);
  const [dmMessages, setDmMessages] = useState<DmMessage[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

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

  const addTask = async (text: string, remindAt: number | null, note: string) => {
    const id = Date.now().toString();
    let notificationId: string | null = null;

    if (remindAt) {
      notificationId = await scheduleTaskReminder(
        id,
        '任务提醒',
        `到时间啦：${text}`,
        new Date(remindAt)
      );
    }

    setTasks((prev) => [
      ...prev,
      {
        id,
        text,
        done: false,
        remindAt,
        reminded: false,
        notificationId,
        note,
      },
    ]);
  };

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const deleteTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task?.notificationId) {
      await cancelTaskReminder(task.notificationId);
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTask = async (id: string, text: string, remindAt: number | null, note: string) => {
    const oldTask = tasks.find((t) => t.id === id);
    if (oldTask?.notificationId) {
      await cancelTaskReminder(oldTask.notificationId);
    }

    let notificationId: string | null = null;
    if (remindAt) {
      notificationId = await scheduleTaskReminder(
        id,
        '任务提醒',
        `到时间啦：${text}`,
        new Date(remindAt)
      );
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, text, remindAt, note, notificationId, reminded: false }
          : t
      )
    );
  };

  const openEditTask = (task: Task) => {
    HapticPresets.button();
    setEditTask({
      id: task.id,
      text: task.text,
      note: task.note,
      remindAt: task.remindAt,
    });
  };

  const closeEditTask = () => {
    setEditTask(null);
  };

  const formatRemindTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hour}:${minute}`;
  };

  const doneCount = tasks.filter(t => t.done).length;
  const totalCount = tasks.length;
  const percent = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const prevPercent = useRef(0);

  useEffect(() => {
    if (prevPercent.current !== percent) {
      Animated.spring(progressAnim, {
        toValue: percent,
        useNativeDriver: false,
        tension: 50,
        friction: 8,
      }).start();
      prevPercent.current = percent;
    }
  }, [percent, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

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
            <Text style={[styles.subtitle, { color: theme.tabIconDefault }]}>炸猪排的工具箱</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.iconButton, { backgroundColor: theme.card }]}
              onPress={() => {
                HapticPresets.button();
                setIsMessagesOpen(true);
              }}
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
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressWidth,
                  backgroundColor: theme.tint,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>任务</Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.tint }]}
            onPress={() => {
              HapticPresets.button();
              setIsAddTaskOpen(true);
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add" size={iconSize(20)} color="#0D0F14" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: listPaddingBottom }]}
          renderItem={({ item }) => (
            <View style={[styles.taskRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <TouchableOpacity
                onPress={() => {
                  HapticPresets.button();
                  toggleTask(item.id);
                }}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name={item.done ? 'check-box' : 'check-box-outline-blank'}
                  size={iconSize(22)}
                  color={item.done ? theme.tint : theme.tabIconDefault}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => openEditTask(item)}
                activeOpacity={0.8}
                style={styles.taskLeft}
              >
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
              <View style={styles.taskRight}>
                {item.remindAt && (
                  <View style={styles.remindTag}>
                    <MaterialIcons name="schedule" size={iconSize(14)} color={theme.tint} />
                    <Text style={[styles.remindText, { color: theme.tint }]}>
                      {formatRemindTime(item.remindAt)}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  onPress={async () => {
                    HapticPresets.delete();
                    await deleteTask(item.id);
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="delete-outline" size={iconSize(22)} color={theme.tabIconDefault} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <TouchableOpacity
              style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => {
                HapticPresets.button();
                setIsAddTaskOpen(true);
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="add-circle-outline" size={iconSize(32)} color={theme.tabIconDefault} />
              <Text style={[styles.empty, { color: theme.tabIconDefault }]}>还没有任务，点击添加</Text>
            </TouchableOpacity>
          }
        />
      </SafeAreaView>

      <AddTaskDrawer
        visible={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        scheme={scheme}
        theme={theme}
        onAddTask={addTask}
      />

      <AddTaskDrawer
        visible={!!editTask}
        onClose={closeEditTask}
        scheme={scheme}
        theme={theme}
        onAddTask={addTask}
        editTask={editTask}
        onUpdateTask={updateTask}
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
  taskRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(12),
  },
  remindTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(4),
  },
  remindText: {
    fontSize: fs(12),
    fontWeight: '600',
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
  addBtn: {
    width: spacing(36),
    height: spacing(36),
    borderRadius: borderRadius(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
