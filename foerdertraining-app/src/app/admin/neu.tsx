import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button, Chip, Field, Notice, Screen, T } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { AppConfig } from '@/lib/config';
import { addDays, combineDayAndTime, dayKey, formatShortDay, startOfToday } from '@/lib/date';
import type { NewSlotInput } from '@/lib/types';

const DURATIONS = [30, 45, 60, 90];
const CAPACITIES = [1, 2, 3, 4, 6];
const REPEATS = [1, 2, 4, 8, 12];
const QUICK_TIMES = ['14:00', '15:00', '16:00', '17:00', '18:00'];

export default function NewSlots() {
  const days = useMemo(() => Array.from({ length: 42 }, (_, i) => addDays(startOfToday(), i)), []);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [times, setTimes] = useState<string[]>(['15:00']);
  const [customTime, setCustomTime] = useState('');
  const [duration, setDuration] = useState<number>(AppConfig.defaultDurationMinutes);
  const [capacity, setCapacity] = useState(1);
  const [repeatWeeks, setRepeatWeeks] = useState(1);
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [now] = useState(() => Date.now());

  const toggleDay = (k: string) =>
    setSelectedDays((d) => (d.includes(k) ? d.filter((x) => x !== k) : [...d, k]));
  const toggleTime = (t: string) =>
    setTimes((ts) => (ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t].sort()));

  const addCustomTime = () => {
    const t = customTime.trim().replace('.', ':');
    if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(t)) {
      setError('Uhrzeit bitte im Format HH:MM angeben, z. B. 16:30.');
      return;
    }
    const norm = t.padStart(5, '0');
    setError(null);
    if (!times.includes(norm)) setTimes([...times, norm].sort());
    setCustomTime('');
  };

  const slotsToCreate: NewSlotInput[] = useMemo(() => {
    const out: NewSlotInput[] = [];
    for (const k of selectedDays) {
      const base = days.find((d) => dayKey(d) === k);
      if (!base) continue;
      for (let w = 0; w < repeatWeeks; w++) {
        const day = addDays(base, w * 7);
        for (const t of times) {
          const iso = combineDayAndTime(day, t);
          if (!iso || new Date(iso).getTime() <= now) continue;
          out.push({
            startsAt: iso,
            durationMinutes: duration,
            capacity,
            location: location.trim() || null,
            note: note.trim() || null,
          });
        }
      }
    }
    return out.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }, [selectedDays, times, repeatWeeks, duration, capacity, location, note, days, now]);

  const save = async () => {
    if (slotsToCreate.length === 0) {
      setError('Bitte mindestens einen Tag und eine Uhrzeit in der Zukunft wählen.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.adminCreateSlots(slotsToCreate);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      footer={
        <Button
          title={slotsToCreate.length ? `${slotsToCreate.length} Termin(e) freischalten` : 'Termine freischalten'}
          onPress={save}
          loading={saving}
          disabled={slotsToCreate.length === 0}
        />
      }>
      <View style={{ gap: Spacing.sm }}>
        <T variant="label">Tage (Mehrfachauswahl)</T>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
          {days.map((d) => {
            const k = dayKey(d);
            const f = formatShortDay(d);
            return (
              <Chip
                key={k}
                label={`${f.weekday} ${f.day}.`}
                sublabel={f.month}
                selected={selectedDays.includes(k)}
                onPress={() => toggleDay(k)}
              />
            );
          })}
        </ScrollView>
      </View>

      <View style={{ gap: Spacing.sm }}>
        <T variant="label">Uhrzeiten (Beginn)</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          {[...new Set([...QUICK_TIMES, ...times])].sort().map((t) => (
            <Chip key={t} label={t} selected={times.includes(t)} onPress={() => toggleTime(t)} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}>
            <Field label="Weitere Uhrzeit" value={customTime} onChangeText={setCustomTime} placeholder="z. B. 16:30" onSubmitEditing={addCustomTime} />
          </View>
          <Button title="Hinzufügen" variant="secondary" onPress={addCustomTime} />
        </View>
      </View>

      <View style={{ gap: Spacing.sm }}>
        <T variant="label">Dauer</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          {DURATIONS.map((d) => (
            <Chip key={d} label={`${d} Min.`} selected={duration === d} onPress={() => setDuration(d)} />
          ))}
        </View>
      </View>

      <View style={{ gap: Spacing.sm }}>
        <T variant="label">Plätze pro Termin</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          {CAPACITIES.map((n) => (
            <Chip key={n} label={n === 1 ? 'Einzel' : `${n} Kinder`} selected={capacity === n} onPress={() => setCapacity(n)} />
          ))}
        </View>
      </View>

      <View style={{ gap: Spacing.sm }}>
        <T variant="label">Wöchentlich wiederholen</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          {REPEATS.map((n) => (
            <Chip key={n} label={n === 1 ? 'Einmalig' : `${n} Wochen`} selected={repeatWeeks === n} onPress={() => setRepeatWeeks(n)} />
          ))}
        </View>
      </View>

      <Field label="Ort (optional)" value={location} onChangeText={setLocation} placeholder={AppConfig.defaultLocation} />
      <Field label="Hinweis für Eltern (optional)" value={note} onChangeText={setNote} placeholder="z. B. Kleingruppe, Online via Zoom" />

      {error ? <Notice tone="error">{error}</Notice> : null}
      {slotsToCreate.length > 0 ? (
        <Notice>{`Vorschau: ${slotsToCreate.length} Termin(e) werden angelegt.`}</Notice>
      ) : null}
    </Screen>
  );
}
