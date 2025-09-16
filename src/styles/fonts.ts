/**
 * Font Configuration for ServiceLink App
 * 
 * This file provides TypeScript utilities for working with fonts
 * and ensures consistency across the application.
 */

export const fonts = {
  /**
   * Primary font stack - Modern, clean, and optimized for readability
   * Uses system fonts for fast loading and native look
   */
  primary: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  
  /**
   * Monospace font stack - For code and technical content
   */
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  
  /**
   * Display font stack - For headings and large text
   * Currently same as primary, but can be customized
   */
  display: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
} as const;

/**
 * CSS font family strings for direct use in styles
 */
export const fontFamilies = {
  primary: `font-family: ${fonts.primary};`,
  mono: `font-family: ${fonts.mono};`,
  display: `font-family: ${fonts.display};`,
} as const;

/**
 * Tailwind CSS font family classes
 * These correspond to the font configurations in Tailwind
 */
export const fontClasses = {
  primary: 'font-sans',
  mono: 'font-mono',
  display: 'font-sans', // Can be changed to font-display if configured
} as const;

/**
 * Font weight utilities
 */
export const fontWeights = {
  thin: 'font-thin',        // 100
  extralight: 'font-extralight', // 200
  light: 'font-light',      // 300
  normal: 'font-normal',    // 400
  medium: 'font-medium',    // 500
  semibold: 'font-semibold', // 600
  bold: 'font-bold',        // 700
  extrabold: 'font-extrabold', // 800
  black: 'font-black',      // 900
} as const;

/**
 * Font size utilities for common use cases
 */
export const fontSizes = {
  xs: 'text-xs',      // 12px
  sm: 'text-sm',      // 14px
  base: 'text-base',  // 16px
  lg: 'text-lg',      // 18px
  xl: 'text-xl',      // 20px
  '2xl': 'text-2xl',  // 24px
  '3xl': 'text-3xl',  // 30px
  '4xl': 'text-4xl',  // 36px
  '5xl': 'text-5xl',  // 48px
  '6xl': 'text-6xl',  // 60px
} as const;

/**
 * Common font combinations for different use cases
 */
export const fontCombinations = {
  heading: `${fontClasses.primary} ${fontWeights.bold}`,
  subheading: `${fontClasses.primary} ${fontWeights.semibold}`,
  body: `${fontClasses.primary} ${fontWeights.normal}`,
  caption: `${fontClasses.primary} ${fontWeights.medium}`,
  code: `${fontClasses.mono} ${fontWeights.normal}`,
  button: `${fontClasses.primary} ${fontWeights.medium}`,
} as const;

/**
 * Get font family CSS property
 */
export const getFontFamily = (type: keyof typeof fonts): string => {
  return fonts[type];
};

/**
 * Get complete font CSS string
 */
export const getFontCSS = (type: keyof typeof fonts, weight?: keyof typeof fontWeights): string => {
  const family = fontFamilies[type];
  const weight = weight ? `font-weight: ${weight};` : '';
  return `${family} ${weight}`.trim();
};
