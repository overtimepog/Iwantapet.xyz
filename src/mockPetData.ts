import type { Organization, Pet } from './domain/types';

export const organizations: Organization[] = [
  { id: 'org-happy-valley', name: 'Happy Valley Humane Society', type: 'shelter', city: 'State College', state: 'PA', zipCode: '16801', email: 'adoptions@example.org', phone: '814-555-0199', website: 'https://example.org/happy-valley' },
  { id: 'org-nittany-rescue', name: 'Nittany Paws Rescue', type: 'rescue', city: 'Bellefonte', state: 'PA', zipCode: '16823', email: 'hello@example.org', phone: '814-555-0144', website: 'https://example.org/nittany-paws' },
];

export const mockPets: Pet[] = [
  { id: 'pet-luna', organizationId: 'org-happy-valley', name: 'Luna', species: 'cat', breed: 'Domestic Shorthair', age: 'adult', size: 'small', energyLevel: 'medium', groomingNeeds: 'low', goodWithKids: true, goodWithDogs: false, goodWithCats: true, allergyNotes: 'low shedding', monthlyCostEstimate: 65, distanceMiles: 8, description: 'Gentle lap cat who likes sunny windows and calm evenings.', imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=80' },
  { id: 'pet-maple', organizationId: 'org-nittany-rescue', name: 'Maple', species: 'dog', breed: 'Beagle Mix', age: 'young', size: 'medium', energyLevel: 'high', groomingNeeds: 'medium', goodWithKids: true, goodWithDogs: true, goodWithCats: false, allergyNotes: 'moderate shedding dog dander', monthlyCostEstimate: 105, distanceMiles: 18, description: 'Cheerful walking buddy who loves puzzle toys and weekend hikes.', imageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=80' },
  { id: 'pet-mochi', organizationId: 'org-happy-valley', name: 'Mochi', species: 'rabbit', breed: 'Mini Rex', age: 'adult', size: 'small', energyLevel: 'low', groomingNeeds: 'medium', goodWithKids: true, goodWithDogs: false, goodWithCats: false, allergyNotes: 'hay and bedding sensitivity possible', monthlyCostEstimate: 45, distanceMiles: 12, description: 'Quiet rabbit who enjoys predictable routines and gentle handling.', imageUrl: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=900&q=80' },
];
