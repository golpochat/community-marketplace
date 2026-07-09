export interface HelpFaqItem {
  question: string;
  answer: string;
}

export const HELP_FAQ_ITEMS: HelpFaqItem[] = [
  {
    question: 'How do I buy an item?',
    answer:
      'Browse listings, message the seller to ask questions, then arrange pickup or delivery.',
  },
  {
    question: 'How do I sell on the marketplace?',
    answer:
      'Register as a seller, complete verification, then create a listing from your seller dashboard.',
  },
  {
    question: 'Is payment secure?',
    answer:
      'Payments are processed through our secure payment provider. Never send money outside the platform.',
  },
  {
    question: 'How do I report a listing?',
    answer:
      'Open the listing detail page and use the Report button to flag suspicious content.',
  },
];
