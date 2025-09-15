export interface Testimonial {
  name: string;
  business: string;
  rating: number;
  comment: string;
  avatar: string;
}

export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
}

export interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface FooterLink {
  name: string;
  href: string;
}

export interface FooterLinks {
  product: FooterLink[];
  company: FooterLink[];
  support: FooterLink[];
  legal: FooterLink[];
}
