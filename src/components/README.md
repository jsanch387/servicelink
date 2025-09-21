# Component Library

This directory contains all the reusable components for the application, organized by feature and shared components.

## 📁 Directory Structure

```
src/components/
├── shared/                    # Reusable components used across features
│   ├── Button.tsx           # Button component with variants
│   ├── ImageWithFallback.tsx # Image component with fallback handling
│   └── SectionTitle.tsx     # Section header component
├── business-profile/         # Business profile feature components
│   ├── BusinessProfile.tsx  # Main business profile component
│   ├── ProfileHeader.tsx    # Header with logo, name, rating, contact
│   ├── AboutUs.tsx          # About us section
│   ├── WorkShowcase.tsx     # Work gallery section
│   ├── ServicesList.tsx     # Services section container
│   ├── ServiceCard.tsx      # Individual service card
│   ├── ReviewsSection.tsx   # Customer reviews section
│   └── QuoteButton.tsx      # Floating quote request button
├── index.ts                 # Main export file
└── README.md               # This file
```

## 🔧 Shared Components

### Button

A versatile button component with multiple variants and sizes.

**Props:**

- `variant`: 'primary' | 'secondary' (default: 'primary')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `href`: Optional link URL
- `onClick`: Click handler
- `disabled`: Disabled state
- `className`: Additional CSS classes

**Usage:**

```tsx
import { Button } from '@/components';

<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>

<Button href="/contact" variant="secondary">
  Contact Us
</Button>
```

### ImageWithFallback

Robust image component with built-in fallback handling.

**Props:**

- `src`: Image source URL
- `alt`: Alt text
- `fallbackLabel`: Text for fallback SVG
- `fallbackSize`: Dimensions for fallback SVG
- `className`: Additional CSS classes

**Usage:**

```tsx
import { ImageWithFallback } from '@/components';

<ImageWithFallback
  src={imageUrl}
  alt="Description"
  fallbackLabel="IMAGE"
  fallbackSize={{ w: 300, h: 200 }}
  className="rounded-lg"
/>;
```

### SectionTitle

Consistent section headers with optional icons.

**Props:**

- `icon`: Optional icon element
- `className`: Additional CSS classes

**Usage:**

```tsx
import { SectionTitle } from '@/components';
import { StarIcon } from '@heroicons/react/24/solid';

<SectionTitle icon={<StarIcon className="h-7 w-7 text-yellow-300" />}>
  Customer Reviews
</SectionTitle>;
```

## 🏢 Business Profile Components

### BusinessProfile

Main component that composes all business profile sections.

**Props:**

- `business`: Business data object
- `onRequestQuote`: Quote request handler

**Usage:**

```tsx
import { BusinessProfileView } from '@/features/business-profile';
import { businessData } from '@/data/businessData';

<BusinessProfileView businessProfile={businessData} />;
```

### ProfileHeader

Displays business logo, name, rating, and contact buttons.

**Props:**

- `business`: Business data object

### AboutUs

Simple section displaying business bio.

**Props:**

- `bio`: Business description text

### WorkShowcase

Horizontal scrolling gallery of work images.

**Props:**

- `workShowcase`: Array of work items

### ServicesList

Container for services with horizontal scrolling.

**Props:**

- `services`: Array of service objects

### ServiceCard

Individual service card with name, price, and description.

**Props:**

- `service`: Service object

### ReviewsSection

Customer reviews with star ratings.

**Props:**

- `reviews`: Array of review objects

### QuoteButton

Floating button for quote requests.

**Props:**

- `onClick`: Click handler

## 📊 Data Structure

The business data follows this interface:

```typescript
interface Business {
  logo: string;
  coverPhoto: string;
  name: string;
  type: string;
  servingArea: string;
  rating: number;
  contact: {
    phone: string;
    email: string;
  };
  bio: string;
  workShowcase: WorkItem[];
  services: Service[];
  reviews: Review[];
}
```

## 🚀 Usage Examples

### Basic Implementation

```tsx
import { BusinessProfileView } from '@/features/business-profile';
import { businessData } from '@/data/businessData';

export default function Home() {
  return <BusinessProfileView businessProfile={businessData} />;
}
```

### Custom Quote Handler

```tsx
import { BusinessProfileView } from '@/features/business-profile';

export default function Home() {
  const handleQuoteRequest = () => {
    // Custom logic here
    console.log('Quote requested!');
  };

  return <BusinessProfileView businessProfile={businessData} />;
}
```

### Individual Components

```tsx
import { ProfileHeader, AboutUs } from '@/components';

export default function CustomPage() {
  return (
    <div>
      <ProfileHeader business={businessData} />
      <AboutUs bio="Custom bio text" />
    </div>
  );
}
```

## 🎨 Styling

All components use Tailwind CSS classes and maintain consistent:

- Color scheme (neutral-800, neutral-700, gray-50, etc.)
- Spacing (px-6 py-8, space-x-4, etc.)
- Typography (text-2xl, font-bold, etc.)
- Transitions (duration-300, ease-in-out, etc.)

## 🔄 Component Updates

When updating components:

1. Maintain the existing interface contracts
2. Update the component's TypeScript interface if needed
3. Ensure all props are properly typed
4. Test the component in isolation
5. Update this README if the API changes

## 📝 Notes

- All components are fully typed with TypeScript
- Components use Heroicons for consistent iconography
- The design is mobile-first and responsive
- Components are designed to be composable and reusable
- Mock data is centralized in `src/data/businessData.ts`
