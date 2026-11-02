export type BookingAssigneeKind = 'owner' | 'member' | 'former';

/** Someone who can be put on a booking (shop owner or an active teammate). */
export type BookingAssigneeOption = {
  userId: string;
  label: string;
  kind: BookingAssigneeKind;
};
