import { describe, expect, it } from 'vitest';
import { scorePetMatch } from './matching';
import type { Pet, QuestionnaireResponse } from './types';

const user: QuestionnaireResponse = {
  zipCode: '16801',
  housingType: 'apartment',
  rentOrOwn: 'rent',
  landlordRestrictions: 'no large dogs',
  allergies: ['dog_dander'],
  monthlyBudget: 120,
  schedule: 'hybrid',
  petExperience: 'some',
  kidsInHome: 'young_kids',
  otherPets: 'cat',
  preferredSpecies: ['cat'],
  preferredSize: 'small',
  energyLevel: 'medium',
  agePreference: 'adult',
  groomingTolerance: 'medium',
  adoptionUrgency: 'this_month',
};

const pet: Pet = {
  id: 'pet-luna',
  organizationId: 'org-happy-valley',
  name: 'Luna',
  species: 'cat',
  breed: 'Domestic Shorthair',
  age: 'adult',
  size: 'small',
  energyLevel: 'medium',
  groomingNeeds: 'low',
  goodWithKids: true,
  goodWithDogs: false,
  goodWithCats: true,
  allergyNotes: 'low shedding',
  monthlyCostEstimate: 65,
  distanceMiles: 8,
  description: 'Gentle lap cat who likes sunny windows.',
  imageUrl: '/pets/luna.jpg',
};

describe('scorePetMatch', () => {
  it('returns a high score with clear reasons for a compatible pet', () => {
    const result = scorePetMatch(user, pet);

    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.reasons).toContain('Small size fits your housing needs.');
    expect(result.reasons).toContain('Good fit for homes with kids.');
    expect(result.warnings).toEqual([]);
  });

  it('hard-filters incompatible species, distance, allergies, and kid/pet conflicts', () => {
    const result = scorePetMatch(user, {
      ...pet,
      id: 'pet-bolt',
      species: 'dog',
      distanceMiles: 130,
      goodWithKids: false,
      goodWithCats: false,
      allergyNotes: 'heavy dog dander shedding',
    });

    expect(result.score).toBe(0);
    expect(result.filteredOut).toBe(true);
    expect(result.warnings).toEqual(expect.arrayContaining([
      'Outside your preferred travel distance.',
      'Species does not match your preference.',
      'May trigger listed allergies.',
      'Not marked as safe with kids.',
      'Not compatible with your current cat.',
    ]));
  });
});
