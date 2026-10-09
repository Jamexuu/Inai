import { BloodPressureCategory } from '@/types';

export function getBPCategory(systolic: number, diastolic: number): BloodPressureCategory {
  if (systolic >= 180 || diastolic >= 120) {
    return 'crisis';
  }
  if (systolic >= 140 || diastolic >= 90) {
    return 'stage2';
  }
  if (systolic >= 130 || diastolic >= 80) {
    return 'stage1';
  }
  if (systolic >= 120 && diastolic < 80) {
    return 'elevated';
  }
  return 'normal';
}

export interface BPCategoryStyle {
  label: string;
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
  description: string;
}

export function getBPCategoryStyle(category: BloodPressureCategory): BPCategoryStyle {
  switch (category) {
    case 'normal':
      return {
        label: 'Normal',
        badgeBg: 'bg-herbal-tint',
        badgeBorder: 'border-herbal',
        textColor: 'text-herbal',
        description: 'Within healthy target range',
      };
    case 'elevated':
      return {
        label: 'Elevated',
        badgeBg: 'bg-amber-tint',
        badgeBorder: 'border-amber',
        textColor: 'text-amber',
        description: 'Slightly higher than normal',
      };
    case 'stage1':
      return {
        label: 'Stage 1 High',
        badgeBg: 'bg-terracotta-tint',
        badgeBorder: 'border-terracotta',
        textColor: 'text-terracotta',
        description: 'Stage 1 Hypertension',
      };
    case 'stage2':
      return {
        label: 'Stage 2 High',
        badgeBg: 'bg-brick-tint',
        badgeBorder: 'border-brick',
        textColor: 'text-brick',
        description: 'Stage 2 Hypertension',
      };
    case 'crisis':
      return {
        label: 'Crisis High',
        badgeBg: 'bg-brick-tint',
        badgeBorder: 'border-brick',
        textColor: 'text-brick',
        description: 'Consult doctor immediately',
      };
  }
}

