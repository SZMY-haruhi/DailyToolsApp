import { Colors } from '@/constants/theme';
import { borderRadius, fs, iconSize, spacing } from '@/hooks/use-responsive';
import { HapticPresets } from '@/utils/haptics';
import { AppSettings, defaultSettings, loadSettings, updateSetting } from '@/utils/settings-storage';
import { checkForUpdate, VersionInfo } from '@/utils/version-check';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BlurView } from 'expo-blur';
import Constants from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Linking,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.6;
const CLOSE_THRESHOLD = DRAWER_HEIGHT * 0.25;

type Theme = (typeof Colors)['light'];
type Scheme = 'light' | 'dark' | 'system';
type ResolvedScheme = 'light' | 'dark';

type SettingsType = 'settings' | 'theme' | 'about' | null;

interface SettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
  scheme: Scheme;
  resolvedScheme: ResolvedScheme;
  theme: Theme;
  settingsType: SettingsType;
  onThemeChange: (scheme: Scheme) => void;
  onSettingsTypeChange: (type: SettingsType) => void;
}

const SETTINGS_INFO = {
  settings: { title: '设置', icon: 'settings' as const },
  theme: { title: '外观', icon: 'palette' as const },
  about: { title: '关于', icon: 'info-outline' as const },
};

export function SettingsDrawer({
  visible,
  onClose,
  scheme,
  resolvedScheme,
  theme,
  settingsType,
  onThemeChange,
  onSettingsTypeChange,
}: SettingsDrawerProps) {
  const translateY = useRef(new Animated.Value(DRAWER_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const isClosing = useRef(false);
  const buttonPosition = useRef<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 });
  const [tempTheme, setTempTheme] = useState<Scheme>(scheme);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showNoUpdate, setShowNoUpdate] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultSettings);
  const [showTabPicker, setShowTabPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setTempTheme(scheme);
      loadSettings().then(setAppSettings);
    }
  }, [visible, scheme]);

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
          toValue: DRAWER_HEIGHT,
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
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 0,
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
          ]).start(() => onClose());
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
    ]).start(() => onClose());
  };

  const handleThemeSelect = (newScheme: Scheme) => {
    HapticPresets.button();
    setTempTheme(newScheme);
    onThemeChange(newScheme);
  };

  const handleCheckUpdate = async () => {
    HapticPresets.button();
    setCheckingUpdate(true);
    const info = await checkForUpdate();
    setCheckingUpdate(false);
    setVersionInfo(info);
    if (info.hasUpdate) {
      setShowUpdateModal(true);
    } else {
      setShowNoUpdate(true);
    }
  };

  const isDark = resolvedScheme === 'dark';

  if (!visible || !settingsType) return null;

  const settingInfo = SETTINGS_INFO[settingsType];

  const renderContent = () => {
    switch (settingsType) {
      case 'settings':
        return (
          <View style={styles.section}>
            <Text style={[styles.sectionDesc, { color: theme.tabIconDefault }]}>
              自定义应用行为和偏好设置
            </Text>
            <View style={[styles.settingItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }]}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="notifications" size={iconSize(22)} color={theme.tint} />
                <View style={styles.settingTextWrap}>
                  <Text style={[styles.settingText, { color: theme.text }]}>任务提醒</Text>
                  <Text style={[styles.settingSubtext, { color: theme.tabIconDefault }]}>接收任务到期通知</Text>
                </View>
              </View>
              <Switch
                value={appSettings.notificationsEnabled}
                onValueChange={async (value) => {
                  HapticPresets.button();
                  await updateSetting('notificationsEnabled', value);
                  setAppSettings(prev => ({ ...prev, notificationsEnabled: value }));
                }}
                trackColor={{ false: '#767577', true: theme.tint }}
                thumbColor="#f4f3f4"
              />
            </View>
            <View style={[styles.settingItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }]}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="home" size={iconSize(22)} color={theme.tint} />
                <View style={styles.settingTextWrap}>
                  <Text style={[styles.settingText, { color: theme.text }]}>启动页面</Text>
                  <Text style={[styles.settingSubtext, { color: theme.tabIconDefault }]}>打开应用时显示的页面</Text>
                </View>
              </View>
              <View style={styles.tabSelectorWrap}>
                <TouchableOpacity
                  ref={(ref) => {
                    if (ref) {
                      (ref as any).measureInWindow((x: number, y: number, width: number, height: number) => {
                        buttonPosition.current = { x, y, width, height };
                      });
                    }
                  }}
                  style={[styles.tabSelector, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)' }]}
                  onPress={() => {
                    HapticPresets.button();
                    setShowTabPicker(!showTabPicker);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabSelectorText, { color: theme.text }]}>
                    {appSettings.defaultTab === 'index' ? '待办' : appSettings.defaultTab === 'explore' ? '发现' : '我的'}
                  </Text>
                </TouchableOpacity>
                {showTabPicker && (
                  <Modal transparent visible={showTabPicker} animationType="none" onRequestClose={() => setShowTabPicker(false)}>
                    <Pressable style={styles.tabPickerBackdrop} onPress={() => setShowTabPicker(false)}>
                      <View
                        style={[
                          styles.tabPickerDropdown,
                          {
                            backgroundColor: isDark ? 'rgba(23, 26, 33, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                            position: 'absolute',
                            top: buttonPosition.current?.y,
                            right: (Dimensions.get('window').width - (buttonPosition.current?.x || 0)) + 8,
                          },
                        ]}
                      >
                        {[
                          { key: 'index', label: '待办' },
                          { key: 'explore', label: '发现' },
                          { key: 'profile', label: '我的' },
                        ].map((tab) => (
                          <TouchableOpacity
                            key={tab.key}
                            style={[
                              styles.tabPickerOption,
                              appSettings.defaultTab === tab.key && { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)' },
                            ]}
                            onPress={async () => {
                              HapticPresets.button();
                              await updateSetting('defaultTab', tab.key as AppSettings['defaultTab']);
                              setAppSettings(prev => ({ ...prev, defaultTab: tab.key as AppSettings['defaultTab'] }));
                              setShowTabPicker(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.tabPickerOptionText, { color: theme.text }]}>{tab.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </Pressable>
                  </Modal>
                )}
              </View>
            </View>
          </View>
        );

      case 'theme':
        return (
          <View style={styles.section}>
            <Text style={[styles.sectionDesc, { color: theme.tabIconDefault }]}>
              选择应用的主题外观风格
            </Text>
            {(['light', 'dark', 'system'] as Scheme[]).map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.themeItem,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' },
                  tempTheme === s && { borderColor: theme.tint, borderWidth: 2 },
                ]}
                onPress={() => handleThemeSelect(s)}
                activeOpacity={0.8}
              >
                <View style={styles.themeLeft}>
                  <MaterialIcons
                    name={s === 'light' ? 'light-mode' : s === 'dark' ? 'dark-mode' : 'brightness-auto'}
                    size={iconSize(24)}
                    color={theme.text}
                  />
                  <Text style={[styles.themeText, { color: theme.text }]}>
                    {s === 'light' ? '浅色模式' : s === 'dark' ? '深色模式' : '跟随系统'}
                  </Text>
                </View>
                {tempTheme === s && (
                  <MaterialIcons name="check-circle" size={iconSize(22)} color={theme.tint} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'about':
        return (
          <View style={styles.section}>
            <Text style={[styles.sectionDesc, { color: theme.tabIconDefault }]}>
              应用信息与开发者相关
            </Text>
            <View style={[styles.aboutCard, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }]}>
              <MaterialIcons name="apps" size={iconSize(36)} color={theme.tint} />
              <Text style={[styles.appName, { color: theme.text }]}>炸猪排的工具箱</Text>
              <Text style={[styles.version, { color: theme.tabIconDefault }]}>
                版本 {Constants.expoConfig?.version || '1.0.0'}
              </Text>
            </View>
            <View style={[styles.infoItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }]}>
              <Text style={[styles.infoLabel, { color: theme.tabIconDefault }]}>开发者</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>SZMY-haruhi</Text>
            </View>
            <TouchableOpacity
              style={[styles.linkItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }]}
              onPress={() => {
                HapticPresets.button();
                Linking.openURL('https://github.com/SZMY-haruhi/DailyToolsApp');
              }}
              activeOpacity={0.8}
            >
              <View style={styles.linkLeft}>
                <MaterialIcons name="code" size={iconSize(18)} color={theme.tint} />
                <Text style={[styles.linkText, { color: theme.text }]}>GitHub 仓库</Text>
              </View>
              <MaterialIcons name="open-in-new" size={iconSize(16)} color={theme.tabIconDefault} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.linkItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }]}
              onPress={handleCheckUpdate}
              disabled={checkingUpdate}
              activeOpacity={0.8}
            >
              <View style={styles.linkLeft}>
                <MaterialIcons name="system-update" size={iconSize(18)} color={theme.tint} />
                <Text style={[styles.linkText, { color: theme.text }]}>
                  {checkingUpdate ? '检查中...' : '检查更新'}
                </Text>
              </View>
              {checkingUpdate ? (
                <ActivityIndicator size="small" color={theme.tint} />
              ) : (
                <MaterialIcons name="chevron-right" size={iconSize(16)} color={theme.tabIconDefault} />
              )}
            </TouchableOpacity>
            <View style={[styles.infoItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }]}>
              <Text style={[styles.infoLabel, { color: theme.tabIconDefault }]}>技术栈</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>React Native + Expo</Text>
            </View>
            <View style={[styles.infoItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }]}>
              <Text style={[styles.infoLabel, { color: theme.tabIconDefault }]}>开源协议</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>MIT License</Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose} statusBarTranslucent={Platform.OS === 'android'}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <TouchableOpacity style={styles.overlayTouch} activeOpacity={1} onPress={handleClose}>
          <Animated.View
            style={[
              styles.container,
              {
                height: DRAWER_HEIGHT,
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
                  borderTopColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.06)',
                }
              ]}
            >
              <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ flex: 1 }}>
                <View style={styles.handleContainer} {...panResponder.panHandlers}>
                  <View style={[styles.handle, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(42, 37, 32, 0.25)' }]} />
                </View>

                <View style={styles.header}>
                  <MaterialIcons name={settingInfo.icon} size={iconSize(24)} color={theme.tint} />
                  <Text style={[styles.headerTitle, { color: theme.text }]}>{settingInfo.title}</Text>
                  <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                    <MaterialIcons name="close" size={iconSize(22)} color={theme.icon} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.content}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {renderContent()}
                </ScrollView>
              </TouchableOpacity>
            </BlurView>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      <Modal visible={showUpdateModal} transparent animationType="fade" onRequestClose={() => setShowUpdateModal(false)}>
        <View style={styles.updateOverlay}>
          <View style={[styles.updateModal, { backgroundColor: theme.card }]}>
            <View style={[styles.updateAccent, { backgroundColor: theme.tint }]} />
            <View style={styles.updateContent}>
              <View style={[styles.updateIconWrap, { backgroundColor: isDark ? 'rgba(255, 77, 141, 0.15)' : 'rgba(230, 69, 122, 0.1)' }]}>
                <MaterialIcons name="arrow-upward" size={iconSize(28)} color={theme.tint} />
              </View>
              <Text style={[styles.updateTitle, { color: theme.text }]}>发现新版本</Text>
              <Text style={[styles.updateVersion, { color: theme.tabIconDefault }]}>
                v{versionInfo?.latestVersion} 已发布
              </Text>
              <View style={styles.updateButtons}>
                <TouchableOpacity
                  style={[styles.updateBtn, styles.updateBtnLater, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}
                  onPress={() => setShowUpdateModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.updateBtnText, { color: theme.tabIconDefault }]}>稍后再说</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.updateBtn, styles.updateBtnNow, { backgroundColor: theme.tint }]}
                  onPress={() => {
                    setShowUpdateModal(false);
                    if (versionInfo?.releaseUrl) {
                      Linking.openURL(versionInfo.releaseUrl);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.updateBtnText, { color: '#FFF' }]}>立即更新</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showNoUpdate} transparent animationType="fade" onRequestClose={() => setShowNoUpdate(false)}>
        <View style={styles.updateOverlay}>
          <View style={[styles.updateModal, { backgroundColor: theme.card }]}>
            <View style={[styles.updateAccent, { backgroundColor: '#4CAF50' }]} />
            <View style={styles.updateContent}>
              <View style={[styles.updateIconWrap, { backgroundColor: isDark ? 'rgba(76, 175, 80, 0.15)' : 'rgba(76, 175, 80, 0.1)' }]}>
                <MaterialIcons name="check" size={iconSize(28)} color="#4CAF50" />
              </View>
              <Text style={[styles.updateTitle, { color: theme.text }]}>已是最新版本</Text>
              <Text style={[styles.updateVersion, { color: theme.tabIconDefault }]}>
                当前版本 v{versionInfo?.currentVersion}
              </Text>
              <TouchableOpacity
                style={[styles.updateBtn, styles.updateBtnNow, { backgroundColor: theme.tint, marginTop: spacing(16), width: '100%', flex: 0 }]}
                onPress={() => setShowNoUpdate(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.updateBtnText, { color: '#FFF' }]}>确定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(20),
    paddingVertical: spacing(14),
    gap: spacing(10),
  },
  headerTitle: {
    fontSize: fs(22),
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    padding: spacing(6),
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing(20),
    paddingBottom: spacing(34),
  },
  section: {
    gap: spacing(10),
  },
  sectionDesc: {
    fontSize: fs(13),
    fontWeight: '500',
    marginBottom: spacing(4),
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing(14),
    borderRadius: borderRadius(18),
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(12),
    flex: 1,
  },
  settingTextWrap: {
    gap: spacing(2),
  },
  settingText: {
    fontSize: fs(15),
    fontWeight: '600',
  },
  settingSubtext: {
    fontSize: fs(12),
    fontWeight: '500',
    opacity: 0.8,
  },
  tabSelectorWrap: {
    position: 'relative',
  },
  tabSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing(8),
    paddingHorizontal: spacing(14),
    borderRadius: borderRadius(12),
  },
  tabSelectorText: {
    fontSize: fs(13),
    fontWeight: '600',
  },
  tabPickerBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  tabPickerDropdown: {
    minWidth: 120,
    borderRadius: borderRadius(18),
    paddingVertical: spacing(4),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {},
    }),
  },
  tabPickerOption: {
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(16),
    borderRadius: borderRadius(14),
    marginHorizontal: spacing(4),
  },
  tabPickerOptionText: {
    fontSize: fs(13),
    fontWeight: '600',
  },
  themeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing(14),
    borderRadius: borderRadius(18),
  },
  themeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(12),
  },
  themeText: {
    fontSize: fs(15),
    fontWeight: '600',
  },
  aboutCard: {
    alignItems: 'center',
    padding: spacing(16),
    borderRadius: borderRadius(22),
    gap: spacing(8),
  },
  appName: {
    fontSize: fs(18),
    fontWeight: '800',
  },
  version: {
    fontSize: fs(13),
    fontWeight: '600',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing(12),
    borderRadius: borderRadius(18),
  },
  infoLabel: {
    fontSize: fs(13),
    fontWeight: '600',
  },
  infoValue: {
    fontSize: fs(13),
    fontWeight: '600',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing(12),
    borderRadius: borderRadius(18),
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(10),
  },
  linkText: {
    fontSize: fs(13),
    fontWeight: '600',
  },
  updateOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing(24),
  },
  updateModal: {
    width: '100%',
    maxWidth: 300,
    borderRadius: borderRadius(20),
    overflow: 'hidden',
  },
  updateAccent: {
    height: spacing(4),
    width: '100%',
  },
  updateContent: {
    padding: spacing(24),
    alignItems: 'center',
    gap: spacing(8),
  },
  updateIconWrap: {
    width: spacing(64),
    height: spacing(64),
    borderRadius: spacing(32),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing(8),
  },
  updateTitle: {
    fontSize: fs(18),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  updateVersion: {
    fontSize: fs(13),
    fontWeight: '500',
    opacity: 0.8,
  },
  updateButtons: {
    flexDirection: 'row',
    gap: spacing(10),
    marginTop: spacing(16),
    width: '100%',
  },
  updateBtn: {
    flex: 1,
    paddingVertical: spacing(14),
    borderRadius: borderRadius(12),
    alignItems: 'center',
  },
  updateBtnLater: {
    backgroundColor: 'transparent',
  },
  updateBtnNow: {
    backgroundColor: 'transparent',
  },
  updateBtnText: {
    fontSize: fs(14),
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
