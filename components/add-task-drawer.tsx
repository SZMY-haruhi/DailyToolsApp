import { Colors } from '@/constants/theme';
import { borderRadius, fs, iconSize, spacing, wp } from '@/hooks/use-responsive';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BlurView } from 'expo-blur';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Keyboard,
    Modal,
    PanResponder,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.67;
const CLOSE_THRESHOLD = DRAWER_HEIGHT * 0.25;

type Theme = (typeof Colors)['light'];
type Scheme = keyof typeof Colors;

interface AddTaskDrawerProps {
  visible: boolean;
  onClose: () => void;
  scheme: Scheme;
  theme: Theme;
  onAddTask: (task: string, remindAt: number | null, note: string) => void;
}

export function AddTaskDrawer({ visible, onClose, scheme, theme, onAddTask }: AddTaskDrawerProps) {
  const [task, setTask] = useState('');
  const [note, setNote] = useState('');
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const translateY = useRef(new Animated.Value(DRAWER_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const isClosing = useRef(false);

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
    setShowTimePicker(true);
  };

  const closeTimePicker = () => {
    setShowTimePicker(false);
  };

  const handleClose = () => {
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
    onAddTask(task, selectedTime, note);
    handleClose();
  };

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return '无';
    const date = new Date(timestamp);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
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
                <Text style={[styles.headerTitle, { color: theme.text }]}>新建任务</Text>
              </View>

              <View style={styles.content}>
                <View style={styles.inputGroup}>
                  <TextInput
                    style={[
                      styles.taskInput,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                        color: theme.text,
                      }
                    ]}
                    placeholder="添加新任务..."
                    placeholderTextColor={theme.tabIconDefault}
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
                        color: theme.text,
                      }
                    ]}
                    placeholder="添加备注（可选）"
                    placeholderTextColor={theme.tabIconDefault}
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
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)' }
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
                      backgroundColor: task.trim() ? theme.tint : isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
                      opacity: task.trim() ? 1 : 0.6
                    }
                  ]}
                  onPress={handleAddTask}
                  activeOpacity={0.8}
                  disabled={task.trim() === ''}
                >
                  <Text style={styles.addButtonText}>添加</Text>
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
                  <View style={styles.timePickerContent}>
                    <View style={[styles.timePickerBox, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }]}>
                      <Text style={[styles.timePickerBoxLabel, { color: theme.text }]}>小时</Text>
                      <View style={styles.demoTimePicker}>
                        {Array.from({ length: 5 }, (_, i) => {
                          const baseHour = selectedTime ? new Date(selectedTime).getHours() : 9;
                          const hour = (baseHour - 2 + i + 24) % 24;
                          const isSelected = selectedTime && new Date(selectedTime).getHours() === hour;
                          return (
                            <TouchableOpacity
                              key={`hour-${hour}`}
                              style={[
                                styles.demoTimePickerItem,
                                isSelected && { backgroundColor: theme.tint },
                              ]}
                              onPress={() => {
                                const newTime = selectedTime ? new Date(selectedTime) : new Date();
                                newTime.setHours(hour, selectedTime ? new Date(selectedTime).getMinutes() : 0);
                                setSelectedTime(newTime.getTime());
                              }}
                            >
                              <Text
                                style={[
                                  styles.demoTimePickerItemText,
                                  isSelected && styles.demoTimePickerItemTextSelected,
                                  { color: isSelected ? '#0D0F14' : theme.text },
                                ]}
                              >
                                {String(hour).padStart(2, '0')}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                    <View style={[styles.timePickerBox, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }]}>
                      <Text style={[styles.timePickerBoxLabel, { color: theme.text }]}>分钟</Text>
                      <View style={styles.demoTimePicker}>
                        {Array.from({ length: 5 }, (_, i) => {
                          const baseMinute = selectedTime ? new Date(selectedTime).getMinutes() : 41;
                          const minute = (baseMinute - 10 + i * 5 + 60) % 60;
                          const isSelected = selectedTime && new Date(selectedTime).getMinutes() === minute;
                          return (
                            <TouchableOpacity
                              key={`minute-${minute}`}
                              style={[
                                styles.demoTimePickerItem,
                                isSelected && { backgroundColor: theme.tint },
                              ]}
                              onPress={() => {
                                const newTime = selectedTime ? new Date(selectedTime) : new Date();
                                newTime.setHours(selectedTime ? new Date(selectedTime).getHours() : 0, minute);
                                setSelectedTime(newTime.getTime());
                              }}
                            >
                              <Text
                                style={[
                                  styles.demoTimePickerItemText,
                                  isSelected && styles.demoTimePickerItemTextSelected,
                                  { color: isSelected ? '#0D0F14' : theme.text },
                                ]}
                              >
                                {String(minute).padStart(2, '0')}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
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

const styles = {
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
  },
  blurContainer: {
    flex: 1,
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
    borderRadius: borderRadius(18),
  },
  noteInput: {
    fontSize: fs(16),
    fontWeight: '500',
    padding: spacing(18),
    borderRadius: borderRadius(18),
    minHeight: spacing(100),
    textAlignVertical: 'top',
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
    borderRadius: borderRadius(16),
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
    height: spacing(52),
    borderRadius: borderRadius(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: fs(17),
    fontWeight: '600',
  },
  addButton: {
    flex: 2,
    height: spacing(52),
    borderRadius: borderRadius(16),
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: spacing(22),
  },
  timePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(24),
  },
  timePickerTitle: {
    fontSize: fs(19),
    fontWeight: '700',
  },
  timePickerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing(24),
  },
  timePickerBox: {
    flex: 1,
    alignItems: 'center',
    borderRadius: borderRadius(20),
    padding: spacing(16),
    marginHorizontal: spacing(4),
  },
  timePickerBoxLabel: {
    fontSize: fs(14),
    fontWeight: '600',
    marginBottom: spacing(12),
  },
  demoTimePicker: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoTimePickerItem: {
    paddingVertical: spacing(12),
    paddingHorizontal: spacing(22),
    borderRadius: borderRadius(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoTimePickerItemText: {
    fontSize: fs(17),
    fontWeight: '500',
  },
  demoTimePickerItemTextSelected: {
    color: '#0D0F14',
    fontWeight: '700',
  },
  timePickerConfirm: {
    width: '100%',
    height: spacing(52),
    borderRadius: borderRadius(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerConfirmText: {
    fontSize: fs(17),
    fontWeight: '700',
    color: '#0D0F14',
  },
};
