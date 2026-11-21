import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { AppConfig } from './config';
import { addDays, startOfToday } from './date';
import {
  BookingError,
  type Booking,
  type BookingInput,
  type BookingResult,
  type NewSlotInput,
  type Slot,
} from './types';

export type SlotWithBookings = Slot & { bookings: Booking[] };

export type BookingLookup = {
  code: string;
  childName: string;
  status: 'confirmed' | 'cancelled';
  startsAt: string;
  durationMinutes: number;
  location: string | null;
};

export interface BookingApi {
  mode: 'demo' | 'live';
  // ---- Eltern (öffentlich) ----
  listOpenSlots(): Promise<Slot[]>;
  book(input: BookingInput): Promise<BookingResult>;
  lookupBooking(code: string, email: string): Promise<BookingLookup | null>;
  cancelBooking(code: string, email: string): Promise<void>;
  // ---- Trainer (geschützt) ----
  adminSignIn(email: string, passwordOrPin: string): Promise<void>;
  adminSignOut(): Promise<void>;
  adminIsSignedIn(): Promise<boolean>;
  adminListSlots(): Promise<SlotWithBookings[]>;
  adminCreateSlots(inputs: NewSlotInput[]): Promise<number>;
  adminDeleteSlot(slotId: string): Promise<void>;
  adminCancelBooking(bookingId: string): Promise<void>;
}

const KNOWN_REASONS = [
  'slot_full',
  'slot_not_found',
  'slot_in_past',
  'invalid_input',
  'booking_not_found',
  'too_late_to_cancel',
] as const;

const REASON_TEXT: Record<BookingError['reason'], string> = {
  slot_full: 'Dieser Termin wurde soeben vergeben. Bitte wählen Sie einen anderen.',
  slot_not_found: 'Der Termin existiert nicht mehr.',
  slot_in_past: 'Dieser Termin liegt in der Vergangenheit.',
  invalid_input: 'Bitte prüfen Sie Ihre Eingaben.',
  booking_not_found: 'Keine aktive Buchung zu Code und E-Mail gefunden.',
  too_late_to_cancel: `Eine Online-Stornierung ist nur bis ${AppConfig.cancellationHours} Stunden vor dem Termin möglich. Bitte kontaktieren Sie uns direkt.`,
  unknown: 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
};

function fail(reason: BookingError['reason'], detail?: string): never {
  let text = REASON_TEXT[reason];
  if (reason === 'invalid_input' && detail?.includes('duplicate')) {
    text = 'Für dieses Kind besteht bereits eine Buchung zu diesem Termin.';
  }
  throw new BookingError(reason, text);
}

function toBookingError(message: string | undefined): never {
  const reason = KNOWN_REASONS.find((r) => message?.includes(r));
  fail(reason ?? 'unknown', message);
}

// =====================================================================
// LIVE: Supabase
// =====================================================================

type DbSlot = {
  id: string;
  starts_at: string;
  duration_minutes: number;
  capacity: number;
  booked_count?: number;
  location: string | null;
  note: string | null;
};

type DbBooking = {
  id: string;
  slot_id: string;
  code: string;
  parent_name: string;
  email: string;
  phone: string;
  child_name: string;
  grade_level: string;
  focus_area: string;
  message: string;
  status: 'confirmed' | 'cancelled';
  created_at: string;
};

const mapSlot = (s: DbSlot, bookedCount = s.booked_count ?? 0): Slot => ({
  id: s.id,
  startsAt: s.starts_at,
  durationMinutes: s.duration_minutes,
  capacity: s.capacity,
  bookedCount,
  location: s.location,
  note: s.note,
});

const mapBooking = (b: DbBooking): Booking => ({
  id: b.id,
  slotId: b.slot_id,
  code: b.code,
  parentName: b.parent_name,
  email: b.email,
  phone: b.phone,
  childName: b.child_name,
  gradeLevel: b.grade_level,
  focusArea: b.focus_area,
  message: b.message,
  status: b.status,
  createdAt: b.created_at,
});

