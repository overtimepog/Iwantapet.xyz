import type { MatchResult, Pet, QuestionnaireResponse } from './types';

const MAX_DISTANCE_MILES = 75;
const sizeOrder = ['small', 'medium', 'large', 'giant'];
const groomingOrder = ['low', 'medium', 'high'];

function allergyConflict(user: QuestionnaireResponse, pet: Pet): boolean {
  const notes = `${pet.species} ${pet.allergyNotes}`.toLowerCase();
  return user.allergies.some((allergy) => allergy && notes.includes(allergy.replace('_', ' ').split(' ')[0]));
}

function restrictionConflict(user: QuestionnaireResponse, pet: Pet): boolean {
  const restriction = user.landlordRestrictions.toLowerCase();
  return user.rentOrOwn === 'rent' && restriction.includes('no large dog') && pet.species === 'dog' && ['large', 'giant'].includes(pet.size);
}

export function scorePetMatch(user: QuestionnaireResponse, pet: Pet): MatchResult {
  const warnings: string[] = [];
  const reasons: string[] = [];

  if (pet.distanceMiles > MAX_DISTANCE_MILES) warnings.push('Outside your preferred travel distance.');
  if (!user.preferredSpecies.includes(pet.species)) warnings.push('Species does not match your preference.');
  if (restrictionConflict(user, pet)) warnings.push('Conflicts with landlord restrictions.');
  if (allergyConflict(user, pet)) warnings.push('May trigger listed allergies.');
  if (user.kidsInHome !== 'none' && !pet.goodWithKids) warnings.push('Not marked as safe with kids.');
  if (user.otherPets === 'cat' && !pet.goodWithCats) warnings.push('Not compatible with your current cat.');
  if (user.otherPets === 'dog' && !pet.goodWithDogs) warnings.push('Not compatible with your current dog.');

  if (warnings.length > 0) {
    return { petId: pet.id, score: 0, reasons, warnings, filteredOut: true };
  }

  let score = 58;
  if (pet.distanceMiles <= 10) { score += 8; reasons.push('Nearby and easy to visit.'); }
  if (pet.size === user.preferredSize || user.preferredSize === 'any') { score += 10; reasons.push(`${pet.size[0].toUpperCase()}${pet.size.slice(1)} size fits your housing needs.`); }
  else if (sizeOrder.indexOf(pet.size) < sizeOrder.indexOf(user.preferredSize)) score += 5;
  if (pet.energyLevel === user.energyLevel) { score += 10; reasons.push('Energy level matches your lifestyle.'); }
  if (user.agePreference === 'any' || pet.age === user.agePreference) { score += 8; reasons.push('Age preference lines up well.'); }
  if (groomingOrder.indexOf(pet.groomingNeeds) <= groomingOrder.indexOf(user.groomingTolerance)) { score += 6; reasons.push('Grooming needs fit your tolerance.'); }
  if (pet.monthlyCostEstimate <= user.monthlyBudget) { score += 7; reasons.push('Estimated monthly care cost fits your budget.'); }
  if (user.petExperience !== 'none' || pet.energyLevel !== 'high') score += 4;
  if (user.schedule !== 'travel_often' || pet.energyLevel === 'low') score += 3;
  if (user.kidsInHome !== 'none' && pet.goodWithKids) reasons.push('Good fit for homes with kids.');
  if (user.otherPets === 'cat' && pet.goodWithCats) reasons.push('Likely compatible with your current cat.');

  return { petId: pet.id, score: Math.max(0, Math.min(100, score)), reasons, warnings, filteredOut: false };
}
