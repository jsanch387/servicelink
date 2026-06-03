/** Customer-facing review page copy — first-person, owner/detailer voice. */

export function reviewPageTitle(): string {
  return 'How did we do?';
}

export function reviewPageSubtitle(businessName: string): string {
  const name = businessName.trim() || 'us';
  return `${name} would love to hear about your visit — it only takes a minute.`;
}

export function reviewFormIntro({
  greetingName,
  businessName,
  serviceName,
}: {
  greetingName: string;
  businessName: string;
  serviceName: string;
}): string {
  const hi = greetingName.trim() || 'there';
  const shop = businessName.trim() || 'us';
  const service = serviceName.trim() || 'your appointment';

  return `Hey ${hi} — thanks again for choosing ${shop}. We just finished your ${service}, and we'd honestly love to know how it turned out.`;
}

export function reviewFormVisitSectionTitle(): string {
  return 'Your visit';
}

export function reviewFormRatingPrompt(): string {
  return 'Tap a star — it really helps us out';
}

export function reviewFormCommentLabel(): string {
  return 'Want to say more? (optional)';
}

export function reviewFormCommentPlaceholder(): string {
  return 'What you loved, what we nailed, or anything we can do better next time…';
}

export function reviewFormSubmitLabel(): string {
  return 'Send my feedback';
}

export function reviewSuccessHeadline(greetingName: string): string {
  const hi = greetingName.trim();
  return hi ? `Thanks, ${hi}` : 'Thank you';
}

export function reviewSuccessBody(businessName: string): string {
  const name = businessName.trim() || 'We';
  return `We got your review — it really means a lot to the whole team at ${name}. Thanks for taking a minute to share how we did.`;
}

export function reviewSuccessSignOff(businessName: string): string {
  const name = businessName.trim();
  return name ? `— ${name}` : '';
}
