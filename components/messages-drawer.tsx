import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { fs, spacing, borderRadius, iconSize, hp } from '@/hooks/use-responsive';

type Theme = (typeof Colors)['light'];
type Scheme = keyof typeof Colors;

type Message = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  scheme: Scheme;
  theme: Theme;
  dmMessages: Message[];
  hasDmDot: boolean;
  hasNoticeDot: boolean;
  dismissAllSeq: number;
  onMarkDmDotRead: () => void;
  onMarkNoticeRead: () => void;
  onDismissDmMessage: (id: string) => void;
  onMarkAllRead: () => void;
};

const TABS = [
  { key: 'dm', title: '消息' },
  { key: 'notice', title: '官方通知' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function MessagesDrawer({
  visible,
  onClose,
  scheme,
  theme,
  dmMessages,
  hasDmDot,
  hasNoticeDot,
  dismissAllSeq,
  onMarkDmDotRead,
  onMarkNoticeRead,
  onDismissDmMessage,
  onMarkAllRead,
}: Props) {
  const { height } = useWindowDimensions();
  const drawerHeight = Math.min(hp(72), Math.max(hp(55), Math.round(height * 0.72)));

  const [rendered, setRendered] = useState(visible);
  const [activeTab, setActiveTab] = useState<TabKey>('notice');

  const message = useMemo<Message>(
    () => ({
      id: 'welcome',
      title: '官方通知',
      body: '欢迎使用炸猪排的工具箱。',
      time: '刚刚',
      unread: hasNoticeDot,
    }),
    [hasNoticeDot]
  );

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-drawerHeight)).current;

  useEffect(() => {
    translateY.setValue(-drawerHeight);
  }, [drawerHeight, translateY]);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          speed: 18,
          bounciness: 6,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -drawerHeight,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setRendered(false);
    });
  }, [drawerHeight, overlayOpacity, translateY, visible]);

  const unreadTotal = (hasDmDot ? 1 : 0) + (hasNoticeDot ? 1 : 0);

  const itemSeparator = () => <View style={{ height: spacing(10) }} />;

  const [dismissIds, setDismissIds] = useState<Record<string, true>>({});

  useEffect(() => {
    if (!dismissAllSeq) return;
    if (!dmMessages.length) return;
    const next: Record<string, true> = {};
    for (const m of dmMessages) next[m.id] = true;
    setDismissIds(next);
  }, [dismissAllSeq, dmMessages]);

  if (!rendered) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: overlayOpacity,
              backgroundColor: scheme === 'dark' ? 'rgba(0, 0, 0, 0.55)' : 'rgba(15, 18, 34, 0.30)',
            },
          ]}
        />
      </Pressable>

      <Animated.View
        style={[
          styles.drawer,
          {
            height: drawerHeight,
            backgroundColor: scheme === 'dark' ? 'rgba(23, 26, 33, 0.92)' : 'rgba(255, 255, 255, 0.92)',
            borderColor: theme.border,
            transform: [{ translateY }],
          },
        ]}
      >
        <SafeAreaView edges={['top']} style={styles.safe}>
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: scheme === 'dark' ? 'rgba(244, 246, 250, 0.16)' : 'rgba(15, 18, 34, 0.16)' }]} />
          </View>

          <View style={styles.topRow}>
            <View style={styles.topLeft}>
              <Text style={[styles.title, { color: theme.text }]}>消息</Text>
              {!!unreadTotal && (
                <View style={[styles.badge, { backgroundColor: 'rgba(255, 77, 141, 0.16)' }]}>
                  <Text style={[styles.badgeText, { color: theme.tint }]}>{unreadTotal}</Text>
                </View>
              )}
            </View>

            <View style={styles.topRight}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={async () => {
                  if (!unreadTotal) return;
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onMarkAllRead();
                }}
                style={[styles.actionBtn, { backgroundColor: theme.cardMuted }]}
              >
                <MaterialIcons name="done-all" size={iconSize(18)} color={theme.icon} />
                <Text style={[styles.actionText, { color: theme.text }]}>一键已读</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.85} onPress={onClose} style={styles.closeBtn}>
                <MaterialIcons name="close" size={iconSize(20)} color={theme.icon} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.tabs, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
            {TABS.map((t) => {
              const active = activeTab === t.key;
              const hasDot = t.key === 'dm' ? hasDmDot : hasNoticeDot;
              return (
                <TouchableOpacity
                  key={t.key}
                  activeOpacity={0.9}
                  onPress={() => setActiveTab(t.key)}
                  style={[
                    styles.tab,
                    active
                      ? {
                          backgroundColor:
                            scheme === 'dark' ? 'rgba(23, 26, 33, 0.92)' : 'rgba(255, 255, 255, 0.92)',
                        }
                      : undefined,
                  ]}
                >
                  <Text style={[styles.tabText, { color: active ? theme.text : theme.tabIconDefault }]}>
                    {t.title}
                  </Text>
                  {hasDot && <View style={[styles.dot, { backgroundColor: theme.tint }]} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>

        {activeTab === 'notice' ? (
          <FlatList
            data={[message]}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={itemSeparator}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={async () => {
                  await Haptics.selectionAsync();
                  if (item.unread) onMarkNoticeRead();
                }}
                style={[
                  styles.item,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  item.unread ? styles.itemUnread : undefined,
                ]}
              >
                <View style={[styles.itemIconWrap, { backgroundColor: theme.cardMuted }]}>
                  <MaterialIcons name="campaign" size={iconSize(20)} color={theme.tint} />
                </View>
                <View style={styles.itemBody}>
                  <View style={styles.itemTop}>
                    <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.itemTime, { color: theme.tabIconDefault }]}>{item.time}</Text>
                  </View>
                  <Text style={[styles.itemDesc, { color: theme.tabIconDefault }]} numberOfLines={2}>
                    {item.body}
                  </Text>
                </View>
                {item.unread && <View style={[styles.unreadDot, { backgroundColor: theme.tint }]} />}
              </TouchableOpacity>
            )}
          />
        ) : (
          <FlatList
            data={dmMessages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={itemSeparator}
            renderItem={({ item }) => (
              <DismissableMessageRow
                scheme={scheme}
                theme={theme}
                item={item}
                icon="chat-bubble-outline"
                dismiss={!!dismissIds[item.id]}
                onDismiss={() => onDismissDmMessage(item.id)}
                onPress={async () => {
                  await Haptics.selectionAsync();
                  onMarkDmDotRead();
                  setDismissIds((prev) => ({ ...prev, [item.id]: true }));
                }}
              />
            )}
            ListEmptyComponent={
              <Pressable
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onMarkDmDotRead();
                }}
                style={[styles.emptyPanel, { borderColor: theme.border }]}
              >
                <View style={[styles.emptyIcon, { backgroundColor: theme.cardMuted }]}>
                  <MaterialIcons name="chat-bubble-outline" size={iconSize(22)} color={theme.tabIconDefault} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>暂无消息</Text>
                <Text style={[styles.emptyDesc, { color: theme.tabIconDefault }]}>
                  添加带提醒时间的任务，到点会在这里收到提示
                </Text>
                {hasDmDot && <View style={[styles.unreadDot, { backgroundColor: theme.tint }]} />}
              </Pressable>
            }
          />
        )}
      </Animated.View>
    </View>
  );
}

