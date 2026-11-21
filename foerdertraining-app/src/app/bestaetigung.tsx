import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Share, View } from 'react-native';

import { Button, Card, Screen, T } from '@/components/ui';
import { Radius, Spacing, usePalette } from '@/constants/theme';
import { AppConfig } from '@/lib/config';
import { formatDay, formatTimeRange } from '@/lib/date';

export default function Confirmation() {
  const c = usePalette();
  const [copied, setCopied] = useState(false);
  const p = useLocalSearchParams<{
    code: string;
    startsAt: string;
    duration: string;
    location: string;
    childName: string;
    email: string;
  }>();

  const when = p.startsAt ? `${formatDay(p.startsAt)}, ${formatTimeRange(p.startsAt, Number(p.duration))}` : '';
  const where = p.location || AppConfig.defaultLocation;

  const summary =
    `Fördertraining für ${p.childName}\n${when}\nOrt: ${where}\n` +
    `Buchungscode: ${p.code}\n\nÄnderungen/Stornierung bis ${AppConfig.cancellationHours} Std. vorher über die App ` +
    `(Buchungscode + E-Mail) oder per E-Mail an ${AppConfig.contactEmail}.`;

  const copy = async () => {
    await Clipboard.setStringAsync(p.code ?? '');
    setCopied(true);
  };

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.lg }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.successSoft, alignItems: 'center', justifyContent: 'center' }}>
          <T variant="title" color={c.success}>
            ✓
          </T>
        </View>
        <T variant="title" center>
          Termin gebucht!
        </T>
        <T variant="muted" center>
          Vielen Dank. Der Platz für {p.childName} ist verbindlich für Sie reserviert.
        </T>
      </View>

      <Card>
        <T variant="small">TERMIN</T>
        <T variant="heading">{when}</T>
        <T variant="small">{where}</T>
      </Card>

      <Card style={{ alignItems: 'center' }}>
        <T variant="small">IHR BUCHUNGSCODE</T>
        <View style={{ backgroundColor: c.primarySoft, borderRadius: Radius.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl }}>
          <T variant="title" color={c.primary} style={{ letterSpacing: 4, fontVariant: ['tabular-nums'] }}>
            {p.code}
          </T>
        </View>
        <T variant="small" center>
          Bitte notieren Sie den Code. Sie benötigen ihn zusammen mit Ihrer E-Mail ({p.email}), um den Termin zu
          verwalten oder zu stornieren.
        </T>
        <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button title={copied ? 'Kopiert ✓' : 'Code kopieren'} variant="secondary" onPress={copy} />
          <Button title="Teilen / Speichern" variant="secondary" onPress={() => Share.share({ message: summary })} />
        </View>
      </Card>

      <Button title="Fertig" onPress={() => router.dismissTo('/')} />
    </Screen>
  );
}
