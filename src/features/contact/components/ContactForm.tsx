'use client';

import { Button, Input, Select, TextArea } from '@/components/shared';
import { API_ROUTES, ROUTES } from '@/constants/routes';
import { useCallback, useState } from 'react';

import { CONTACT_TOPIC_OPTIONS } from '../constants';
import type { ContactTopic } from '../types';
import {
  getAuthenticatedContactFormFieldErrors,
  getContactFormFieldErrors,
} from '../utils/validateContactFormFields';
import { ContactFormSuccess } from './ContactFormSuccess';

type PublicFormState = {
  email: string;
  topic: ContactTopic | '';
  message: string;
  website: string;
};

type InAppFormState = {
  topic: ContactTopic | '';
  message: string;
  website: string;
};

const initialPublicForm: PublicFormState = {
  email: '',
  topic: '',
  message: '',
  website: '',
};

const initialInAppForm: InAppFormState = {
  topic: '',
  message: '',
  website: '',
};

export type ContactFormProps =
  | { variant?: 'public' }
  | { variant: 'inApp'; accountEmail: string };

export function ContactForm(props: ContactFormProps = {}) {
  const variant = props.variant ?? 'public';
  const isInApp = variant === 'inApp';

  const [publicForm, setPublicForm] =
    useState<PublicFormState>(initialPublicForm);
  const [inAppForm, setInAppForm] = useState<InAppFormState>(initialInAppForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const updatePublic = useCallback(
    <K extends keyof PublicFormState>(key: K, value: PublicFormState[K]) => {
      setPublicForm(prev => ({ ...prev, [key]: value }));
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

  const updateInApp = useCallback(
    <K extends keyof InAppFormState>(key: K, value: InAppFormState[K]) => {
      setInAppForm(prev => ({ ...prev, [key]: value }));
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

    const formPayload = isInApp ? inAppForm : publicForm;
    const clientErrors = isInApp
      ? getAuthenticatedContactFormFieldErrors(formPayload)
      : getContactFormFieldErrors(formPayload);

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
        credentials: isInApp ? 'include' : 'same-origin',
        body: JSON.stringify(formPayload),
      });

      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        code?: string;
      };

      if (!res.ok || !data.success) {
        const serverFieldErrors = isInApp
          ? getAuthenticatedContactFormFieldErrors(formPayload)
          : getContactFormFieldErrors(formPayload);
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
      if (isInApp) {
        setInAppForm(initialInAppForm);
      } else {
        setPublicForm(initialPublicForm);
      }
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <ContactFormSuccess
        doneHref={isInApp ? ROUTES.DASHBOARD.SETTINGS : undefined}
      />
    );
  }

  const topic = isInApp ? inAppForm.topic : publicForm.topic;
  const message = isInApp ? inAppForm.message : publicForm.message;
  const website = isInApp ? inAppForm.website : publicForm.website;
  const updateTopic = (value: ContactTopic | '') =>
    isInApp ? updateInApp('topic', value) : updatePublic('topic', value);
  const updateMessage = (value: string) =>
    isInApp ? updateInApp('message', value) : updatePublic('message', value);
  const updateWebsite = (value: string) =>
    isInApp ? updateInApp('website', value) : updatePublic('website', value);

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-5"
      noValidate
    >
      <Select
        label="What do you need help with?"
        value={topic}
        onChange={value => updateTopic(value as ContactTopic | '')}
        options={CONTACT_TOPIC_OPTIONS}
        placeholder="Select a topic"
        required
        error={fieldErrors.topic}
        name="topic"
      />

      {!isInApp ? (
        <Input
          label="Your email"
          type="email"
          value={publicForm.email}
          onChange={value => updatePublic('email', value)}
          placeholder="you@example.com"
          required
          error={fieldErrors.email}
          name="email"
          autoComplete="email"
          inputMode="email"
        />
      ) : null}

      <TextArea
        label="Message"
        value={message}
        onChange={updateMessage}
        placeholder="Tell us what you need — the more detail, the better we can help."
        required
        rows={6}
        maxLength={5000}
        hideCharCount
        error={fieldErrors.message}
        name="message"
      />

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
          value={website}
          onChange={e => updateWebsite(e.target.value)}
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