function DismissableMessageRow({
  theme,
  item,
  icon,
  dismiss,
  onDismiss,
  onPress,
}: {
  theme: Theme;
  item: Message;
  icon: any;
  dismiss: boolean;
  onDismiss: () => void;
  onPress: () => void | Promise<void>;
}) {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const [isDismissing, setIsDismissing] = useState(false);

  useEffect(() => {
    if (!dismiss || isDismissing) return;
    setIsDismissing(true);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.92, duration: 180, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) onDismiss();
    });
  }, [dismiss, isDismissing, onDismiss, opacity, scale]);

  return (
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={async () => {
          await onPress();
        }}
        style={[
          styles.item,
          { backgroundColor: theme.card, borderColor: theme.border },
          item.unread ? styles.itemUnread : undefined,
        ]}
      >
        <View style={[styles.itemIconWrap, { backgroundColor: theme.cardMuted }]}>
          <MaterialIcons name={icon} size={iconSize(20)} color={theme.tint} />
        </View>
        <View style={styles.itemBody}>
          <View style={styles.itemTop}>
            <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.itemTime, { color: theme.tabIconDefault }]}>{item.time}</Text>
          </View>
          <Text style={[styles.itemDesc, { color: theme.tabIconDefault }]} numberOfLines={2}>
            {item.body}
          </Text>
        </View>
        {item.unread && <View style={[styles.unreadDot, { backgroundColor: theme.tint }]} />}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: 'absolute',
    left: spacing(12),
    right: spacing(12),
    top: spacing(12),
    borderRadius: borderRadius(26),
    borderWidth: 1,
    overflow: 'hidden',
  },
  safe: {
    paddingHorizontal: spacing(14),
    paddingBottom: spacing(12),
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: spacing(10),
    paddingBottom: spacing(8),
  },
  handle: {
    width: spacing(44),
    height: spacing(5),
    borderRadius: 999,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(12),
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(10),
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(10),
  },
  title: {
    fontSize: fs(18),
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  badge: {
    paddingHorizontal: spacing(10),
    paddingVertical: spacing(5),
    borderRadius: 999,
  },
  badgeText: {
    fontSize: fs(12),
    fontWeight: '800',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(8),
    paddingHorizontal: spacing(12),
    paddingVertical: spacing(9),
    borderRadius: 999,
  },
  actionText: {
    fontSize: fs(13),
    fontWeight: '700',
  },
  closeBtn: {
    width: spacing(38),
    height: spacing(38),
    borderRadius: borderRadius(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: borderRadius(18),
    borderWidth: 1,
    padding: spacing(4),
  },
  tab: {
    flex: 1,
    borderRadius: borderRadius(14),
    paddingVertical: spacing(10),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing(8),
  },
  tabText: {
    fontSize: fs(13),
    fontWeight: '800',
  },
  dot: {
    width: spacing(7),
    height: spacing(7),
    borderRadius: 999,
  },
  list: {
    paddingHorizontal: spacing(14),
    paddingBottom: spacing(18),
  },
  emptyPanel: {
    marginTop: spacing(6),
    borderRadius: borderRadius(22),
    borderWidth: 1,
    padding: spacing(16),
    backgroundColor: 'transparent',
    alignItems: 'flex-start',
    gap: spacing(10),
  },
  emptyIcon: {
    width: spacing(46),
    height: spacing(46),
    borderRadius: borderRadius(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: fs(16),
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  emptyDesc: {
    fontSize: fs(13),
    fontWeight: '600',
    lineHeight: 18,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(12),
    paddingVertical: spacing(12),
    borderRadius: borderRadius(18),
    borderWidth: 1,
    gap: spacing(12),
  },
  itemUnread: {
    transform: [{ scale: 1 }],
  },
  itemIconWrap: {
    width: spacing(42),
    height: spacing(42),
    borderRadius: borderRadius(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: {
    flex: 1,
    gap: spacing(4),
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(10),
  },
  itemTitle: {
    flex: 1,
    fontSize: fs(15),
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  itemTime: {
    fontSize: fs(12),
    fontWeight: '700',
  },
  itemDesc: {
    fontSize: fs(13),
    fontWeight: '600',
    lineHeight: 18,
  },
  unreadDot: {
    width: spacing(8),
    height: spacing(8),
    borderRadius: 999,
  },
});
