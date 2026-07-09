import type { LucideIcon } from "lucide-react";

export interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface TestimonialItem {
  name: string;
  role: string;
  company: string;
  quote: string;
  avatarInitials: string;
  rating: number;
}

export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface HowItWorksStep {
  step: string;
  title: string;
  description: string;
  icon: LucideIcon;
}
