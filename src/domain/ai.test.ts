import { describe, expect, it } from 'vitest';
import { createMockAiProvider } from './ai';

describe('mock AI provider', () => {
  it('summarizes profiles, explains matches, drafts outreach, and suggests questions without API keys', async () => {
    const ai = createMockAiProvider();

    await expect(ai.summarizeUserProfile({ zipCode: '16801', preferredSpecies: ['cat'], monthlyBudget: 100 })).resolves.toContain('16801');
    await expect(ai.explainPetMatch({ name: 'Luna' }, { score: 92, reasons: ['calm temperament'], warnings: [] })).resolves.toContain('Luna');
    await expect(ai.draftShelterMessage({ name: 'Truen' }, { name: 'Luna' })).resolves.toContain('Luna');
    await expect(ai.suggestQuestionsToAskShelter({ name: 'Luna' })).resolves.toContain('medical history');
  });
});
