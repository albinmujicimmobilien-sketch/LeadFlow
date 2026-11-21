import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Text, View } from 'react-native';

import { Button, Card, Checkbox, Chip, Field, Loading, Notice, Screen, T } from '@/components/ui';
import { Spacing, usePalette } from '@/constants/theme';
import { api } from '@/lib/api';
import { AppConfig } from '@/lib/config';
import { formatDay, formatTimeRange } from '@/lib/date';
import { BookingError, type Slot } from '@/lib/types';

type Errors = Partial<Record<'parentName' | 'email' | 'phone' | 'childName' | 'privacy', string>>;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function BookSlot() {
  const c = usePalette();
  const { slotId } = useLocalSearchParams<{ slotId: string }>();
  const [slot, setSlot] = useState<Slot | null | undefined>(undefined);

  const [parentName, setParentName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [childName, setChildName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [focusArea, setFocusArea] = useState('');
  const [message, setMessage] = useState('');
  const [privacy, setPrivacy] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .listOpenSlots()
      .then((all) => setSlot(all.find((s) => s.id === slotId) ?? null))
      .catch(() => setSlot(null));
  }, [slotId]);

  const validate = (): boolean => {
    const e: Errors = {};
    if (parentName.trim().length < 2) e.parentName = 'Bitte geben Sie Ihren Namen an.';
    if (!EMAIL_RE.test(email.trim())) e.email = 'Bitte geben Sie eine gültige E-Mail-Adresse an.';
    if (phone.trim() && !/^[+\d\s()/-]{6,}$/.test(phone.trim())) e.phone = 'Bitte prüfen Sie die Telefonnummer.';
    if (!childName.trim()) e.childName = 'Bitte geben Sie den Vornamen Ihres Kindes an.';
    if (!privacy) e.privacy = 'Bitte bestätigen Sie die Datenschutzhinweise.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    setSubmitError(null);
    if (!validate() || !slot) return;
    setSubmitting(true);
    try {
      const result = await api.book({
        slotId: slot.id,
        parentName,
        email,
        phone,
        childName,
        gradeLevel,
        focusArea,
        message,
        privacyAccepted: privacy,
      });
      router.replace({
        pathname: '/bestaetigung',
        params: {
          code: result.code,
          startsAt: result.slot.startsAt,
          duration: String(result.slot.durationMinutes),
          location: result.slot.location ?? '',
          childName: childName.trim(),
          email: email.trim(),
        },
      });
    } catch (e) {
      setSubmitError(e instanceof BookingError || e instanceof Error ? e.message : 'Unbekannter Fehler');
      if (e instanceof BookingError && e.reason === 'slot_full') setSlot(null);
    } finally {
      setSubmitting(false);
    }
  };

  if (slot === undefined) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  if (slot === null || slot.bookedCount >= slot.capacity) {
    return (
      <Screen>
        {submitError ? <Notice tone="error">{submitError}</Notice> : null}
        <Card>
          <T variant="heading">Termin nicht mehr verfügbar</T>
          <T variant="muted">Dieser Termin wurde inzwischen vergeben oder entfernt. Bitte wählen Sie einen anderen.</T>
          <Button title="Zu den freien Terminen" onPress={() => router.replace('/')} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      footer={<Button title="Verbindlich buchen" onPress={submit} loading={submitting} />}>
      <Card style={{ backgroundColor: c.primarySoft, borderColor: c.primarySoft }}>
        <T variant="small" color={c.primary}>
          IHR GEWÄHLTER TERMIN
        </T>
        <T variant="heading">{formatDay(slot.startsAt)}</T>
        <T>{formatTimeRange(slot.startsAt, slot.durationMinutes)}</T>
        <T variant="small">{slot.location ?? AppConfig.defaultLocation}</T>
        {slot.note ? <T variant="small">{slot.note}</T> : null}
      </Card>

      <View style={{ gap: Spacing.md }}>
        <T variant="heading">Ihre Kontaktdaten</T>
        <Field
          label="Ihr Name"
          required
          value={parentName}
          onChangeText={setParentName}
          autoComplete="name"
          textContentType="name"
          placeholder="Vor- und Nachname"
          error={errors.parentName}
        />
        <Field
          label="E-Mail"
          required
          value={email}
          onChangeText={setEmail}
          autoComplete="email"
          keyboardType="email-address"
          autoCapitalize="none"
          textContentType="emailAddress"
          placeholder="name@beispiel.de"
          error={errors.email}
          hint="Wird zusammen mit dem Buchungscode für Änderungen benötigt."
        />
        <Field
          label="Telefon (optional)"
          value={phone}
          onChangeText={setPhone}
          autoComplete="tel"
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          placeholder="Für kurzfristige Rückfragen"
          error={errors.phone}
        />
      </View>

      <View style={{ gap: Spacing.md }}>
        <T variant="heading">Angaben zum Kind</T>
        <Field
          label="Vorname des Kindes"
          required
          value={childName}
          onChangeText={setChildName}
          placeholder="z. B. Lena"
          error={errors.childName}
        />
        <View style={{ gap: Spacing.sm }}>
          <T variant="label">Klassenstufe</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            {AppConfig.gradeLevels.map((g) => (
              <Chip key={g} label={g} selected={gradeLevel === g} onPress={() => setGradeLevel(gradeLevel === g ? '' : g)} />
            ))}
          </View>
        </View>
        <View style={{ gap: Spacing.sm }}>
          <T variant="label">Förderbereich</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            {AppConfig.focusAreas.map((f) => (
              <Chip key={f} label={f} selected={focusArea === f} onPress={() => setFocusArea(focusArea === f ? '' : f)} />
            ))}
          </View>
        </View>
        <Field
          label="Nachricht (optional)"
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={1000}
          placeholder="Was sollen wir vorab wissen?"
          hint="Bitte keine Gesundheitsdaten oder Diagnosen eintragen – das besprechen wir persönlich."
        />
      </View>

      <Checkbox checked={privacy} onChange={setPrivacy} error={errors.privacy}>
        <T variant="small" color={c.text}>
          Ich habe die{' '}
          <Text
            style={{ color: c.primary, textDecorationLine: 'underline' }}
            onPress={() => Linking.openURL(AppConfig.privacyUrl)}>
            Datenschutzhinweise
          </Text>{' '}
          gelesen und bin einverstanden, dass meine Angaben zur Terminvereinbarung und Durchführung des
          Fördertrainings verarbeitet werden. *
        </T>
      </Checkbox>

      {submitError ? <Notice tone="error">{submitError}</Notice> : null}
    </Screen>
  );
}
