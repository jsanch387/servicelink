export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  businessType?: string;
  isOnboardingComplete: boolean;
}

export interface BusinessProfile {
  id: string;
  businessName: string;
  businessType: string;
  bio: string;
  serviceArea: string;
  services: Service[];
  portfolio: PortfolioItem[];
  contact: ContactInfo;
  logo?: string;
  coverPhoto?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  duration?: string;
  category: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  beforeAfter?: {
    before: string;
    after: string;
  };
}

export interface ContactInfo {
  phone: string;
  email: string;
  smsPhone?: string;
  website?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

export interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  isRequired: boolean;
  isCompleted: boolean;
}

export interface OnboardingState {
  currentStep: number;
  profileData: Partial<BusinessProfile>;
  isCompleted: boolean;
  steps: OnboardingStep[];
}

export interface OnboardingContextType {
  state: OnboardingState;

  updateProfileData: (_data: Partial<BusinessProfile>) => void;
  nextStep: () => void;
  previousStep: () => void;

  goToStep: (_step: number) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}
