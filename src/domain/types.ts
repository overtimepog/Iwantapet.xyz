export type Species = 'dog' | 'cat' | 'rabbit' | 'bird' | 'small_animal';
export type Size = 'small' | 'medium' | 'large' | 'giant';
export type EnergyLevel = 'low' | 'medium' | 'high';
export type AgePreference = 'baby' | 'young' | 'adult' | 'senior' | 'any';
export type GroomingTolerance = 'low' | 'medium' | 'high';

export interface QuestionnaireResponse {
  zipCode: string;
  housingType: string;
  rentOrOwn: 'rent' | 'own' | string;
  landlordRestrictions: string;
  allergies: string[];
  monthlyBudget: number;
  schedule: string;
  petExperience: 'none' | 'some' | 'experienced' | string;
  kidsInHome: 'none' | 'young_kids' | 'older_kids' | string;
  otherPets: 'none' | 'dog' | 'cat' | 'multiple' | string;
  preferredSpecies: Species[];
  preferredSize: Size | 'any';
  energyLevel: EnergyLevel;
  agePreference: AgePreference;
  groomingTolerance: GroomingTolerance;
  adoptionUrgency: string;
}

export interface Organization {
  id: string;
  name: string;
  type: 'shelter' | 'rescue' | 'pet_store';
  city: string;
  state: string;
  zipCode: string;
  email?: string;
  phone?: string;
  website?: string;
}

export interface Pet {
  id: string;
  organizationId: string;
  name: string;
  species: Species;
  breed: string;
  age: Exclude<AgePreference, 'any'>;
  size: Size;
  energyLevel: EnergyLevel;
  groomingNeeds: GroomingTolerance;
  goodWithKids: boolean;
  goodWithDogs: boolean;
  goodWithCats: boolean;
  allergyNotes: string;
  monthlyCostEstimate: number;
  distanceMiles: number;
  description: string;
  imageUrl: string;
}

export interface MatchResult {
  petId: string;
  score: number;
  reasons: string[];
  warnings: string[];
  filteredOut: boolean;
}
