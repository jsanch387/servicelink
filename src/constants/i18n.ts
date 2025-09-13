export const SUPPORTED_LANGUAGES = {
  EN: 'en',
  ES: 'es',
} as const;

export type SupportedLanguage =
  (typeof SUPPORTED_LANGUAGES)[keyof typeof SUPPORTED_LANGUAGES];

export const DEFAULT_LANGUAGE: SupportedLanguage = SUPPORTED_LANGUAGES.EN;

export const LANGUAGE_NAMES = {
  [SUPPORTED_LANGUAGES.EN]: 'English',
  [SUPPORTED_LANGUAGES.ES]: 'Español',
} as const;

export const LANGUAGE_FLAGS = {
  [SUPPORTED_LANGUAGES.EN]: '🇺🇸',
  [SUPPORTED_LANGUAGES.ES]: '🇪🇸',
} as const;
