import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Badge, Button, Card, Chip, Field, Loading, Notice, Screen, T } from '@/components/ui';
import { Radius, Spacing, usePalette } from '@/constants/theme';
import { api, type SlotWithBookings } from '@/lib/api';
import { AppConfig } from '@/lib/config';
import { confirmAction, notify } from '@/lib/confirm';
import { dayKey, formatDay, formatTimeRange } from '@/lib/date';
import type { Booking } from '@/lib/types';

type Filter = 'upcoming' | 'booked' | 'free' | 'past';

export default function AdminHome() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      api.adminIsSignedIn().then(setSignedIn).catch(() => setSignedIn(false));
    }, []),
  );

  if (signedIn === null) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }
  return signedIn ? <Dashboard onSignOut={() => setSignedIn(false)} /> : <Login onSuccess={() => setSignedIn(true)} />;
}

// ---------------------------------------------------------------------

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const demo = api.mode === 'demo';

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await api.adminSignIn(email.trim(), password);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <T variant="title">Trainer-Login</T>
      <T variant="muted">Hier verwaltest du Termine und siehst alle Buchungen inkl. Kontaktdaten.</T>
      {demo ? <Notice>{`Demo-Modus: PIN ist ${AppConfig.demoAdminPin} (in src/lib/config.ts änderbar).`}</Notice> : null}
      <View style={{ gap: Spacing.md }}>
        {!demo ? (
          <Field label="E-Mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        ) : null}
        <Field
          label={demo ? 'PIN' : 'Passwort'}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          keyboardType={demo ? 'number-pad' : 'default'}
          onSubmitEditing={submit}
        />
        {error ? <Notice tone="error">{error}</Notice> : null}
        <Button title="Anmelden" onPress={submit} loading={loading} />
      </View>
    </Screen>
  );
}

// ---------------------------------------------------------------------

