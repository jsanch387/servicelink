'use client';

import { Button, Input, Select, TextArea } from '@/components/shared';
import { API_ROUTES } from '@/constants/routes';
import { useCallback, useState } from 'react';

import { CONTACT_TOPIC_OPTIONS } from '../constants';
import type { ContactTopic } from '../types';
import { getContactFormFieldErrors } from '../utils/validateContactFormFields';
import { ContactFormSuccess } from './ContactFormSuccess';

type FormState = {
  name: string;
  email: string;
  topic: ContactTopic | '';
  message: string;
  website: string;
};

const initialForm: FormState = {
  name: '',
  email: '',
  topic: '',
  message: '',
  website: '',
};

export function ContactForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm(prev => ({ ...prev, [key]: value }));
      setFieldErrors(prev => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setSubmitError(null);
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || submitted) return;

    const clientErrors = getContactFormFieldErrors(form);
    if (clientErrors) {
      setFieldErrors(clientErrors);
      setSubmitError(null);
      return;
    }

    setFieldErrors({});
    setSubmitError(null);
    setLoading(true);

    try {
      const res = await fetch(API_ROUTES.CONTACT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        code?: string;
      };

      if (!res.ok || !data.success) {
        const serverFieldErrors = getContactFormFieldErrors(form);
        if (data.code === 'VALIDATION_ERROR' && serverFieldErrors) {
          setFieldErrors(serverFieldErrors);
        } else {
          setSubmitError(
            data.error ?? 'Something went wrong. Please try again.'
          );
        }
        return;
      }

      setSubmitted(true);
      setForm(initialForm);
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return <ContactFormSuccess />;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-5"
      noValidate
    >
      <Select
        label="What do you need help with?"
        value={form.topic}
        onChange={value => update('topic', value as ContactTopic | '')}
        options={CONTACT_TOPIC_OPTIONS}
        placeholder="Select a topic"
        required
        error={fieldErrors.topic}
        name="topic"
      />

      <div className="grid sm:grid-cols-2 gap-5">
        <Input
          label="Your name"
          value={form.name}
          onChange={value => update('name', value)}
          placeholder="Jane Smith"
          required
          error={fieldErrors.name}
          name="name"
          autoComplete="name"
        />
        <Input
          label="Your email"
          type="email"
          value={form.email}
          onChange={value => update('email', value)}
          placeholder="you@example.com"
          required
          error={fieldErrors.email}
          name="email"
          autoComplete="email"
          inputMode="email"
        />
      </div>

      <TextArea
        label="Message"
        value={form.message}
        onChange={value => update('message', value)}
        placeholder="Tell us what you need — the more detail, the better we can help."
        required
        rows={6}
        maxLength={5000}
        error={fieldErrors.message}
        name="message"
      />

      {/* Honeypot — hidden from users, bots often fill it */}
      <div
        className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
        aria-hidden
      >
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={e => update('website', e.target.value)}
        />
      </div>

      {submitError ? (
        <p className="text-sm text-red-400" role="alert">
          {submitError}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="inverse"
        size="lg"
        fullWidth
        loading={loading}
        disabled={loading}
      >
        Send message
      </Button>
    </form>
  );
}
