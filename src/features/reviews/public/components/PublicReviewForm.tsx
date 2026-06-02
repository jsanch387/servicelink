'use client';

import { Button, GlassCard, TextArea } from '@/components/shared';
import { useState } from 'react';
import {
  reviewFormCommentLabel,
  reviewFormCommentPlaceholder,
  reviewFormIntro,
  reviewFormRatingPrompt,
  reviewFormSubmitLabel,
  reviewFormVisitSectionTitle,
} from '../copy/publicReviewCopy';
import { PublicReviewStarInput } from './PublicReviewStarInput';

const MAX_BODY = 2000;

export type PublicReviewFormProps = {
  token: string;
  businessName: string;
  serviceName: string;
  /** e.g. "Monday, June 15, 2026 · 9:30 AM" */
  visitLine?: string;
  /** First name for greeting; falls back to "there". */
  customerGreetingName?: string;
  onSubmitted?: () => void;
};

export function PublicReviewForm({
  token,
  businessName,
  serviceName,
  visitLine,
  customerGreetingName,
  onSubmitted,
}: PublicReviewFormProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [body, setBody] = useState('');
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const greeting = customerGreetingName?.trim() || 'there';
  const intro = reviewFormIntro({
    greetingName: greeting,
    businessName,
    serviceName,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (rating === null) {
      setFormError('Pick a star rating so we know how we did.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/public/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, rating, body }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };

      if (!res.ok || !json.success) {
        setFormError(json.error ?? 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }

      onSubmitted?.();
    } catch {
      setFormError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <GlassCard
        padding="md"
        rounded="rounded-2xl"
        blurColor="bg-zinc-500"
        showBlur
      >
        <p className="text-sm leading-relaxed text-gray-300">{intro}</p>

        <div className="mt-5 space-y-1 border-t border-white/10 pt-5">
          <p className="text-sm font-medium text-gray-400">
            {reviewFormVisitSectionTitle()}
          </p>
          <p className="text-sm font-medium text-white">{serviceName}</p>
          {visitLine ? (
            <p className="text-sm text-gray-400">{visitLine}</p>
          ) : null}
        </div>

        <div className="mt-8 border-t border-white/10 pt-8">
          <p className="mb-4 text-center text-sm text-gray-400">
            {reviewFormRatingPrompt()}
          </p>
          <PublicReviewStarInput
            rating={rating}
            hoverRating={hoverRating}
            onSelect={setRating}
            onHover={setHoverRating}
          />
        </div>
      </GlassCard>

      <TextArea
        label={reviewFormCommentLabel()}
        placeholder={reviewFormCommentPlaceholder()}
        value={body}
        onChange={setBody}
        rows={4}
        maxLength={MAX_BODY}
      />

      {formError ? (
        <p className="text-sm text-red-400" role="alert">
          {formError}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="inverse"
        size="lg"
        fullWidth
        loading={submitting}
        aria-label={
          submitting ? 'Sending your feedback' : reviewFormSubmitLabel()
        }
      >
        {reviewFormSubmitLabel()}
      </Button>
    </form>
  );
}
