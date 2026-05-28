export interface SavedPetRecord {
  userId: string;
  petId: string;
  savedAt: string;
}

export function savePet(records: SavedPetRecord[], userId: string, petId: string): SavedPetRecord[] {
  if (records.some((record) => record.userId === userId && record.petId === petId)) return records;
  return [...records, { userId, petId, savedAt: new Date().toISOString() }];
}

export function unsavePet(records: SavedPetRecord[], userId: string, petId: string): SavedPetRecord[] {
  return records.filter((record) => !(record.userId === userId && record.petId === petId));
}
