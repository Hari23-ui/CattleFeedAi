/**
 * CattleFeedAI Design System & Theme Tokens
 *
 * Tailored for agricultural field environments:
 * - High contrast, accessible color palette
 * - Clear typography and touch targets (min 48dp)
 * - Prepared status colors for quality and risk assessments
 */

export const colors = {
  // Brand colors
  primary: '#2E7D32',       // Agricultural Forest Green
  primaryDark: '#1B5E20',   // Deep Forest Green
  primaryLight: '#E8F5E9',  // Light Mint Green tint
  accent: '#F57C00',        // Harvest Amber / Orange
  accentLight: '#FFF3E0',   // Light Amber tint

  // Neutral colors
  background: '#F8F9FA',    // Clean soft background
  surface: '#FFFFFF',       // Card / modal surface
  border: '#E2E8F0',        // Subtle border
  borderFocus: '#2E7D32',   // Active input border
  divider: '#EEEEEE',       // Divider lines

  // Typography
  textPrimary: '#1A202C',   // Deep charcoal for maximum readability
  textSecondary: '#5A6A80', // Slate gray for secondary details
  textMuted: '#8C9BAE',     // Soft gray for hints/placeholders
  textInverse: '#FFFFFF',   // White text on dark/colored buttons

  // Feedback & Status
  success: '#2E7D32',
  error: '#D32F2F',
  errorLight: '#FFEBEE',
  warning: '#ED6C02',
  warningLight: '#FFF4E5',
  info: '#0288D1',
  infoLight: '#E1F5FE',

  // CattleFeedAI Assessment Status Scale (for quality/risk evaluation)
  statusGood: '#2E7D32',             // Green - Safe & High Quality
  statusAcceptable: '#388E3C',       // Moderate Green - Usable
  statusNeedsAttention: '#F57C00',   // Amber - Moderate risk / adjustments needed
  statusUnsafe: '#D32F2F',           // Red - Toxic / Contaminated / High Risk
  statusInsufficientData: '#757575', // Gray - Incomplete testing
};

export const typography = {
  fontSize: {
    caption: 12,
    small: 14,
    body: 16,
    subtitle: 18,
    title: 20,
    header: 24,
    display: 28,
  },
  lineHeight: {
    caption: 16,
    small: 20,
    body: 24,
    subtitle: 26,
    title: 28,
    header: 32,
    display: 36,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
};

export const elevation = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHover: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const touchTarget = {
  minHeight: 48,
  minWidth: 48,
};

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  elevation,
  touchTarget,
};

export default theme;
