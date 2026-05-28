import type { MatchResult, Pet, QuestionnaireResponse } from './types';

export interface AiProvider {
  summarizeUserProfile(profile: Partial<QuestionnaireResponse>): Promise<string>;
  explainPetMatch(pet: Partial<Pet>, match: Pick<MatchResult, 'score' | 'reasons' | 'warnings'>): Promise<string>;
  draftShelterMessage(user: { name?: string }, pet: Partial<Pet>): Promise<string>;
  suggestQuestionsToAskShelter(pet: Partial<Pet>): Promise<string[]>;
}

export function createMockAiProvider(): AiProvider {
  return {
    async summarizeUserProfile(profile) {
      return `Pet seeker near ${profile.zipCode ?? 'your area'} looking for ${(profile.preferredSpecies ?? []).join(', ') || 'a pet'} with a monthly budget around $${profile.monthlyBudget ?? 'flexible'}.`;
    },
    async explainPetMatch(pet, match) {
      return `${pet.name ?? 'This pet'} is a ${match.score}/100 match because ${match.reasons.join(', ') || 'the profile is compatible'}.${match.warnings.length ? ` Watch-outs: ${match.warnings.join(', ')}.` : ''}`;
    },
    async draftShelterMessage(user, pet) {
      return `Hi, my name is ${user.name ?? 'a prospective adopter'}. I am interested in ${pet.name ?? 'this pet'} and would love to learn more about temperament, adoption steps, and availability.`;
    },
    async suggestQuestionsToAskShelter(pet) {
      return [
        'medical history',
        `How does ${pet.name ?? 'the pet'} behave in a home environment?`,
        'Are there any adoption requirements or fees I should know about?',
      ];
    },
  };
}
