import { Dimensions, PixelRatio, Platform, StatusBar } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

const scaleWidth = SCREEN_WIDTH / BASE_WIDTH;
const scaleHeight = SCREEN_HEIGHT / BASE_HEIGHT;

export function normalize(size: number, based: 'width' | 'height' | 'min' = 'min'): number {
  const scaleFactor = based === 'width' ? scaleWidth : based === 'height' ? scaleHeight : Math.min(scaleWidth, scaleHeight);
  const newSize = size * scaleFactor;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

export function wp(percentage: number): number {
  const value = (percentage * SCREEN_WIDTH) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
}

export function hp(percentage: number): number {
  const value = (percentage * SCREEN_HEIGHT) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
}

export function fs(size: number): number {
  const minSize = 12;
  const maxSize = 24;
  const normalized = normalize(size, 'min');
  return Math.max(minSize, Math.min(maxSize, normalized));
}

export function spacing(size: number): number {
  const minSize = 8;
  const maxSize = 24;
  const normalized = normalize(size, 'min');
  return Math.max(minSize, Math.min(maxSize, normalized));
}

export function borderRadius(size: number): number {
  const minSize = 8;
  const maxSize = 32;
  const normalized = normalize(size, 'min');
  return Math.max(minSize, Math.min(maxSize, normalized));
}

export function iconSize(size: number): number {
  const minSize = 18;
  const maxSize = 32;
  const normalized = normalize(size, 'min');
  return Math.max(minSize, Math.min(maxSize, normalized));
}

export function getSafeAreaTop(): number {
  if (Platform.OS === 'android') {
    return StatusBar.currentHeight || 0;
  }
  if (SCREEN_HEIGHT >= 812) {
    return 44;
  }
  return 20;
}

export function getSafeAreaBottom(): number {
  if (Platform.OS === 'android') {
    return 0;
  }
  if (SCREEN_HEIGHT >= 812) {
    return 34;
  }
  return 0;
}

export function getTabBarHeight(): number {
  const baseHeight = 72;
  const minTabBarHeight = 56;
  const maxTabBarHeight = 88;
  const calculated = normalize(baseHeight, 'min');
  return Math.max(minTabBarHeight, Math.min(maxTabBarHeight, calculated));
}

export function getInputAreaHeight(): number {
  const baseHeight = 98;
  const minInputHeight = 72;
  const maxInputHeight = 120;
  const calculated = normalize(baseHeight, 'min');
  return Math.max(minInputHeight, Math.min(maxInputHeight, calculated));
}

export const screen = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  scale: scaleWidth,
  fontScale: PixelRatio.getFontScale(),
  pixelRatio: PixelRatio.get(),
};

export const isSmallDevice = SCREEN_WIDTH < 360;
export const isMediumDevice = SCREEN_WIDTH >= 360 && SCREEN_WIDTH < 414;
export const isLargeDevice = SCREEN_WIDTH >= 414;

export function useResponsive() {
  return {
    screen,
    normalize,
    wp,
    hp,
    fs,
    spacing,
    borderRadius,
    iconSize,
    getSafeAreaTop,
    getSafeAreaBottom,
    getTabBarHeight,
    getInputAreaHeight,
    isSmallDevice,
    isMediumDevice,
    isLargeDevice,
  };
}
