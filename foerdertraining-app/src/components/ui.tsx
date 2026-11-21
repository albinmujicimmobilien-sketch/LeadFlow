import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaxContentWidth, Radius, Spacing, usePalette } from '@/constants/theme';

// ---------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------

export function Screen({
  children,
  refreshing,
  onRefresh,
  footer,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  footer?: ReactNode;
}) {
  const c = usePalette();
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
        refreshControl={
          onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined
        }>
        <View style={styles.inner}>{children}</View>
      </ScrollView>
      {footer ? (
        <View style={[styles.footer, { backgroundColor: c.card, borderTopColor: c.border }]}>
          <View style={styles.inner}>{footer}</View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const c = usePalette();
  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, style]}>{children}</View>
  );
}

// ---------------------------------------------------------------------
// Typografie
// ---------------------------------------------------------------------

type TextVariant = 'title' | 'heading' | 'body' | 'label' | 'small' | 'muted';

export function T({
  children,
  variant = 'body',
  style,
  color,
  center,
}: {
  children: ReactNode;
  variant?: TextVariant;
  style?: TextStyle;
  color?: string;
  center?: boolean;
}) {
  const c = usePalette();
  const base = textStyles[variant];
  const defaultColor = variant === 'muted' || variant === 'small' ? c.textSecondary : c.text;
  return (
    <Text style={[base, { color: color ?? defaultColor }, center && { textAlign: 'center' }, style]}>
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------------
// Buttons & Chips
// ---------------------------------------------------------------------

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const c = usePalette();
  const isDisabled = disabled || loading;
  const bg = {
    primary: c.primary,
    secondary: c.primarySoft,
    danger: c.dangerSoft,
    ghost: 'transparent',
  }[variant];
  const fg = {
    primary: c.primaryText,
    secondary: c.primary,
    danger: c.danger,
    ghost: c.primary,
  }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: isDisabled && variant === 'primary' ? c.disabled : bg },
        pressed && { opacity: 0.8 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  sublabel,
  disabled,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  sublabel?: string;
  disabled?: boolean;
}) {
  const c = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? c.primary : c.card,
          borderColor: selected ? c.primary : c.border,
          opacity: disabled ? 0.45 : 1,
        },
        pressed && { opacity: 0.8 },
      ]}>
      <Text style={[styles.chipText, { color: selected ? c.primaryText : c.text }]}>{label}</Text>
      {sublabel ? (
        <Text style={[styles.chipSub, { color: selected ? c.primaryText : c.textSecondary }]}>{sublabel}</Text>
      ) : null}
    </Pressable>
  );
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'success' | 'danger' | 'primary' }) {
  const c = usePalette();
  const map = {
    neutral: [c.border, c.textSecondary],
    success: [c.successSoft, c.success],
    danger: [c.dangerSoft, c.danger],
    primary: [c.primarySoft, c.primary],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------
// Formulare
// ---------------------------------------------------------------------

export function Field({
  label,
  error,
  hint,
  required,
  ...props
}: TextInputProps & { label: string; error?: string; hint?: string; required?: boolean }) {
  const c = usePalette();
  return (
    <View style={{ gap: Spacing.xs }}>
      <T variant="label">
        {label}
        {required ? <Text style={{ color: c.danger }}> *</Text> : null}
      </T>
      <TextInput
        placeholderTextColor={c.textSecondary}
        accessibilityLabel={label}
        {...props}
        style={[
          styles.input,
          {
            color: c.text,
            backgroundColor: c.card,
            borderColor: error ? c.danger : c.border,
          },
          props.multiline && { minHeight: 90, textAlignVertical: 'top' },
        ]}
      />
      {error ? <T variant="small" color={c.danger}>{error}</T> : hint ? <T variant="small">{hint}</T> : null}
    </View>
  );
}

export function Checkbox({
  checked,
  onChange,
  children,
  error,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
  error?: string;
}) {
  const c = usePalette();
  return (
    <View style={{ gap: Spacing.xs }}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={() => onChange(!checked)}
        style={styles.checkboxRow}>
        <View
          style={[
            styles.checkbox,
            {
              borderColor: error ? c.danger : checked ? c.primary : c.border,
              backgroundColor: checked ? c.primary : c.card,
            },
          ]}>
          {checked ? <Text style={{ color: c.primaryText, fontWeight: '700' }}>✓</Text> : null}
        </View>
        <View style={{ flex: 1 }}>{children}</View>
      </Pressable>
      {error ? <T variant="small" color={c.danger}>{error}</T> : null}
    </View>
  );
}

// ---------------------------------------------------------------------
// Zustände
// ---------------------------------------------------------------------

export function Loading({ label = 'Wird geladen …' }: { label?: string }) {
  const c = usePalette();
  return (
    <View style={styles.centerBox}>
      <ActivityIndicator color={c.primary} />
      <T variant="muted">{label}</T>
    </View>
  );
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'error' | 'success'; children: ReactNode }) {
  const c = usePalette();
  const bg = tone === 'error' ? c.dangerSoft : tone === 'success' ? c.successSoft : c.primarySoft;
  const fg = tone === 'error' ? c.danger : tone === 'success' ? c.success : c.primary;
  return (
    <View style={[styles.notice, { backgroundColor: bg }]} accessibilityRole="alert">
      {typeof children === 'string' ? <T color={fg}>{children}</T> : children}
    </View>
  );
}

const textStyles: Record<TextVariant, TextStyle> = {
  title: { fontSize: 26, fontWeight: '700', lineHeight: 32 },
  heading: { fontSize: 18, fontWeight: '700', lineHeight: 24 },
  body: { fontSize: 16, lineHeight: 22 },
  label: { fontSize: 15, fontWeight: '600', lineHeight: 20 },
  small: { fontSize: 13, lineHeight: 18 },
  muted: { fontSize: 15, lineHeight: 21 },
};

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl, alignItems: 'center' },
  inner: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.lg, alignSelf: 'center' },
  footer: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  card: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.lg, gap: Spacing.md },
  button: {
    minHeight: 50,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '700' },
  chip: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    minWidth: 64,
  },
  chipText: { fontSize: 15, fontWeight: '600' },
  chipSub: { fontSize: 12, marginTop: 2 },
  badge: { borderRadius: Radius.pill, paddingHorizontal: Spacing.sm, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
  },
  checkboxRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  centerBox: { alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.xxl },
  notice: { borderRadius: Radius.md, padding: Spacing.md },
});
