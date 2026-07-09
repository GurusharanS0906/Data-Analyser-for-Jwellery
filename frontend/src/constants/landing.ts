import {
  Sparkles,
  MessageSquareText,
  BarChart3,
  MapPinned,
  Users,
  ShieldCheck,
  UploadCloud,
  Wand2,
  LineChart,
  Gem,
} from "lucide-react";
import type {
  FeatureItem,
  TestimonialItem,
  PricingPlan,
  FaqItem,
  HowItWorksStep,
} from "@/types/landing";

export const FEATURES: FeatureItem[] = [
  {
    icon: MessageSquareText,
    title: "Natural Language Search",
    description:
      "Ask questions the way you'd ask a colleague — \"Which district bought the most diamond rings?\" — and get instant, accurate answers.",
  },
  {
    icon: Wand2,
    title: "AI-Generated Reports",
    description:
      "Claude reads your data schema, writes the SQL, and explains the result in plain English — no analysts required.",
  },
  {
    icon: BarChart3,
    title: "Instant Charts",
    description:
      "Ask for a chart and get one. Bar, pie, line, area, donut, or heatmap — generated automatically from your query results.",
  },
  {
    icon: MapPinned,
    title: "District & City Analysis",
    description:
      "Break down revenue, purchases, and customer behaviour by district, city, or region in seconds.",
  },
  {
    icon: LineChart,
    title: "Revenue Insights",
    description:
      "Track monthly, quarterly, and yearly revenue trends with AI-generated forecasts for what's coming next.",
  },
  {
    icon: Users,
    title: "Customer Segmentation",
    description:
      "Understand your customers by age, gender, city, and purchase history to power smarter marketing decisions.",
  },
];

export const HOW_IT_WORKS: HowItWorksStep[] = [
  {
    step: "01",
    title: "Upload Your Excel Sheet",
    icon: UploadCloud,
    description:
      "Drag and drop your customer data — xlsx, xls, or csv, up to 100MB. We automatically detect and clean missing values, duplicates, and formatting issues.",
  },
  {
    step: "02",
    title: "Ask Anything",
    icon: Sparkles,
    description:
      "Type a question in plain English. Our AI engine converts it into SQL, runs it locally against your data, and never exposes technical details.",
  },
  {
    step: "03",
    title: "Get Instant Insights",
    icon: Gem,
    description:
      "Receive a clear, written answer along with an automatically generated chart — ready to share, export, or drop into a report.",
  },
];

export const TESTIMONIALS: TestimonialItem[] = [
  {
    name: "Priya Ramachandran",
    role: "Owner",
    company: "Meenakshi Jewellers, Coimbatore",
    quote:
      "I used to wait a week for my accountant to pull district-wise sales numbers. Now I just ask and get the answer in seconds. It's changed how I plan inventory.",
    avatarInitials: "PR",
    rating: 5,
  },
  {
    name: "Arun Kumar",
    role: "Managing Director",
    company: "Kumar Gold House, Chennai",
    quote:
      "The AI chat feels like having a data analyst on staff 24/7. We found out our diamond rings were underperforming in Madurai within minutes of uploading our sheet.",
    avatarInitials: "AK",
    rating: 5,
  },
  {
    name: "Lakshmi Narayanan",
    role: "Operations Head",
    company: "Sri Lakshmi Jewels, Madurai",
    quote:
      "Beautiful dashboard, and the reports look genuinely premium when I share them with our board. Worth every rupee.",
    avatarInitials: "LN",
    rating: 5,
  },
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Starter",
    price: "₹2,999",
    period: "/month",
    description: "For single-store jewellers getting started with data insights.",
    features: [
      "Up to 25,000 customer rows",
      "AI Chat (500 questions/month)",
      "Standard charts & dashboards",
      "PDF & Excel export",
      "Email support",
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Growth",
    price: "₹7,999",
    period: "/month",
    description: "For growing chains that need deeper analytics across locations.",
    features: [
      "Up to 200,000 customer rows",
      "Unlimited AI Chat questions",
      "Advanced charts & heatmaps",
      "Sales forecasting & CLV",
      "Multi-store district analysis",
      "Priority support",
    ],
    highlighted: true,
    cta: "Start Free Trial",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large jewellery groups with custom data & integration needs.",
    features: [
      "Unlimited rows & uploads",
      "Dedicated AI model tuning",
      "Custom integrations & SSO",
      "Onboarding & data migration",
      "Dedicated account manager",
    ],
    cta: "Contact Sales",
  },
];

export const FAQS: FaqItem[] = [
  {
    question: "Do I need any technical knowledge to use this?",
    answer:
      "No. If you can type a question in English, you can use Jewellery AI Analytics. There's no SQL, no formulas, and no spreadsheet formulas to learn.",
  },
  {
    question: "What file formats can I upload?",
    answer:
      "We support .xlsx, .xls, and .csv files up to 100MB, which covers roughly 200,000+ rows of customer data.",
  },
  {
    question: "Is my customer data secure?",
    answer:
      "Yes. All data is encrypted at rest and in transit, processed in an isolated environment, and never shared with third parties or used to train AI models.",
  },
  {
    question: "Can I export the insights and charts?",
    answer:
      "Yes — every answer, chart, and report can be exported as PDF, Excel, or CSV, and dashboards can be printed or shared directly with your team.",
  },
];

export const TRUST_BADGES = [ShieldCheck, Gem, Sparkles];
