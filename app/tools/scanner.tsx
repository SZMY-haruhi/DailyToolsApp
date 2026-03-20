import { useTheme } from '@/contexts/ThemeContext';
import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { borderRadius, fs, spacing, iconSize } from '@/hooks/use-responsive';

export default function ScannerScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [facing, setFacing] = useState<CameraType>('back');

  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    setScannedData(data);
  };

  const handleScanAgain = () => {
    setScanned(false);
    setScannedData(null);
  };

  const handleOpenLink = () => {
    if (scannedData) {
      let url = scannedData;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }
      Linking.openURL(url);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const isValidUrl = (text: string) => {
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    return urlPattern.test(text);
  };

  if (!permission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.text }]}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={iconSize(24)} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>扫一扫</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.permissionContainer}>
          <MaterialIcons name="qr-code-scanner" size={iconSize(64)} color={theme.tabIconDefault} />
          <Text style={[styles.permissionTitle, { color: theme.text }]}>需要相机权限</Text>
          <Text style={[styles.permissionText, { color: theme.tabIconDefault }]}>
            请允许使用相机以扫描二维码
          </Text>
          <TouchableOpacity
            style={[styles.permissionBtn, { backgroundColor: theme.tint }]}
            onPress={requestPermission}
            activeOpacity={0.7}
          >
            <Text style={styles.permissionBtnText}>授权相机</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={iconSize(24)} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>扫一扫</Text>
        <TouchableOpacity onPress={toggleCameraFacing} activeOpacity={0.7} style={styles.backBtn}>
          <MaterialIcons name="flip-camera-ios" size={iconSize(24)} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing={facing}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39'],
            }}
          >
            <View style={styles.overlay}>
              <View style={styles.scanArea}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.hintText}>将二维码放入框内扫描</Text>
            </View>
          </CameraView>
        </View>

        {scanned && scannedData && (
          <View style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.resultHeader}>
              <MaterialIcons name="check-circle" size={iconSize(24)} color="#4CAF50" />
              <Text style={[styles.resultTitle, { color: theme.text }]}>扫描结果</Text>
            </View>
            <View style={[styles.resultContent, { backgroundColor: theme.cardMuted }]}>
              <Text style={[styles.resultText, { color: theme.text }]}>{scannedData}</Text>
            </View>
            <View style={styles.resultActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: theme.cardMuted }]}
                onPress={handleScanAgain}
                activeOpacity={0.7}
              >
                <MaterialIcons name="refresh" size={iconSize(20)} color={theme.text} />
                <Text style={[styles.actionBtnText, { color: theme.text }]}>继续扫描</Text>
              </TouchableOpacity>
              {isValidUrl(scannedData) && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.primaryActionBtn, { backgroundColor: theme.tint }]}
                  onPress={handleOpenLink}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="open-in-browser" size={iconSize(20)} color="#FFF" />
                  <Text style={styles.primaryActionBtnText}>打开链接</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: fs(16),
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(40),
    gap: spacing(16),
  },
  permissionTitle: {
    fontSize: fs(20),
    fontWeight: '700',
  },
  permissionText: {
    fontSize: fs(14),
    fontWeight: '500',
    textAlign: 'center',
  },
  permissionBtn: {
    paddingVertical: spacing(14),
    paddingHorizontal: spacing(32),
    borderRadius: borderRadius(14),
    marginTop: spacing(8),
  },
  permissionBtnText: {
    fontSize: fs(16),
    fontWeight: '600',
    color: '#FFF',
  },
  content: {
    paddingHorizontal: spacing(16),
    paddingBottom: spacing(40),
  },
  cameraContainer: {
    borderRadius: borderRadius(22),
    overflow: 'hidden',
    height: 300,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  scanArea: {
    width: 200,
    height: 200,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#FFF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  hintText: {
    color: '#FFF',
    fontSize: fs(14),
    fontWeight: '600',
    marginTop: spacing(20),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  resultCard: {
    borderRadius: borderRadius(22),
    borderWidth: 1,
    padding: spacing(16),
    marginTop: spacing(20),
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(10),
    marginBottom: spacing(12),
  },
  resultTitle: {
    fontSize: fs(16),
    fontWeight: '700',
  },
  resultContent: {
    padding: spacing(14),
    borderRadius: borderRadius(14),
  },
  resultText: {
    fontSize: fs(14),
    fontWeight: '500',
    lineHeight: 20,
  },
  resultActions: {
    flexDirection: 'row',
    gap: spacing(12),
    marginTop: spacing(16),
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(8),
    paddingVertical: spacing(12),
    borderRadius: borderRadius(14),
  },
  actionBtnText: {
    fontSize: fs(14),
    fontWeight: '600',
  },
  primaryActionBtn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryActionBtnText: {
    fontSize: fs(14),
    fontWeight: '600',
    color: '#FFF',
  },
});
