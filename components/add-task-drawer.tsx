import { Colors } from '@/constants/theme';
import { borderRadius, fs, iconSize, normalize, spacing, wp } from '@/hooks/use-responsive';
import { HapticPresets } from '@/utils/haptics';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BlurView } from 'expo-blur';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Keyboard,
    Modal,
    NativeScrollEvent,
    NativeSyntheticEvent,
    PanResponder,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.67;
const CLOSE_THRESHOLD = DRAWER_HEIGHT * 0.25;
const ITEM_HEIGHT = 36;

type Theme = (typeof Colors)['light'];
type Scheme = keyof typeof Colors;

export type EditTaskData = {
  id: string;
  text: string;
  note?: string;
  remindAt?: number | null;
} | null;

interface AddTaskDrawerProps {
  visible: boolean;
  onClose: () => void;
  scheme: Scheme;
  theme: Theme;
  onAddTask: (task: string, remindAt: number | null, note: string) => void;
  editTask?: EditTaskData;
  onUpdateTask?: (id: string, task: string, remindAt: number | null, note: string) => void;
}

function WheelPicker({
  items,
  selectedValue,
  onSelect,
  theme,
  isDark,
}: {
  items: number[];
  selectedValue: number;
  onSelect: (value: number) => void;
  theme: Theme;
  isDark: boolean;
}) {
  const scrollViewRef = useRef<ScrollView>(null);
  const selectedIndex = items.indexOf(selectedValue);
  const lastSelectedIndex = useRef(selectedIndex);

  useEffect(() => {
    if (scrollViewRef.current && selectedIndex >= 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: selectedIndex * ITEM_HEIGHT,
          animated: false,
        });
      }, 50);
    }
  }, []);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      
      if (index >= 0 && index < items.length && index !== lastSelectedIndex.current) {
        lastSelectedIndex.current = index;
        onSelect(items[index]);
        HapticPresets.wheel();
      }
    },
    [items, onSelect]
  );

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      
      if (index >= 0 && index < items.length) {
        scrollViewRef.current?.scrollTo({
          y: index * ITEM_HEIGHT,
          animated: true,
        });
        
        if (index !== lastSelectedIndex.current) {
          lastSelectedIndex.current = index;
          onSelect(items[index]);
          HapticPresets.wheel();
        }
      }
    },
    [items, onSelect]
  );

  const scrollToIndex = useCallback((index: number) => {
    if (index >= 0 && index < items.length) {
      scrollViewRef.current?.scrollTo({
        y: index * ITEM_HEIGHT,
        animated: true,
      });
      
      if (index !== lastSelectedIndex.current) {
        lastSelectedIndex.current = index;
        onSelect(items[index]);
        HapticPresets.wheel();
      }
    }
  }, [items, onSelect]);

  return (
    <View style={styles.wheelContainer}>
      <View style={[styles.selectionIndicator, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)' }]} />
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="center"
        decelerationRate="fast"
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        scrollEventThrottle={16}
        contentContainerStyle={styles.wheelScrollContent}
        bounces={false}
        overScrollMode="never"
      >
        <View style={{ height: ITEM_HEIGHT }} />
        {items.map((item, index) => {
          const isSelected = item === selectedValue;
          return (
            <TouchableOpacity
              key={item}
              style={[styles.wheelItem, { height: ITEM_HEIGHT }]}
              onPress={() => scrollToIndex(index)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.wheelItemText,
                  {
                    color: isSelected ? theme.text : theme.tabIconDefault,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}
              >
                {String(item).padStart(2, '0')}
              </Text>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: ITEM_HEIGHT }} />
      </ScrollView>
    </View>
  );
}

export function AddTaskDrawer({ visible, onClose, scheme, theme, onAddTask, editTask, onUpdateTask }: AddTaskDrawerProps) {
  const [task, setTask] = useState('');
  const [note, setNote] = useState('');
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const translateY = useRef(new Animated.Value(DRAWER_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const isClosing = useRef(false);

  const isEditMode = !!editTask;

  useEffect(() => {
    if (visible && editTask) {
      setTask(editTask.text);
      setNote(editTask.note || '');
      setSelectedTime(editTask.remindAt || null);
    }
  }, [visible, editTask]);

  useEffect(() => {
    if (visible) {
      isClosing.current = false;
      Keyboard.dismiss();
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
          toValue: DRAWER_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTask('');
        setNote('');
        setSelectedTime(null);
      });
    }
  }, [visible, translateY, overlayOpacity]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 0;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
          const progress = gestureState.dy / DRAWER_HEIGHT;
          overlayOpacity.setValue(1 - progress);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > CLOSE_THRESHOLD || gestureState.vy > 0.5) {
          isClosing.current = true;
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: DRAWER_HEIGHT,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(overlayOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setTask('');
            setNote('');
            setSelectedTime(null);
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

  const openTimePicker = () => {
    HapticPresets.button();
    setShowTimePicker(true);
  };

  const closeTimePicker = () => {
    HapticPresets.cancel();
    setShowTimePicker(false);
  };

  const handleClose = () => {
    HapticPresets.cancel();
    isClosing.current = true;
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: DRAWER_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTask('');
      setNote('');
      setSelectedTime(null);
      onClose();
    });
  };

  const handleAddTask = () => {
    if (task.trim() === '') return;
    HapticPresets.success();
    if (isEditMode && editTask && onUpdateTask) {
      onUpdateTask(editTask.id, task, selectedTime, note);
    } else {
      onAddTask(task, selectedTime, note);
    }
    handleClose();
  };

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return '无';
    const date = new Date(timestamp);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hour}:${minute}`;
  };

  const isDark = scheme === 'dark';

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
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
                height: DRAWER_HEIGHT,
                transform: [{ translateY }],
              },
            ]}
          >
          <BlurView
            intensity={isDark ? 40 : 80}
            tint={isDark ? 'dark' : 'light'}
            style={styles.blurContainer}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <View style={styles.handleContainer} {...panResponder.panHandlers}>
                <View style={styles.handle} />
              </View>

              <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>{isEditMode ? '编辑任务' : '新建任务'}</Text>
              </View>

              <View style={styles.content}>
                <View style={styles.inputGroup}>
                  <TextInput
                    style={[
                      styles.taskInput,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                        color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.55)',
                      }
                    ]}
                    placeholder="添加新任务..."
                    placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)'}
                    value={task}
                    onChangeText={setTask}
                    maxLength={100}
                    returnKeyType="done"
                    onSubmitEditing={handleAddTask}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <TextInput
                    style={[
                      styles.noteInput,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                        color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.55)',
                      }
                    ]}
                    placeholder="添加备注（可选）"
                    placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)'}
                    value={note}
                    onChangeText={setNote}
                    multiline
                    numberOfLines={3}
                    maxLength={200}
                  />
                </View>

                <View style={styles.remindRow}>
                  <Text style={[styles.label, { color: theme.tabIconDefault }]}>提醒时间</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={openTimePicker}
                    style={[
                      styles.remindButton,
                      { 
                        backgroundColor: selectedTime
                          ? theme.tint
                          : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                      }
                    ]}
                  >
                    <MaterialIcons 
                      name="schedule" 
                      size={iconSize(18)} 
                      color={selectedTime ? '#0D0F14' : theme.tabIconDefault} 
                    />
                    <Text style={[styles.remindText, { color: selectedTime ? '#0D0F14' : theme.tabIconDefault }]}>
                      {formatTime(selectedTime)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.footer}>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }
                  ]}
                  onPress={handleClose}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.tabIconDefault }]}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    { 
                      backgroundColor: task.trim() ? theme.tint : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                      opacity: task.trim() ? 1 : 0.6
                    }
                  ]}
                  onPress={handleAddTask}
                  activeOpacity={0.8}
                  disabled={task.trim() === ''}
                >
                  <Text style={[styles.addButtonText, { color: task.trim() ? '#0D0F14' : theme.tabIconDefault }]}>添加</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>

        {showTimePicker && (
          <TouchableOpacity
            style={styles.timePickerOverlay}
            activeOpacity={1}
            onPress={closeTimePicker}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <BlurView
                intensity={isDark ? 40 : 80}
                tint={isDark ? 'dark' : 'light'}
                style={styles.timePickerBlur}
              >
                <View style={styles.timePickerContainer}>
                  <View style={styles.timePickerHeader}>
                    <Text style={[styles.timePickerTitle, { color: theme.text }]}>设置提醒时间</Text>
                    <TouchableOpacity onPress={closeTimePicker} style={styles.closeButton}>
                      <MaterialIcons name="close" size={iconSize(22)} color={theme.icon} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.timePickerRow}>
                    <View style={[styles.timePickerBox, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }]}>
                      <Text style={[styles.timePickerBoxLabel, { color: theme.text }]}>月</Text>
                      <WheelPicker
                        items={Array.from({ length: 12 }, (_, i) => i + 1)}
                        selectedValue={selectedTime ? new Date(selectedTime).getMonth() + 1 : new Date().getMonth() + 1}
                        onSelect={(month) => {
                          const newTime = selectedTime ? new Date(selectedTime) : new Date();
                          newTime.setMonth(month - 1);
                          setSelectedTime(newTime.getTime());
                        }}
                        theme={theme}
                        isDark={isDark}
                      />
                    </View>
                    <View style={[styles.timePickerBox, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }]}>
                      <Text style={[styles.timePickerBoxLabel, { color: theme.text }]}>日</Text>
                      <WheelPicker
                        items={Array.from({ length: 31 }, (_, i) => i + 1)}
                        selectedValue={selectedTime ? new Date(selectedTime).getDate() : new Date().getDate()}
                        onSelect={(day) => {
                          const newTime = selectedTime ? new Date(selectedTime) : new Date();
                          newTime.setDate(day);
                          setSelectedTime(newTime.getTime());
                        }}
                        theme={theme}
                        isDark={isDark}
                      />
                    </View>
                    <View style={[styles.timePickerBox, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }]}>
                      <Text style={[styles.timePickerBoxLabel, { color: theme.text }]}>时</Text>
                      <WheelPicker
                        items={Array.from({ length: 24 }, (_, i) => i)}
                        selectedValue={selectedTime ? new Date(selectedTime).getHours() : new Date().getHours()}
                        onSelect={(hour) => {
                          const newTime = selectedTime ? new Date(selectedTime) : new Date();
                          newTime.setHours(hour);
                          setSelectedTime(newTime.getTime());
                        }}
                        theme={theme}
                        isDark={isDark}
                      />
                    </View>
                    <View style={[styles.timePickerBox, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }]}>
                      <Text style={[styles.timePickerBoxLabel, { color: theme.text }]}>分</Text>
                      <WheelPicker
                        items={Array.from({ length: 60 }, (_, i) => i)}
                        selectedValue={selectedTime ? new Date(selectedTime).getMinutes() : new Date().getMinutes()}
                        onSelect={(minute) => {
                          const newTime = selectedTime ? new Date(selectedTime) : new Date();
                          newTime.setMinutes(minute);
                          setSelectedTime(newTime.getTime());
                        }}
                        theme={theme}
                        isDark={isDark}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.timePickerConfirm, { backgroundColor: theme.tint }]}
                    onPress={closeTimePicker}
                  >
                    <Text style={styles.timePickerConfirmText}>确认</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
          </TouchableOpacity>
        </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  overlayTouch: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: borderRadius(32),
    borderTopRightRadius: borderRadius(32),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  blurContainer: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  handleContainer: {
    paddingTop: spacing(12),
    paddingBottom: spacing(8),
    alignItems: 'center',
  },
  handle: {
    width: spacing(40),
    height: spacing(5),
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  closeButton: {
    padding: spacing(6),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(20),
    paddingVertical: spacing(14),
  },
  headerTitle: {
    fontSize: fs(22),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing(20),
    gap: spacing(18),
  },
  inputGroup: {
    gap: spacing(8),
  },
  label: {
    fontSize: fs(13),
    fontWeight: '600',
    marginLeft: spacing(4),
  },
  taskInput: {
    fontSize: fs(17),
    fontWeight: '500',
    padding: spacing(18),
    borderRadius: borderRadius(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  noteInput: {
    fontSize: fs(16),
    fontWeight: '500',
    padding: spacing(18),
    borderRadius: borderRadius(20),
    minHeight: spacing(100),
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  remindRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  remindButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(10),
    paddingHorizontal: spacing(18),
    paddingVertical: spacing(14),
    borderRadius: borderRadius(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  remindText: {
    fontSize: fs(15),
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing(14),
    paddingHorizontal: spacing(20),
    paddingVertical: spacing(18),
    paddingBottom: Platform.OS === 'ios' ? spacing(34) : spacing(24),
  },
  cancelButton: {
    flex: 1,
    height: normalize(72),
    borderRadius: borderRadius(20),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 10,
  },
  cancelButtonText: {
    fontSize: fs(17),
    fontWeight: '600',
  },
  addButton: {
    flex: 2,
    height: normalize(72),
    borderRadius: borderRadius(20),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 14,
  },
  addButtonText: {
    fontSize: fs(17),
    fontWeight: '700',
    color: '#0D0F14',
  },
  timePickerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerBlur: {
    width: wp(88),
    borderRadius: borderRadius(28),
    overflow: 'hidden',
  },
  timePickerContainer: {
    padding: spacing(14),
  },
  timePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(14),
  },
  timePickerTitle: {
    fontSize: fs(16),
    fontWeight: '700',
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing(14),
    gap: spacing(4),
  },
  timePickerBox: {
    flex: 1,
    alignItems: 'center',
    borderRadius: borderRadius(12),
    paddingVertical: spacing(6),
    paddingHorizontal: spacing(2),
  },
  timePickerBoxLabel: {
    fontSize: fs(11),
    fontWeight: '600',
    marginBottom: spacing(4),
  },
  wheelContainer: {
    height: ITEM_HEIGHT * 3,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  selectionIndicator: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderRadius: borderRadius(8),
  },
  wheelScrollContent: {
    paddingHorizontal: spacing(2),
  },
  wheelItem: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  wheelItemText: {
    fontSize: fs(15),
  },
  timePickerConfirm: {
    alignSelf: 'center',
    paddingHorizontal: spacing(48),
    height: spacing(40),
    borderRadius: borderRadius(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerConfirmText: {
    fontSize: fs(15),
    fontWeight: '700',
    color: '#0D0F14',
  },
});
