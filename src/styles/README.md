# Font Configuration Guide

This directory contains the font configuration for the ServiceLink application.

## Files

- `fonts.css` - CSS variables and global font styles
- `fonts.ts` - TypeScript utilities for font management
- `README.md` - This documentation file

## Current Font Stack

The application uses a modern, system-optimized font stack:

```
ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif
```

### Benefits

- **Fast Loading**: Uses system fonts, no external downloads
- **Native Look**: Matches each platform's design language
- **Excellent Readability**: Optimized for UI and text content
- **Universal Support**: Works across all devices and browsers
- **Accessibility**: Designed with readability in mind

## How to Change Fonts

### Option 1: Quick Change (Recommended)

Edit `src/styles/fonts.css` and update the CSS variables:

```css
:root {
  --font-primary: 'Your Font Name', fallback, sans-serif;
  --font-mono: 'Your Mono Font', monospace;
  --font-display: 'Your Display Font', sans-serif;
}
```

### Option 2: Add Custom Fonts

1. Add font files to `public/fonts/`
2. Import in `src/app/layout.tsx`:

   ```tsx
   import localFont from 'next/font/local';

   const customFont = localFont({
     src: './fonts/YourFont.woff2',
     variable: '--font-custom',
   });
   ```

3. Update CSS variables in `fonts.css`

### Option 3: Use Google Fonts

1. Install the font package:
   ```bash
   npm install @next/font
   ```
2. Import in `src/app/layout.tsx`:

   ```tsx
   import { Inter } from '@next/font/google';

   const inter = Inter({ subsets: ['latin'] });
   ```

3. Update CSS variables

## Usage in Components

### CSS Classes (Tailwind)

```tsx
<h1 className="font-sans font-bold text-4xl">Heading</h1>
<p className="font-sans font-normal text-base">Body text</p>
<code className="font-mono text-sm">Code snippet</code>
```

### TypeScript Utilities

Note: The TypeScript font utilities (`fonts.ts`) have been removed. Fonts are now configured via CSS in `fonts.css` and Tailwind classes.

### Inline Styles

```tsx
<div style={{ fontFamily: fonts.primary }}>Content with custom font</div>
```

## Font Stack Explanation

1. **ui-sans-serif** - Uses the system's preferred sans-serif font
2. **system-ui** - Uses the system's UI font (most modern)
3. **-apple-system** - Apple's system font (San Francisco)
4. **BlinkMacSystemFont** - Fallback for older macOS
5. **"Segoe UI"** - Windows system font
6. **Roboto** - Android system font
7. **"Helvetica Neue"** - High-quality fallback
8. **Arial** - Universal fallback
9. **"Noto Sans"** - Google's universal font
10. **sans-serif** - Generic fallback
11. **Emoji fonts** - Ensures emoji support across platforms

## Performance Considerations

- **System fonts load instantly** (0ms load time)
- **No external requests** for font files
- **Optimized rendering** with font-smoothing
- **Automatic font fallbacks** for reliability

## Browser Support

- ✅ Chrome/Edge (all versions)
- ✅ Firefox (all versions)
- ✅ Safari (all versions)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ✅ Older browsers (graceful degradation)

## Accessibility

The chosen font stack is optimized for:

- High contrast ratios
- Clear character distinction
- Readability at small sizes
- Screen reader compatibility
- Dyslexia-friendly design

## Testing

To test font changes:

1. Make changes to `fonts.css`
2. Run `npm run dev`
3. Check different components:
   - Landing page
   - Dashboard
   - Forms
   - Buttons
   - Headings

## Future Considerations

If you want to add custom fonts later:

1. Consider web font performance impact
2. Use font-display: swap for better UX
3. Preload critical fonts
4. Test across different devices
5. Monitor Core Web Vitals impact
