import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Badge, Button, Card, Chip, Loading, Notice, Screen, T } from '@/components/ui';
import { Radius, Spacing, usePalette } from '@/constants/theme';
import { api } from '@/lib/api';
import { AppConfig } from '@/lib/config';
import { dayKey, formatDay, formatShortDay, formatTimeRange } from '@/lib/date';
import type { Slot } from '@/lib/types';

export default function SlotOverview() {
  const c = usePalette();
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await api.listOpenSlots();
      setSlots(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Termine konnten nicht geladen werden.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Nur Tage mit mindestens einem freien Platz
  const days = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of slots ?? []) {
      if (s.bookedCount >= s.capacity) continue;
      const k = dayKey(s.startsAt);
      map.set(k, [...(map.get(k) ?? []), s]);
    }
    return [...map.entries()];
  }, [slots]);

  const activeDay = days.find(([k]) => k === selectedDay) ?? days[0];

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <View style={{ gap: Spacing.sm }}>
        <T variant="title">Freien Termin buchen</T>
        <T variant="muted">{AppConfig.welcomeText}</T>
      </View>

      {api.mode === 'demo' ? (
        <Notice>
          <T variant="small" color={c.primary}>
            Demo-Modus: Termine werden nur auf diesem Gerät gespeichert. Für den Live-Betrieb Supabase verbinden
            (siehe README).
          </T>
        </Notice>
      ) : null}

      {error ? <Notice tone="error">{error}</Notice> : null}

      {slots === null && !error ? (
        <Loading label="Freie Termine werden geladen …" />
      ) : days.length === 0 && !error ? (
        <Card>
          <T variant="heading">Aktuell sind alle Termine vergeben</T>
          <T variant="muted">
            Neue Termine werden regelmäßig freigeschaltet. Schauen Sie bald wieder vorbei oder schreiben Sie uns an{' '}
            {AppConfig.contactEmail}.
          </T>
        </Card>
      ) : activeDay ? (
        <>
          <View style={{ gap: Spacing.sm }}>
            <T variant="label">1. Tag wählen</T>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
              {days.map(([k, daySlots]) => {
                const d = formatShortDay(new Date(daySlots[0].startsAt));
                const selected = k === activeDay[0];
                return (
                  <Pressable
                    key={k}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${formatDay(daySlots[0].startsAt)}, ${daySlots.length} freie Termine`}
                    onPress={() => setSelectedDay(k)}
                    style={[
                      styles.dayPill,
                      {
                        backgroundColor: selected ? c.primary : c.card,
                        borderColor: selected ? c.primary : c.border,
                      },
                    ]}>
                    <T variant="small" color={selected ? c.primaryText : c.textSecondary}>
                      {d.weekday}
                    </T>
                    <T variant="heading" color={selected ? c.primaryText : c.text}>
                      {d.day}
                    </T>
                    <T variant="small" color={selected ? c.primaryText : c.textSecondary}>
                      {d.month}
                    </T>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={{ gap: Spacing.sm }}>
            <T variant="label">2. Uhrzeit wählen – {formatDay(activeDay[1][0].startsAt)}</T>
            {activeDay[1].map((slot) => {
              const free = slot.capacity - slot.bookedCount;
              return (
                <Pressable
                  key={slot.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Termin ${formatTimeRange(slot.startsAt, slot.durationMinutes)} buchen`}
                  onPress={() => router.push({ pathname: '/buchen/[slotId]', params: { slotId: slot.id } })}
                  style={({ pressed }) => [
                    styles.slotRow,
                    { backgroundColor: c.card, borderColor: c.border },
                    pressed && { opacity: 0.8 },
                  ]}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <T variant="heading">{formatTimeRange(slot.startsAt, slot.durationMinutes)}</T>
                    <T variant="small">
                      {slot.durationMinutes} Min. · {slot.location ?? AppConfig.defaultLocation}
                    </T>
                    {slot.note ? <T variant="small">{slot.note}</T> : null}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: Spacing.sm }}>
                    {slot.capacity > 1 ? (
                      <Badge label={`${free} von ${slot.capacity} frei`} tone="success" />
                    ) : (
                      <Badge label="frei" tone="success" />
                    )}
                    <T variant="label" color={c.primary}>
                      Buchen ›
                    </T>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      <View style={styles.footerLinks}>
        <Button title="Gebuchten Termin verwalten / stornieren" variant="secondary" onPress={() => router.push('/stornieren')} />
        <View style={styles.legalRow}>
          <Chip label="Datenschutz" onPress={() => Linking.openURL(AppConfig.privacyUrl)} />
          <Chip label="Impressum" onPress={() => Linking.openURL(AppConfig.imprintUrl)} />
          <Chip label="Trainer-Login" onPress={() => router.push('/admin')} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dayPill: {
    width: 68,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  footerLinks: { gap: Spacing.md, marginTop: Spacing.lg },
  legalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'center' },
});
