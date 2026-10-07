/**
 * Inai Design Tokens
 * 
 * Calm, warm, trustworthy, and accessible design tokens for Mom (~55 years old).
 * Strictly NO GRADIENTS. High contrast, large comfortable touch targets.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Canvas & Surfaces
    background: '#FAF7F2',        // Warm ivory / linen
    backgroundElement: '#F2ECE4', // Soft warm oatmeal surface
    backgroundCard: '#FFFFFF',    // Clean card surface
    backgroundSelected: '#E8DFD5',// Warm active state
    border: '#E5DED4',            // Gentle border

    // Text & Content (WCAG AAA contrast for reading ease)
    text: '#282522',              // Deep warm charcoal
    textSecondary: '#6B645D',     // Warm muted umber
    textMuted: '#8E867E',         // Subtle text

    // Accents & Brand (Motherly, calm, and grounded)
    primary: '#3D5A50',           // Muted deep sage green
    primaryLight: '#E9F0EC',      // Sage tint
    primaryText: '#FFFFFF',       // Text on primary button
    secondary: '#C46849',         // Gentle warm terracotta
    secondaryLight: '#FAECE6',    // Terracotta tint
    accent: '#C46849',
    tint: '#3D5A50',

    // Feedback & Status Badges
    success: '#2E684D',           // Calm herbal green (Taken)
    successLight: '#E6F2EB',
    warning: '#A8631E',           // Warm amber / ochre (Skipped / Pending)
    warningLight: '#FAF0E3',
    error: '#A33B32',             // Gentle brick red (Missed)
    errorLight: '#FAECEB',
  },
  dark: {
    // Canvas & Surfaces
    background: '#181715',        // Warm dark charcoal
    backgroundElement: '#252320', // Soft dark surface
    backgroundCard: '#2E2A26',    // Card surface
    backgroundSelected: '#3E3833',
    border: '#3F3A35',

    // Text & Content
    text: '#FAF7F2',              // Warm cream white
    textSecondary: '#C5BFB7',     // Soft warm gray
    textMuted: '#969088',

    // Accents & Brand
    primary: '#6FA18F',           // Soft sage green
    primaryLight: '#23332C',
    primaryText: '#101F18',
    secondary: '#E08569',         // Warm terracotta
    secondaryLight: '#3D251C',
    accent: '#E08569',
    tint: '#6FA18F',

    // Feedback & Status Badges
    success: '#62B88F',
    successLight: '#1B3327',
    warning: '#DCA15C',
    warningLight: '#362816',
    error: '#E87067',
    errorLight: '#381C1A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
  seven: 64,
} as const;

export const BorderRadius = {
  small: 8,
  medium: 12,
  card: 16,
  large: 20,
  full: 9999,
} as const;

export const TouchTarget = {
  minimum: 48,
  comfort: 56,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
