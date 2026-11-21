import { useState } from 'react';
import { View } from 'react-native';

import { Badge, Button, Card, Field, Notice, Screen, T } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { api, type BookingLookup } from '@/lib/api';
import { AppConfig } from '@/lib/config';
import { confirmAction } from '@/lib/confirm';
import { formatDay, formatTimeRange } from '@/lib/date';

export default function ManageBooking() {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [booking, setBooking] = useState<BookingLookup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const lookup = async () => {
    setError(null);
    setSuccess(null);
    setBooking(null);
    if (!code.trim() || !email.trim()) {
      setError('Bitte Buchungscode und E-Mail-Adresse eingeben.');
      return;
    }
    setLoading(true);
    try {
      const b = await api.lookupBooking(code, email);
      if (!b) setError('Keine Buchung zu diesem Code und dieser E-Mail-Adresse gefunden.');
      setBooking(b);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler bei der Suche.');
    } finally {
      setLoading(false);
    }
  };

  const cancel = async () => {
    if (!booking) return;
    const ok = await confirmAction(
      'Termin stornieren?',
      `${formatDay(booking.startsAt)}, ${formatTimeRange(booking.startsAt, booking.durationMinutes)} wird freigegeben.`,
      'Stornieren',
    );
    if (!ok) return;
    setLoading(true);
    setError(null);
    try {
      await api.cancelBooking(code, email);
      setBooking({ ...booking, status: 'cancelled' });
      setSuccess('Ihr Termin wurde storniert. Der Platz ist wieder für andere Familien frei.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Stornierung fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <T variant="muted">
        Geben Sie Ihren Buchungscode und die bei der Buchung verwendete E-Mail-Adresse ein. Eine Stornierung ist bis{' '}
        {AppConfig.cancellationHours} Stunden vor dem Termin online möglich.
      </T>
      <View style={{ gap: Spacing.md }}>
        <Field
          label="Buchungscode"
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="z. B. 7KQ2M9XA"
          maxLength={12}
        />
        <Field
          label="E-Mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <Button title="Buchung suchen" onPress={lookup} loading={loading && !booking} />
      </View>

      {error ? <Notice tone="error">{error}</Notice> : null}
      {success ? <Notice tone="success">{success}</Notice> : null}

      {booking ? (
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <T variant="heading">Fördertraining für {booking.childName}</T>
            <Badge
              label={booking.status === 'confirmed' ? 'Bestätigt' : 'Storniert'}
              tone={booking.status === 'confirmed' ? 'success' : 'danger'}
            />
          </View>
          <T>
            {formatDay(booking.startsAt)}, {formatTimeRange(booking.startsAt, booking.durationMinutes)}
          </T>
          <T variant="small">{booking.location ?? AppConfig.defaultLocation}</T>
          {booking.status === 'confirmed' ? (
            <Button title="Termin stornieren" variant="danger" onPress={cancel} loading={loading} />
          ) : null}
        </Card>
      ) : null}

      <T variant="small" center>
        Fragen? {AppConfig.contactEmail}
        {AppConfig.contactPhone ? ` · ${AppConfig.contactPhone}` : ''}
      </T>
    </Screen>
  );
}
