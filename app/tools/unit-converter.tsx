import { useTheme } from '@/contexts/ThemeContext';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { borderRadius, fs, spacing, iconSize } from '@/hooks/use-responsive';

type Category = 'length' | 'weight' | 'temperature';

interface Unit {
  key: string;
  label: string;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
}

const units: Record<Category, Unit[]> = {
  length: [
    { key: 'mm', label: '毫米', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { key: 'cm', label: '厘米', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
    { key: 'm', label: '米', toBase: (v) => v, fromBase: (v) => v },
    { key: 'km', label: '千米', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { key: 'in', label: '英寸', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
    { key: 'ft', label: '英尺', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
  ],
  weight: [
    { key: 'mg', label: '毫克', toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 },
    { key: 'g', label: '克', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { key: 'kg', label: '千克', toBase: (v) => v, fromBase: (v) => v },
    { key: 'oz', label: '盎司', toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
    { key: 'lb', label: '磅', toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
  ],
  temperature: [
    { key: 'c', label: '摄氏度', toBase: (v) => v, fromBase: (v) => v },
    { key: 'f', label: '华氏度', toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 },
    { key: 'k', label: '开尔文', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
  ],
};

const categoryLabels: Record<Category, string> = {
  length: '长度',
  weight: '重量',
  temperature: '温度',
};

export default function UnitConverterScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [category, setCategory] = useState<Category>('length');
  const [fromUnit, setFromUnit] = useState<Unit>(units.length[1]);
  const [toUnit, setToUnit] = useState<Unit>(units.length[2]);
  const [fromValue, setFromValue] = useState('');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const convert = () => {
    const num = parseFloat(fromValue);
    if (isNaN(num)) return '';
    const baseValue = fromUnit.toBase(num);
    const result = toUnit.fromBase(baseValue);
    return result.toFixed(6).replace(/\.?0+$/, '');
  };

  const handleCategoryChange = (newCategory: Category) => {
    setCategory(newCategory);
    setFromUnit(units[newCategory][0]);
    setToUnit(units[newCategory][1]);
    setFromValue('');
  };

  const swapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
    setFromValue(convert());
  };

  const result = convert();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={iconSize(24)} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>单位换算</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.categoryTabs}>
          {(Object.keys(categoryLabels) as Category[]).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryTab,
                category === cat && { backgroundColor: theme.tint },
              ]}
              onPress={() => handleCategoryChange(cat)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.categoryTabText,
                  { color: category === cat ? '#FFF' : theme.text },
                ]}
              >
                {categoryLabels[cat]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.converterCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.inputSection}>
            <Text style={[styles.sectionLabel, { color: theme.tabIconDefault }]}>从</Text>
            <TouchableOpacity
              style={[styles.unitSelector, { backgroundColor: theme.cardMuted }]}
              onPress={() => setShowFromPicker(!showFromPicker)}
              activeOpacity={0.7}
            >
              <Text style={[styles.unitSelectorText, { color: theme.text }]}>{fromUnit.label}</Text>
              <MaterialIcons name="unfold-more" size={iconSize(20)} color={theme.tabIconDefault} />
            </TouchableOpacity>
            {showFromPicker && (
              <View style={[styles.unitPicker, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {units[category].map((unit) => (
                  <TouchableOpacity
                    key={unit.key}
                    style={[
                      styles.unitPickerOption,
                      fromUnit.key === unit.key && { backgroundColor: theme.cardMuted },
                    ]}
                    onPress={() => {
                      setFromUnit(unit);
                      setShowFromPicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.unitPickerText, { color: theme.text }]}>{unit.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TextInput
              value={fromValue}
              onChangeText={setFromValue}
              placeholder="输入数值"
              placeholderTextColor={theme.tabIconDefault}
              style={[styles.input, { color: theme.text, backgroundColor: theme.cardMuted }]}
              keyboardType="decimal-pad"
            />
          </View>

          <TouchableOpacity style={styles.swapBtn} onPress={swapUnits} activeOpacity={0.7}>
            <MaterialIcons name="swap-vert" size={iconSize(28)} color={theme.tint} />
          </TouchableOpacity>

          <View style={styles.inputSection}>
            <Text style={[styles.sectionLabel, { color: theme.tabIconDefault }]}>到</Text>
            <TouchableOpacity
              style={[styles.unitSelector, { backgroundColor: theme.cardMuted }]}
              onPress={() => setShowToPicker(!showToPicker)}
              activeOpacity={0.7}
            >
              <Text style={[styles.unitSelectorText, { color: theme.text }]}>{toUnit.label}</Text>
              <MaterialIcons name="unfold-more" size={iconSize(20)} color={theme.tabIconDefault} />
            </TouchableOpacity>
            {showToPicker && (
              <View style={[styles.unitPicker, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {units[category].map((unit) => (
                  <TouchableOpacity
                    key={unit.key}
                    style={[
                      styles.unitPickerOption,
                      toUnit.key === unit.key && { backgroundColor: theme.cardMuted },
                    ]}
                    onPress={() => {
                      setToUnit(unit);
                      setShowToPicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.unitPickerText, { color: theme.text }]}>{unit.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={[styles.resultBox, { backgroundColor: theme.cardMuted }]}>
              <Text style={[styles.resultText, { color: theme.text }]}>
                {result || '—'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.clearBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => setFromValue('')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="delete-outline" size={iconSize(20)} color={theme.text} />
          <Text style={[styles.clearBtnText, { color: theme.text }]}>清空</Text>
        </TouchableOpacity>
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
  categoryTabs: {
    flexDirection: 'row',
    gap: spacing(10),
    marginBottom: spacing(20),
  },
  categoryTab: {
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(20),
    borderRadius: borderRadius(14),
  },
  categoryTabText: {
    fontSize: fs(14),
    fontWeight: '600',
  },
  converterCard: {
    borderRadius: borderRadius(22),
    borderWidth: 1,
    padding: spacing(20),
    gap: spacing(16),
  },
  inputSection: {
    gap: spacing(10),
  },
  sectionLabel: {
    fontSize: fs(12),
    fontWeight: '600',
  },
  unitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing(12),
    paddingHorizontal: spacing(16),
    borderRadius: borderRadius(14),
  },
  unitSelectorText: {
    fontSize: fs(15),
    fontWeight: '600',
  },
  unitPicker: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderRadius: borderRadius(14),
    borderWidth: 1,
    paddingVertical: spacing(4),
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  unitPickerOption: {
    paddingVertical: spacing(12),
    paddingHorizontal: spacing(16),
    borderRadius: borderRadius(10),
    marginHorizontal: spacing(4),
  },
  unitPickerText: {
    fontSize: fs(14),
    fontWeight: '500',
  },
  input: {
    fontSize: fs(24),
    fontWeight: '700',
    paddingVertical: spacing(16),
    paddingHorizontal: spacing(16),
    borderRadius: borderRadius(14),
    textAlign: 'center',
  },
  swapBtn: {
    alignSelf: 'center',
    width: spacing(48),
    height: spacing(48),
    borderRadius: borderRadius(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBox: {
    paddingVertical: spacing(16),
    paddingHorizontal: spacing(16),
    borderRadius: borderRadius(14),
    alignItems: 'center',
  },
  resultText: {
    fontSize: fs(24),
    fontWeight: '700',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(8),
    marginTop: spacing(20),
    paddingVertical: spacing(14),
    borderRadius: borderRadius(14),
    borderWidth: 1,
  },
  clearBtnText: {
    fontSize: fs(15),
    fontWeight: '600',
  },
});
