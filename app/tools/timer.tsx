import { useTheme } from '@/contexts/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { borderRadius, fs, iconSize, spacing } from '@/hooks/use-responsive';

type TimerState = 'idle' | 'running' | 'paused';

export default function TimerScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [seconds, setSeconds] = useState(0);
  const [state, setState] = useState<TimerState>('idle');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const start = () => {
    setState('running');
    intervalRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  };

  const pause = () => {
    setState('paused');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resume = () => {
    setState('running');
    intervalRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  };

  const reset = () => {
    setState('idle');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSeconds(0);
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: secs.toString().padStart(2, '0'),
    };
  };

  const time = formatTime(seconds);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={iconSize(24)} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>计时器</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.timerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.timeDisplay}>
            <View style={styles.timeUnit}>
              <Text style={[styles.timeNumber, { color: theme.text }]}>{time.hours}</Text>
              <Text style={[styles.timeLabel, { color: theme.tabIconDefault }]}>时</Text>
            </View>
            <Text style={[styles.timeSeparator, { color: theme.text }]}>:</Text>
            <View style={styles.timeUnit}>
              <Text style={[styles.timeNumber, { color: theme.text }]}>{time.minutes}</Text>
              <Text style={[styles.timeLabel, { color: theme.tabIconDefault }]}>分</Text>
            </View>
            <Text style={[styles.timeSeparator, { color: theme.text }]}>:</Text>
            <View style={styles.timeUnit}>
              <Text style={[styles.timeNumber, { color: theme.text }]}>{time.seconds}</Text>
              <Text style={[styles.timeLabel, { color: theme.tabIconDefault }]}>秒</Text>
            </View>
          </View>
        </View>

        <View style={styles.controls}>
          {state === 'idle' && (
            <TouchableOpacity
              style={[styles.controlBtn, styles.primaryBtn, { backgroundColor: theme.tint }]}
              onPress={start}
              activeOpacity={0.8}
            >
              <MaterialIcons name="play-arrow" size={iconSize(28)} color="#FFF" />
              <Text style={styles.primaryBtnText}>开始</Text>
            </TouchableOpacity>
          )}

          {state === 'running' && (
            <>
              <TouchableOpacity
                style={[styles.controlBtn, styles.secondaryBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={reset}
                activeOpacity={0.8}
              >
                <MaterialIcons name="refresh" size={iconSize(24)} color={theme.text} />
                <Text style={[styles.secondaryBtnText, { color: theme.text }]}>重置</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlBtn, styles.primaryBtn, { backgroundColor: theme.tint }]}
                onPress={pause}
                activeOpacity={0.8}
              >
                <MaterialIcons name="pause" size={iconSize(28)} color="#FFF" />
                <Text style={styles.primaryBtnText}>暂停</Text>
              </TouchableOpacity>
            </>
          )}

          {state === 'paused' && (
            <>
              <TouchableOpacity
                style={[styles.controlBtn, styles.secondaryBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={reset}
                activeOpacity={0.8}
              >
                <MaterialIcons name="refresh" size={iconSize(24)} color={theme.text} />
                <Text style={[styles.secondaryBtnText, { color: theme.text }]}>重置</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlBtn, styles.primaryBtn, { backgroundColor: theme.tint }]}
                onPress={resume}
                activeOpacity={0.8}
              >
                <MaterialIcons name="play-arrow" size={iconSize(28)} color="#FFF" />
                <Text style={styles.primaryBtnText}>继续</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>快速设置</Text>
          <View style={styles.quickBtns}>
            {[60, 300, 600, 1800].map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.quickBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => {
                  if (state === 'idle') {
                    setSeconds(s);
                  }
                }}
                activeOpacity={0.7}
                disabled={state !== 'idle'}
              >
                <Text style={[styles.quickBtnText, { color: state === 'idle' ? theme.text : theme.tabIconDefault }]}>
                  {s < 60 ? `${s}秒` : s < 3600 ? `${Math.floor(s / 60)}分钟` : `${Math.floor(s / 3600)}小时`}
                </Text>
              </TouchableOpacity>
            ))}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(12),
  },
  backBtn: {
    width: spacing(40),
    height: spacing(40),
    borderRadius: borderRadius(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fs(18),
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: spacing(16),
    paddingBottom: spacing(40),
  },
  timerCard: {
    borderRadius: borderRadius(24),
    borderWidth: 1,
    padding: spacing(32),
    alignItems: 'center',
    marginTop: spacing(20),
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeUnit: {
    alignItems: 'center',
  },
  timeNumber: {
    fontSize: fs(48),
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  timeLabel: {
    fontSize: fs(12),
    fontWeight: '600',
    marginTop: spacing(4),
  },
  timeSeparator: {
    fontSize: fs(40),
    fontWeight: '800',
    marginHorizontal: spacing(8),
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing(16),
    marginTop: spacing(32),
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(8),
    paddingVertical: spacing(16),
    paddingHorizontal: spacing(32),
    borderRadius: borderRadius(18),
    minWidth: spacing(120),
  },
  primaryBtn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: fs(16),
    fontWeight: '700',
    color: '#FFF',
  },
  secondaryBtn: {
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: fs(16),
    fontWeight: '700',
  },
  quickActions: {
    marginTop: spacing(32),
  },
  sectionTitle: {
    fontSize: fs(16),
    fontWeight: '700',
    marginBottom: spacing(12),
  },
  quickBtns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(10),
  },
  quickBtn: {
    paddingVertical: spacing(12),
    paddingHorizontal: spacing(18),
    borderRadius: borderRadius(14),
    borderWidth: 1,
  },
  quickBtnText: {
    fontSize: fs(14),
    fontWeight: '600',
  },
});
