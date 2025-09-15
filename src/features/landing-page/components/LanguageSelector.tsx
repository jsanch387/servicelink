'use client';

import React, { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import {
  SUPPORTED_LANGUAGES,
  LANGUAGE_NAMES,
  LANGUAGE_FLAGS,
  type SupportedLanguage,
} from '@/constants/i18n';

export const LanguageSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(
    SUPPORTED_LANGUAGES.EN
  );

  const handleLanguageChange = (language: SupportedLanguage) => {
    setSelectedLanguage(language);
    setIsOpen(false);
    // Here you would typically update the app's language context
    // For now, we'll just log the change
    console.log('Language changed to:', language);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
        aria-label="Select language"
      >
        <span className="text-lg">{LANGUAGE_FLAGS[selectedLanguage]}</span>
        <span className="hidden sm:inline">
          {LANGUAGE_NAMES[selectedLanguage]}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-neutral-800 rounded-md shadow-lg py-1 z-50 border border-neutral-700">
          {Object.entries(SUPPORTED_LANGUAGES).map(([, value]) => (
            <button
              key={value}
              onClick={() => handleLanguageChange(value)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-700 transition-colors flex items-center space-x-3 ${
                selectedLanguage === value
                  ? 'text-white bg-neutral-700'
                  : 'text-gray-300'
              }`}
            >
              <span className="text-lg">{LANGUAGE_FLAGS[value]}</span>
              <span>{LANGUAGE_NAMES[value]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
