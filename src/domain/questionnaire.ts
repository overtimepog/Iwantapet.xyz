import type { QuestionnaireResponse } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

const requiredFields: Array<keyof QuestionnaireResponse> = [
  'zipCode', 'housingType', 'rentOrOwn', 'monthlyBudget', 'schedule', 'petExperience',
  'kidsInHome', 'otherPets', 'preferredSpecies', 'preferredSize', 'energyLevel',
  'agePreference', 'groomingTolerance', 'adoptionUrgency',
];

export function validateQuestionnaireResponse(input: Partial<QuestionnaireResponse>): ValidationResult {
  const errors: Record<string, string> = {};

  for (const field of requiredFields) {
    const value = input[field];
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
      errors[field] = 'This field is required.';
    }
  }

  if (!/^\d{5}$/.test(input.zipCode ?? '')) {
    errors.zipCode = 'Enter a valid 5-digit ZIP code.';
  }

  if (typeof input.monthlyBudget !== 'number' || Number.isNaN(input.monthlyBudget) || input.monthlyBudget <= 0) {
    errors.monthlyBudget = 'Budget must be greater than 0.';
  }

  if (!input.preferredSpecies || input.preferredSpecies.length === 0) {
    errors.preferredSpecies = 'Choose at least one species.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
