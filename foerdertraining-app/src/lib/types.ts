/** Ein buchbarer Termin. Öffentlich sichtbar – enthält KEINE personenbezogenen Daten. */
export type Slot = {
  id: string;
  /** ISO-Zeitstempel Beginn */
  startsAt: string;
  durationMinutes: number;
  /** Plätze insgesamt (1 = Einzeltraining, >1 = Kleingruppe) */
  capacity: number;
  /** Bereits gebuchte Plätze */
  bookedCount: number;
  location: string | null;
  note: string | null;
};

/** Eingaben der Eltern im Buchungsformular */
export type BookingInput = {
  slotId: string;
  parentName: string;
  email: string;
  phone: string;
  childName: string;
  gradeLevel: string;
  focusArea: string;
  message: string;
  privacyAccepted: boolean;
};

/** Buchung inkl. personenbezogener Daten – nur für den Trainer sichtbar */
export type Booking = {
  id: string;
  slotId: string;
  code: string;
  parentName: string;
  email: string;
  phone: string;
  childName: string;
  gradeLevel: string;
  focusArea: string;
  message: string;
  status: 'confirmed' | 'cancelled';
  createdAt: string;
};

export type BookingResult = {
  code: string;
  slot: Slot;
};

export type NewSlotInput = {
  startsAt: string;
  durationMinutes: number;
  capacity: number;
  location: string | null;
  note: string | null;
};

export class BookingError extends Error {
  constructor(
    public reason:
      | 'slot_full'
      | 'slot_not_found'
      | 'slot_in_past'
      | 'invalid_input'
      | 'booking_not_found'
      | 'too_late_to_cancel'
      | 'unknown',
    message: string,
  ) {
    super(message);
  }
}
