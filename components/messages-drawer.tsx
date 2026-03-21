import { Colors } from '@/constants/theme';
import { borderRadius, fs, hp, iconSize, spacing } from '@/hooks/use-responsive';
import { HapticPresets } from '@/utils/haptics';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BlurView } from 'expo-blur';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const [activeTab, setActiveTab] = useState<TabKey>('notice');
  const insets = useSafeAreaInsets();
  
  const DRAWER_HEIGHT_DYNAMIC = useMemo(() => {
    const baseHeight = Math.min(hp(48), Math.max(hp(42), Math.round(SCREEN_HEIGHT * 0.45)));
    return baseHeight + insets.top;
  }, [insets.top]);

  const translateY = useRef(new Animated.Value(-DRAWER_HEIGHT_DYNAMIC)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const isClosing = useRef(false);

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

  useEffect(() => {
    if (visible) {
      isClosing.current = false;
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (!isClosing.current) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -DRAWER_HEIGHT_DYNAMIC,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, overlayOpacity]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          translateY.setValue(gestureState.dy);
          const progress = Math.abs(gestureState.dy) / DRAWER_HEIGHT_DYNAMIC;
          overlayOpacity.setValue(1 - progress);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const closeThreshold = DRAWER_HEIGHT_DYNAMIC * 0.25;
        if (gestureState.dy < -closeThreshold || gestureState.vy < -0.5) {
          isClosing.current = true;
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: -DRAWER_HEIGHT_DYNAMIC,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(overlayOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onClose();
          });
        } else {
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 65,
              friction: 11,
            }),
            Animated.timing(overlayOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const handleClose = () => {
    isClosing.current = true;
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -DRAWER_HEIGHT_DYNAMIC,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

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

  const isDark = scheme === 'dark';

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <TouchableOpacity
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={handleClose}
        >
          <Animated.View
            style={[
              styles.container,
              {
                height: DRAWER_HEIGHT_DYNAMIC,
                transform: [{ translateY }],
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <BlurView
              intensity={isDark ? 80 : 100}
              tint={isDark ? 'dark' : 'light'}
              style={[
                styles.blurContainer,
                { 
                  backgroundColor: isDark ? 'rgba(13, 15, 20, 0.85)' : 'rgba(255, 255, 255, 0.92)',
                  borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.06)',
                }
              ]}
            >
              <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.contentWrapper}>
                <View style={[styles.safe, { paddingTop: insets.top }]}>
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
                        onPress={() => {
                          if (!unreadTotal) return;
                          HapticPresets.button();
                          onMarkAllRead();
                        }}
                        style={[
                          styles.actionBtn,
                          { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }
                        ]}
                      >
                        <MaterialIcons name="done-all" size={iconSize(18)} color={theme.icon} />
                        <Text style={[styles.actionText, { color: theme.text }]}>一键已读</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => {
                          HapticPresets.cancel();
                          handleClose();
                        }}
                        style={[
                          styles.closeBtn,
                          { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }
                        ]}
                      >
                        <MaterialIcons name="close" size={iconSize(20)} color={theme.icon} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.tabs,
                      { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }
                    ]}
                  >
                    {TABS.map((t) => {
                      const active = activeTab === t.key;
                      const hasDot = t.key === 'dm' ? hasDmDot : hasNoticeDot;
                      return (
                        <TouchableOpacity
                          key={t.key}
                          activeOpacity={0.9}
                          onPress={() => {
                            HapticPresets.tab();
                            setActiveTab(t.key);
                          }}
                          style={[
                            styles.tab,
                            active
                              ? {
                                  backgroundColor: isDark
                                    ? 'rgba(255, 255, 255, 0.12)'
                                    : 'rgba(255, 255, 255, 0.9)',
                                }
                              : undefined,
                          ]}
                        >
                          <Text
                            style={[
                              styles.tabText,
                              { color: active ? theme.text : theme.tabIconDefault },
                            ]}
                          >
                            {t.title}
                          </Text>
                          {hasDot && <View style={[styles.dot, { backgroundColor: theme.tint }]} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {activeTab === 'notice' ? (
                  <FlatList
                    data={[message]}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ItemSeparatorComponent={itemSeparator}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => {
                          HapticPresets.card();
                          if (item.unread) onMarkNoticeRead();
                        }}
                        style={[
                          styles.item,
                          {
                            backgroundColor: isDark
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'rgba(0, 0, 0, 0.04)',
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.itemIconWrap,
                            {
                              backgroundColor: isDark
                                ? 'rgba(255, 255, 255, 0.12)'
                                : 'rgba(0, 0, 0, 0.06)',
                            },
                          ]}
                        >
                          <MaterialIcons name="campaign" size={iconSize(20)} color={theme.tint} />
                        </View>
                        <View style={styles.itemBody}>
                          <View style={styles.itemTop}>
                            <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>
                              {item.title}
                            </Text>
                            <Text style={[styles.itemTime, { color: theme.tabIconDefault }]}>
                              {item.time}
                            </Text>
                          </View>
                          <Text style={[styles.itemDesc, { color: theme.tabIconDefault }]} numberOfLines={2}>
                            {item.body}
                          </Text>
                        </View>
                        {item.unread && (
                          <View style={[styles.unreadDot, { backgroundColor: theme.tint }]} />
                        )}
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
                        onPress={() => {
                          HapticPresets.card();
                          onMarkDmDotRead();
                          setDismissIds((prev) => ({ ...prev, [item.id]: true }));
                        }}
                      />
                    )}
                    ListEmptyComponent={
                      <Pressable
                        onPress={() => {
                          HapticPresets.button();
                          onMarkDmDotRead();
                        }}
                        style={[
                          styles.emptyPanel,
                          {
                            backgroundColor: isDark
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'rgba(0, 0, 0, 0.04)',
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.emptyIcon,
                            {
                              backgroundColor: isDark
                                ? 'rgba(255, 255, 255, 0.12)'
                                : 'rgba(0, 0, 0, 0.06)',
                            },
                          ]}
                        >
                          <MaterialIcons
                            name="chat-bubble-outline"
                            size={iconSize(22)}
                            color={theme.tabIconDefault}
                          />
                        </View>
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>暂无消息</Text>
                        <Text style={[styles.emptyDesc, { color: theme.tabIconDefault }]}>
                          添加带提醒时间的任务，到点会在这里收到提示
                        </Text>
                        {hasDmDot && (
                          <View style={[styles.unreadDot, { backgroundColor: theme.tint }]} />
                        )}
                      </Pressable>
                    }
                  />
                )}

                <View style={styles.bottomHandleContainer} {...panResponder.panHandlers}>
                  <View style={[styles.handle, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(42, 37, 32, 0.25)' }]} />
                </View>
              </TouchableOpacity>
            </BlurView>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

function DismissableMessageRow({
  scheme,
  theme,
  item,
  icon,
  dismiss,
  onDismiss,
  onPress,
}: {
  scheme: Scheme;
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

  const isDark = scheme === 'dark';

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
        onPress={() => {
          onPress();
        }}
        style={[
          styles.item,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          },
        ]}
      >
        <View
          style={[
            styles.itemIconWrap,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  overlayTouch: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: borderRadius(32),
    borderBottomRightRadius: borderRadius(32),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 24,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  blurContainer: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  contentWrapper: {
    flex: 1,
  },
  safe: {
    paddingHorizontal: spacing(20),
    paddingBottom: spacing(12),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(14),
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
    fontSize: fs(22),
    fontWeight: '700',
    letterSpacing: 0.3,
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
    paddingHorizontal: spacing(14),
    paddingVertical: spacing(10),
    borderRadius: borderRadius(18),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {},
    }),
  },
  actionText: {
    fontSize: fs(13),
    fontWeight: '700',
  },
  closeBtn: {
    width: spacing(40),
    height: spacing(40),
    borderRadius: borderRadius(18),
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {},
    }),
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: borderRadius(20),
    padding: spacing(4),
  },
  tab: {
    flex: 1,
    borderRadius: borderRadius(16),
    paddingVertical: spacing(12),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing(8),
  },
  tabText: {
    fontSize: fs(14),
    fontWeight: '700',
  },
  dot: {
    width: spacing(7),
    height: spacing(7),
    borderRadius: 999,
  },
  list: {
    paddingHorizontal: spacing(20),
    paddingBottom: spacing(16),
  },
  emptyPanel: {
    marginTop: spacing(6),
    borderRadius: borderRadius(22),
    padding: spacing(20),
    alignItems: 'flex-start',
    gap: spacing(12),
  },
  emptyIcon: {
    width: spacing(48),
    height: spacing(48),
    borderRadius: borderRadius(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: fs(17),
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  emptyDesc: {
    fontSize: fs(14),
    fontWeight: '600',
    lineHeight: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(14),
    paddingVertical: spacing(14),
    borderRadius: borderRadius(20),
    gap: spacing(14),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {},
    }),
  },
  itemIconWrap: {
    width: spacing(44),
    height: spacing(44),
    borderRadius: borderRadius(18),
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
    fontSize: fs(16),
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  itemTime: {
    fontSize: fs(12),
    fontWeight: '600',
  },
  itemDesc: {
    fontSize: fs(14),
    fontWeight: '600',
    lineHeight: 20,
  },
  unreadDot: {
    width: spacing(8),
    height: spacing(8),
    borderRadius: 999,
  },
  bottomHandleContainer: {
    paddingTop: spacing(8),
    paddingBottom: Platform.OS === 'ios' ? spacing(28) : spacing(18),
    alignItems: 'center',
  },
  handle: {
    width: spacing(40),
    height: spacing(5),
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
});
