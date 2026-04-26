import type { Settings, TaxCategory } from '@/types';

interface Bracket {
  upTo: number | null; // null = Infinity
  base: number;        // tax owed at start of this bracket
  rate: number;        // marginal rate over (income - prevUpTo)
  prevUpTo: number;
}

// 2025–26 Resident
const RESIDENT: Bracket[] = [
  { prevUpTo: 0,       upTo: 18200,  base: 0,      rate: 0 },
  { prevUpTo: 18200,   upTo: 45000,  base: 0,      rate: 0.16 },
  { prevUpTo: 45000,   upTo: 135000, base: 4288,   rate: 0.30 },
  { prevUpTo: 135000,  upTo: 190000, base: 31288,  rate: 0.37 },
  { prevUpTo: 190000,  upTo: null,   base: 51638,  rate: 0.45 },
];

// 2025–26 Working Holiday Maker (registered employer + TFN)
const WHM: Bracket[] = [
  { prevUpTo: 0,       upTo: 45000,  base: 0,      rate: 0.15 },
  { prevUpTo: 45000,   upTo: 135000, base: 6750,   rate: 0.30 },
  { prevUpTo: 135000,  upTo: 190000, base: 33750,  rate: 0.37 },
  { prevUpTo: 190000,  upTo: null,   base: 54100,  rate: 0.45 },
];

// 2025–26 Foreign Resident
const FOREIGN: Bracket[] = [
  { prevUpTo: 0,       upTo: 135000, base: 0,      rate: 0.30 },
  { prevUpTo: 135000,  upTo: 190000, base: 40500,  rate: 0.37 },
  { prevUpTo: 190000,  upTo: null,   base: 60850,  rate: 0.45 },
];

function applyBrackets(income: number, brackets: Bracket[]): number {
  for (const b of brackets) {
    if (b.upTo === null || income <= b.upTo) {
      return b.base + (income - b.prevUpTo) * b.rate;
    }
  }
  return 0;
}

function medicareLevy(income: number): number {
  // Simplified: 2% above $26,000 threshold (ignore phase-in shading for MVP)
  if (income <= 26000) return 0;
  return income * 0.02;
}

function effectiveCategory(settings: Settings): TaxCategory {
  if (settings.taxCategory === 'whm' && !settings.employerRegistered) {
    return 'foreign_resident';
  }
  return settings.taxCategory;
}

export function calculateAnnualTax(annualIncome: number, settings: Settings): number {
  if (annualIncome <= 0) return 0;

  // WHM without TFN: flat 45%
  if (settings.taxCategory === 'whm' && !settings.tfnSubmitted) {
    return annualIncome * 0.45;
  }

  const cat = effectiveCategory(settings);
  let tax = 0;
  switch (cat) {
    case 'resident':
      tax = applyBrackets(annualIncome, RESIDENT);
      if (settings.applyMedicareLevy) tax += medicareLevy(annualIncome);
      break;
    case 'whm':
      tax = applyBrackets(annualIncome, WHM);
      break;
    case 'foreign_resident':
      tax = applyBrackets(annualIncome, FOREIGN);
      break;
  }
  return Math.max(0, tax);
}

export function estimateWeeklyTax(weeklyGross: number, settings: Settings): number {
  if (weeklyGross <= 0) return 0;
  const annual = weeklyGross * 52;
  return calculateAnnualTax(annual, settings) / 52;
}
