import { describe, expect, it } from 'vitest';
import { validateQuestionnaireResponse } from './questionnaire';

const baseResponse = {
  zipCode: '16801',
  housingType: 'apartment',
  rentOrOwn: 'rent',
  landlordRestrictions: 'cats under 20 lb only',
  allergies: ['dog_dander'],
  monthlyBudget: 125,
  schedule: 'hybrid',
  petExperience: 'some',
  kidsInHome: 'none',
  otherPets: 'none',
  preferredSpecies: ['cat'],
  preferredSize: 'small',
  energyLevel: 'medium',
  agePreference: 'adult',
  groomingTolerance: 'medium',
  adoptionUrgency: 'this_month',
};

describe('validateQuestionnaireResponse', () => {
  it('accepts a complete realistic questionnaire response', () => {
    expect(validateQuestionnaireResponse(baseResponse)).toEqual({ valid: true, errors: {} });
  });

  it('rejects invalid ZIP codes, negative budgets, and missing species', () => {
    const result = validateQuestionnaireResponse({ ...baseResponse, zipCode: 'abc', monthlyBudget: -5, preferredSpecies: [] });

    expect(result.valid).toBe(false);
    expect(result.errors.zipCode).toContain('5-digit ZIP');
    expect(result.errors.monthlyBudget).toContain('greater than 0');
    expect(result.errors.preferredSpecies).toContain('Choose at least one species');
  });
});
