import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@dailytools_settings';

export interface AppSettings {
  notificationsEnabled: boolean;
  defaultTab: 'index' | 'explore' | 'profile';
}

export const defaultSettings: AppSettings = {
  notificationsEnabled: true,
  defaultTab: 'index',
};

export async function loadSettings(): Promise<AppSettings> {
  try {
    const json = await AsyncStorage.getItem(SETTINGS_KEY);
    if (json) {
      return { ...defaultSettings, ...JSON.parse(json) };
    }
  } catch (e) {
    console.error('Failed to load settings', e);
  }
  return defaultSettings;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export async function updateSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): Promise<void> {
  const settings = await loadSettings();
  settings[key] = value;
  await saveSettings(settings);
}
