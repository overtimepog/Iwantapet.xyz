import { describe, expect, it } from 'vitest';
import { savePet, unsavePet } from './savedPets';

describe('saved pets helpers', () => {
  it('saves each pet once and unsaves by pet id', () => {
    const saved = savePet(savePet([], 'user-1', 'pet-1'), 'user-1', 'pet-1');
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ userId: 'user-1', petId: 'pet-1' });

    expect(unsavePet(saved, 'user-1', 'pet-1')).toEqual([]);
  });
});