function Dashboard({ onSignOut }: { onSignOut: () => void }) {
  const c = usePalette();
  const [slots, setSlots] = useState<SlotWithBookings[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('upcoming');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      setError(null);
      setSlots(await api.adminListSlots());
      setNow(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Laden fehlgeschlagen.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const upcoming = useMemo(() => (slots ?? []).filter((s) => new Date(s.startsAt).getTime() > now), [slots, now]);

  const stats = useMemo(() => {
    const totalPlaces = upcoming.reduce((a, s) => a + s.capacity, 0);
    const booked = upcoming.reduce((a, s) => a + s.bookedCount, 0);
    return {
      slots: upcoming.length,
      booked,
      free: totalPlaces - booked,
      utilization: totalPlaces ? Math.round((booked / totalPlaces) * 100) : 0,
    };
  }, [upcoming]);

  const visible = useMemo(() => {
    const list = slots ?? [];
    switch (filter) {
      case 'past':
        return list.filter((s) => new Date(s.startsAt).getTime() <= now).reverse();
      case 'booked':
        return upcoming.filter((s) => s.bookedCount > 0);
      case 'free':
        return upcoming.filter((s) => s.bookedCount < s.capacity);
      default:
        return upcoming;
    }
  }, [slots, upcoming, filter, now]);

  const grouped = useMemo(() => {
    const map = new Map<string, SlotWithBookings[]>();
    for (const s of visible) map.set(dayKey(s.startsAt), [...(map.get(dayKey(s.startsAt)) ?? []), s]);
    return [...map.values()];
  }, [visible]);

  const deleteSlot = async (slot: SlotWithBookings) => {
    const msg =
      slot.bookedCount > 0
        ? `Achtung: ${slot.bookedCount} Buchung(en) werden mitgelöscht. Bitte informiere die Eltern vorher.`
        : 'Der Termin wird entfernt.';
    if (!(await confirmAction('Termin löschen?', msg, 'Löschen'))) return;
    try {
      await api.adminDeleteSlot(slot.id);
      await load();
    } catch (e) {
      notify('Fehler', e instanceof Error ? e.message : 'Löschen fehlgeschlagen.');
    }
  };

  const cancelBooking = async (b: Booking) => {
    if (!(await confirmAction('Buchung stornieren?', `${b.childName} (${b.parentName}) – der Platz wird wieder frei.`, 'Stornieren'))) return;
    try {
      await api.adminCancelBooking(b.id);
      await load();
    } catch (e) {
      notify('Fehler', e instanceof Error ? e.message : 'Stornierung fehlgeschlagen.');
    }
  };

  const signOut = async () => {
    await api.adminSignOut();
    onSignOut();
  };

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}
      footer={<Button title="+ Neue Termine anlegen" onPress={() => router.push('/admin/neu')} />}>
      <View style={styles.statsRow}>
        <Stat label="Termine" value={stats.slots} />
        <Stat label="Gebucht" value={stats.booked} />
        <Stat label="Frei" value={stats.free} />
        <Stat label="Auslastung" value={`${stats.utilization}%`} />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
        <Chip label="Kommende" selected={filter === 'upcoming'} onPress={() => setFilter('upcoming')} />
        <Chip label="Mit Buchung" selected={filter === 'booked'} onPress={() => setFilter('booked')} />
        <Chip label="Noch frei" selected={filter === 'free'} onPress={() => setFilter('free')} />
        <Chip label="Vergangene" selected={filter === 'past'} onPress={() => setFilter('past')} />
      </View>

      {error ? <Notice tone="error">{error}</Notice> : null}
      {slots === null && !error ? <Loading /> : null}
      {slots !== null && grouped.length === 0 ? (
        <Card>
          <T variant="muted">Keine Termine in dieser Ansicht. Lege neue Termine über den Button unten an.</T>
        </Card>
      ) : null}

      {grouped.map((daySlots) => (
        <View key={daySlots[0].id} style={{ gap: Spacing.sm }}>
          <T variant="label">{formatDay(daySlots[0].startsAt)}</T>
          {daySlots.map((slot) => {
            const isOpen = expanded === slot.id;
            const full = slot.bookedCount >= slot.capacity;
            const active = slot.bookings.filter((b) => b.status === 'confirmed');
            const cancelled = slot.bookings.filter((b) => b.status === 'cancelled');
            return (
              <Card key={slot.id} style={{ padding: 0, gap: 0 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}
                  onPress={() => setExpanded(isOpen ? null : slot.id)}
                  style={styles.slotHeader}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <T variant="heading">{formatTimeRange(slot.startsAt, slot.durationMinutes)}</T>
                    <T variant="small">
                      {active.length > 0 ? active.map((b) => b.childName).join(', ') : 'Noch keine Buchung'}
                    </T>
                  </View>
                  <Badge
                    label={`${slot.bookedCount}/${slot.capacity}`}
                    tone={full ? 'primary' : slot.bookedCount > 0 ? 'success' : 'neutral'}
                  />
                </Pressable>

                {isOpen ? (
                  <View style={[styles.slotBody, { borderTopColor: c.border }]}>
                    {slot.note ? <T variant="small">Notiz: {slot.note}</T> : null}
                    {active.map((b) => (
                      <BookingDetails key={b.id} booking={b} onCancel={() => cancelBooking(b)} />
                    ))}
                    {cancelled.length > 0 ? (
                      <T variant="small">Storniert: {cancelled.map((b) => b.childName).join(', ')}</T>
                    ) : null}
                    <Button title="Termin löschen" variant="danger" onPress={() => deleteSlot(slot)} />
                  </View>
                ) : null}
              </Card>
            );
          })}
        </View>
      ))}

      <Button title="Abmelden" variant="ghost" onPress={signOut} />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  const c = usePalette();
  return (
    <View style={[styles.stat, { backgroundColor: c.card, borderColor: c.border }]}>
      <T variant="heading">{String(value)}</T>
      <T variant="small">{label}</T>
    </View>
  );
}

function BookingDetails({ booking: b, onCancel }: { booking: Booking; onCancel: () => void }) {
  const c = usePalette();
  return (
    <View style={[styles.booking, { backgroundColor: c.background }]}>
      <T variant="label">
        {b.childName}
        {b.gradeLevel ? ` · Klasse ${b.gradeLevel}` : ''}
      </T>
      {b.focusArea ? <T variant="small">Förderbereich: {b.focusArea}</T> : null}
      <T variant="small">Eltern: {b.parentName}</T>
      <T variant="small" color={c.primary}>
        {b.email}
      </T>
      {b.phone ? <T variant="small">Tel.: {b.phone}</T> : null}
      {b.message ? <T variant="small">„{b.message}“</T> : null}
      <T variant="small">Code: {b.code}</T>
      <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' }}>
        <Chip label="E-Mail" onPress={() => Linking.openURL(`mailto:${b.email}`)} />
        {b.phone ? <Chip label="Anrufen" onPress={() => Linking.openURL(`tel:${b.phone.replace(/\s/g, '')}`)} /> : null}
        <Chip label="Stornieren" onPress={onCancel} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  stat: { flex: 1, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  slotHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  slotBody: { borderTopWidth: StyleSheet.hairlineWidth, padding: Spacing.lg, gap: Spacing.md },
  booking: { borderRadius: Radius.md, padding: Spacing.md, gap: 4 },
});
