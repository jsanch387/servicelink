export interface Business {
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
  workShowcase: Array<{
    id: number;
    type: string;
    imageUrl: string;
    description: string;
  }>;
  services: Array<{
    name: string;
    price: string;
    description: string;
  }>;
  reviews: Array<{
    id: number;
    customer: string;
    rating: number;
    comment: string;
    date: string;
  }>;
}

export const businessData: Business = {
  // Use picsum with seeds so images are stable between refreshes
  logo: 'https://picsum.photos/seed/logo/256/256',
  coverPhoto: 'https://picsum.photos/seed/cover/1200/400',
  name: 'Auto Detailing Pro',
  type: 'Mobile Detailing',
  servingArea: 'Austin, TX',
  rating: 4.8,
  contact: {
    phone: '555-123-4567',
    email: 'info@autodetailingpro.com',
  },
  bio: 'Auto Detailing Pro is a family-owned and operated mobile detailing business serving the Austin, TX area. We specialize in providing a premium car cleaning experience right at your doorstep. Our team of experienced detailers uses only the highest quality products and techniques to ensure your vehicle looks its best. We are passionate about cars and dedicated to customer satisfaction!',
  workShowcase: [
    {
      id: 1,
      type: 'before',
      imageUrl: 'https://picsum.photos/seed/work1/900/1400',
      description: 'Car exterior before detailing',
    },
    {
      id: 2,
      type: 'after',
      imageUrl: 'https://picsum.photos/seed/work2/900/1400',
      description: 'Car exterior after detailing',
    },
    {
      id: 3,
      type: 'before',
      imageUrl: 'https://picsum.photos/seed/work3/900/1400',
      description: 'Interior before cleaning',
    },
    {
      id: 4,
      type: 'after',
      imageUrl: 'https://picsum.photos/seed/work4/900/1400',
      description: 'Interior after cleaning',
    },
    {
      id: 5,
      type: 'interior',
      imageUrl: 'https://picsum.photos/seed/work5/900/1400',
      description: 'Detailed view of car interior',
    },
    {
      id: 6,
      type: 'engine',
      imageUrl: 'https://picsum.photos/seed/work6/900/1400',
      description: 'Cleaned engine bay',
    },
  ],
  services: [
    {
      name: 'Exterior Only',
      price: '$50',
      description:
        'Includes a professional hand wash, wax, and tire dressing for a brilliant shine.',
    },
    {
      name: 'Interior Only',
      price: '$100',
      description:
        'Complete interior vacuum, shampoo, and surface wipe-down for a fresh feel.',
    },
    {
      name: 'Full Service',
      price: '$250',
      description:
        'Our most popular package. Combines the best of our interior and exterior services.',
    },
    {
      name: 'Headlight Restoration',
      price: '$75',
      description:
        'Removes yellowing and oxidation from headlights, improving visibility and appearance.',
    },
    {
      name: 'Ceramic Coating',
      price: '$500+',
      description:
        'A long-lasting protective layer that creates a deep, glossy finish and repels contaminants.',
    },
    {
      name: 'Engine Bay Cleaning',
      price: '$60',
      description:
        'Safely degrease and shine your engine bay for a clean and professional look.',
    },
  ],
  reviews: [
    {
      id: 1,
      customer: 'John Doe',
      rating: 5,
      comment: 'Amazing service! My car looks brand new.',
      date: '2023-03-15',
    },
    {
      id: 2,
      customer: 'Jane Smith',
      rating: 4,
      comment: 'Very professional and thorough. Highly recommend!',
      date: '2023-02-28',
    },
    {
      id: 3,
      customer: 'Peter Jones',
      rating: 5,
      comment: 'Great attention to detail and friendly staff.',
      date: '2023-03-20',
    },
  ],
};
