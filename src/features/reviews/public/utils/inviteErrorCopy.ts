export type PublicReviewInviteErrorReason =
  | 'invalid_token'
  | 'not_found'
  | 'expired'
  | 'already_submitted';

export function publicReviewInviteErrorCopy(
  reason: PublicReviewInviteErrorReason
): { title: string; detail: string } {
  switch (reason) {
    case 'expired':
      return {
        title: 'Link expired',
        detail:
          'This review link is no longer valid. Contact the business if you still want to share feedback.',
      };
    case 'already_submitted':
      return {
        title: 'Already submitted',
        detail: 'Thank you — your review for this visit was already received.',
      };
    default:
      return {
        title: 'Link not found',
        detail: 'This review link is invalid or has already been used.',
      };
  }
}