function createSupabaseApi(url: string, key: string): BookingApi {
  const supabase: SupabaseClient = createClient(url, key, {
    auth: {
      // Web nutzt localStorage, native Apps AsyncStorage
      storage: Platform.OS === 'web' ? undefined : AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return {
    mode: 'live',

    async listOpenSlots() {
      const { data, error } = await supabase.rpc('get_open_slots');
      if (error) toBookingError(error.message);
      return (data as DbSlot[]).map((s) => mapSlot(s));
    },

    async book(input) {
      const { data, error } = await supabase.rpc('book_slot', {
        p_slot_id: input.slotId,
        p_parent_name: input.parentName,
        p_email: input.email,
        p_phone: input.phone,
        p_child_name: input.childName,
        p_grade_level: input.gradeLevel,
        p_focus_area: input.focusArea,
        p_message: input.message,
        p_privacy_accepted: input.privacyAccepted,
      });
      if (error) toBookingError(error.message);
      const slots = await this.listOpenSlots();
      const slot = slots.find((s) => s.id === input.slotId);
      if (!slot) fail('slot_not_found');
      return { code: data as string, slot };
    },

    async lookupBooking(code, email) {
      const { data, error } = await supabase.rpc('lookup_booking', { p_code: code, p_email: email });
      if (error) toBookingError(error.message);
      const row = (data as any[])[0];
      if (!row) return null;
      return {
        code: row.code,
        childName: row.child_name,
        status: row.status,
        startsAt: row.starts_at,
        durationMinutes: row.duration_minutes,
        location: row.location,
      };
    },

    async cancelBooking(code, email) {
      const { error } = await supabase.rpc('cancel_booking', { p_code: code, p_email: email });
      if (error) toBookingError(error.message);
    },

    async adminSignIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error('Login fehlgeschlagen. Bitte E-Mail und Passwort prüfen.');
      const { data } = await supabase.rpc('is_admin');
      if (!data) {
        await supabase.auth.signOut();
        throw new Error('Dieses Konto ist nicht als Trainer freigeschaltet.');
      }
    },

    async adminSignOut() {
      await supabase.auth.signOut();
    },

    async adminIsSignedIn() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return false;
      const { data: isAdmin } = await supabase.rpc('is_admin');
      return Boolean(isAdmin);
    },

    async adminListSlots() {
      const since = addDays(startOfToday(), -7).toISOString();
      const { data: slots, error } = await supabase
        .from('slots')
        .select('*, bookings(*)')
        .gte('starts_at', since)
        .order('starts_at');
      if (error) throw new Error(error.message);
      return (slots as (DbSlot & { bookings: DbBooking[] })[]).map((s) => {
        const bookings = s.bookings.map(mapBooking);
        return {
          ...mapSlot(s, bookings.filter((b) => b.status === 'confirmed').length),
          bookings,
        };
      });
    },

    async adminCreateSlots(inputs) {
      const { error } = await supabase.from('slots').insert(
        inputs.map((i) => ({
          starts_at: i.startsAt,
          duration_minutes: i.durationMinutes,
          capacity: i.capacity,
          location: i.location,
          note: i.note,
        })),
      );
      if (error) throw new Error(error.message);
      return inputs.length;
    },

    async adminDeleteSlot(slotId) {
      const { error } = await supabase.from('slots').delete().eq('id', slotId);
      if (error) throw new Error(error.message);
    },

    async adminCancelBooking(bookingId) {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', bookingId);
      if (error) throw new Error(error.message);
    },
  };
}

// =====================================================================
// DEMO: lokal auf dem Gerät (zum Ausprobieren ohne Backend)
// Achtung: Daten sind NICHT zwischen Geräten geteilt!
// =====================================================================

const DEMO_KEY = 'foerdertraining-demo-v1';
type DemoState = { slots: Slot[]; bookings: Booking[]; adminSignedIn: boolean };

function randomId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function randomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

function seedDemo(): DemoState {
  const slots: Slot[] = [];
  const today = startOfToday();
  for (let i = 1; i <= 14; i++) {
    const day = addDays(today, i);
    const weekday = day.getDay();
    if (weekday === 0 || weekday === 6) continue; // Wochenende frei
    for (const hour of [14, 15, 16, 17]) {
      if ((i + hour) % 3 === 0) continue; // etwas Abwechslung
      const d = new Date(day);
      d.setHours(hour, 0, 0, 0);
      slots.push({
        id: randomId(),
        startsAt: d.toISOString(),
        durationMinutes: AppConfig.defaultDurationMinutes,
        capacity: hour === 17 ? 3 : 1,
        bookedCount: 0,
        location: null,
        note: hour === 17 ? 'Kleingruppe (max. 3 Kinder)' : null,
      });
    }
  }
  return { slots, bookings: [], adminSignedIn: false };
}

function createDemoApi(): BookingApi {
  let cache: DemoState | null = null;

  async function load(): Promise<DemoState> {
    if (cache) return cache;
    try {
      const raw = await AsyncStorage.getItem(DEMO_KEY);
      cache = raw ? (JSON.parse(raw) as DemoState) : seedDemo();
    } catch {
      cache = seedDemo();
    }
    return cache;
  }

  async function save(state: DemoState) {
    cache = state;
    try {
      await AsyncStorage.setItem(DEMO_KEY, JSON.stringify(state));
    } catch {
      // Speicher nicht verfügbar (z. B. privater Modus) – Daten bleiben im Speicher
    }
  }

  const countFor = (s: DemoState, slotId: string) =>
    s.bookings.filter((b) => b.slotId === slotId && b.status === 'confirmed').length;

  const withCounts = (s: DemoState) =>
    s.slots.map((slot) => ({ ...slot, bookedCount: countFor(s, slot.id) }));

  const delay = () => new Promise((r) => setTimeout(r, 250));

  return {
    mode: 'demo',

    async listOpenSlots() {
      await delay();
      const s = await load();
      const now = Date.now();
      return withCounts(s)
        .filter((slot) => new Date(slot.startsAt).getTime() > now)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    },

    async book(input) {
      await delay();
      const s = await load();
      const slot = s.slots.find((x) => x.id === input.slotId);
      if (!slot) fail('slot_not_found');
      if (new Date(slot.startsAt).getTime() <= Date.now()) fail('slot_in_past');
      if (!input.privacyAccepted) fail('invalid_input');
      if (countFor(s, slot.id) >= slot.capacity) fail('slot_full');
      const duplicate = s.bookings.some(
        (b) =>
          b.slotId === slot.id &&
          b.status === 'confirmed' &&
          b.email === input.email.trim().toLowerCase() &&
          b.childName.toLowerCase() === input.childName.trim().toLowerCase(),
      );
      if (duplicate) fail('invalid_input', 'duplicate');

      const booking: Booking = {
        id: randomId(),
        slotId: slot.id,
        code: randomCode(),
        parentName: input.parentName.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone.trim(),
        childName: input.childName.trim(),
        gradeLevel: input.gradeLevel,
        focusArea: input.focusArea,
        message: input.message.trim(),
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      };
      const next = { ...s, bookings: [...s.bookings, booking] };
      await save(next);
      return { code: booking.code, slot: { ...slot, bookedCount: countFor(next, slot.id) } };
    },

    async lookupBooking(code, email) {
      await delay();
      const s = await load();
      const b = s.bookings.find(
        (x) => x.code === code.trim().toUpperCase() && x.email === email.trim().toLowerCase(),
      );
      if (!b) return null;
      const slot = s.slots.find((x) => x.id === b.slotId);
      if (!slot) return null;
      return {
        code: b.code,
        childName: b.childName,
        status: b.status,
        startsAt: slot.startsAt,
        durationMinutes: slot.durationMinutes,
        location: slot.location,
      };
    },

    async cancelBooking(code, email) {
      await delay();
      const s = await load();
      const b = s.bookings.find(
        (x) =>
          x.code === code.trim().toUpperCase() &&
          x.email === email.trim().toLowerCase() &&
          x.status === 'confirmed',
      );
      if (!b) fail('booking_not_found');
      const slot = s.slots.find((x) => x.id === b.slotId);
      if (slot && new Date(slot.startsAt).getTime() - Date.now() < AppConfig.cancellationHours * 3600_000) {
        fail('too_late_to_cancel');
      }
      await save({
        ...s,
        bookings: s.bookings.map((x) => (x.id === b.id ? { ...x, status: 'cancelled' } : x)),
      });
    },

    async adminSignIn(_email, pin) {
      if (pin !== AppConfig.demoAdminPin) throw new Error('Falsche PIN.');
      const s = await load();
      await save({ ...s, adminSignedIn: true });
    },

    async adminSignOut() {
      const s = await load();
      await save({ ...s, adminSignedIn: false });
    },

    async adminIsSignedIn() {
      return (await load()).adminSignedIn;
    },

    async adminListSlots() {
      await delay();
      const s = await load();
      const since = addDays(startOfToday(), -7).getTime();
      return withCounts(s)
        .filter((slot) => new Date(slot.startsAt).getTime() >= since)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
        .map((slot) => ({ ...slot, bookings: s.bookings.filter((b) => b.slotId === slot.id) }));
    },

    async adminCreateSlots(inputs) {
      const s = await load();
      const created: Slot[] = inputs.map((i) => ({ ...i, id: randomId(), bookedCount: 0 }));
      await save({ ...s, slots: [...s.slots, ...created] });
      return created.length;
    },

    async adminDeleteSlot(slotId) {
      const s = await load();
      await save({
        ...s,
        slots: s.slots.filter((x) => x.id !== slotId),
        bookings: s.bookings.filter((b) => b.slotId !== slotId),
      });
    },

    async adminCancelBooking(bookingId) {
      const s = await load();
      await save({
        ...s,
        bookings: s.bookings.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b)),
      });
    },
  };
}

// =====================================================================

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const api: BookingApi =
  SUPABASE_URL && SUPABASE_KEY ? createSupabaseApi(SUPABASE_URL, SUPABASE_KEY) : createDemoApi();
