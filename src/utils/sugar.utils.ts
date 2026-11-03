import { BloodSugarCategory, BloodSugarContext } from '@/types';

/**
 * Evaluates blood glucose category according to standard clinical targets
 * tailored for adults/seniors (ADA guidelines).
 */
export function getSugarCategory(
  level: number,
  context: BloodSugarContext = 'random'
): BloodSugarCategory {
  if (level < 70) {
    return 'low';
  }

  if (context === 'fasting') {
    if (level <= 99) return 'normal';
    if (level <= 125) return 'elevated';
    return 'high';
  }

  if (context === 'after_meal') {
    if (level <= 140) return 'normal';
    if (level <= 199) return 'elevated';
    return 'high';
  }

  // bedtime / before_meal / random
  if (level <= 140) return 'normal';
  if (level <= 180) return 'elevated';
  return 'high';
}

export interface SugarCategoryStyle {
  label: string;
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
  description: string;
}

export function getSugarCategoryStyle(category: BloodSugarCategory): SugarCategoryStyle {
  switch (category) {
    case 'normal':
      return {
        label: 'Normal',
        badgeBg: 'bg-herbal-tint',
        badgeBorder: 'border-herbal',
        textColor: 'text-herbal',
        description: 'Within healthy target range',
      };
    case 'low':
      return {
        label: 'Low Sugar',
        badgeBg: 'bg-terracotta-tint',
        badgeBorder: 'border-terracotta',
        textColor: 'text-terracotta',
        description: 'Have a gentle snack or fruit juice',
      };
    case 'elevated':
      return {
        label: 'Slightly Elevated',
        badgeBg: 'bg-amber-tint',
        badgeBorder: 'border-amber',
        textColor: 'text-amber',
        description: 'A little higher than usual',
      };
    case 'high':
      return {
        label: 'High Sugar',
        badgeBg: 'bg-brick-tint',
        badgeBorder: 'border-brick',
        textColor: 'text-brick',
        description: 'Drink water and consult doctor if persistent',
      };
  }
}

export function getSugarContextLabel(context: BloodSugarContext): string {
  switch (context) {
    case 'fasting':
      return 'Fasting (Morning)';
    case 'before_meal':
      return 'Before Meal';
    case 'after_meal':
      return 'After Meal';
    case 'bedtime':
      return 'Bedtime';
    case 'random':
      return 'Random Check';
  }
}

