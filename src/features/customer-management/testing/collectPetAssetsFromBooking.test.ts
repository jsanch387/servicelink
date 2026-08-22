import { describe, expect, it } from 'vitest';
import { collectPetAssetsFromBooking } from '../server/upsertCustomerAssets';

describe('collectPetAssetsFromBooking', () => {
  it('dedupes customer and job pets by fingerprint', () => {
    const assets = collectPetAssetsFromBooking({
      customerPet: {
        name: 'Buddy',
        species: 'Dog',
        breed: 'Golden Retriever',
        size: 'Medium',
      },
      jobPets: [
        {
          name: 'Buddy',
          species: 'Dog',
          breed: 'Golden Retriever',
          size: 'Medium',
        },
        {
          name: 'Milo',
          species: 'Cat',
          breed: 'Tabby',
          size: 'Small',
        },
      ],
    });

    expect(assets).toHaveLength(2);
    expect(assets.map(a => a.assetType)).toEqual(['pet', 'pet']);
    expect(assets.map(a => a.label)).toEqual([
      'Buddy · Golden Retriever · Dog · Medium',
      'Milo · Tabby · Cat · Small',
    ]);
  });

  it('ignores incomplete or invalid pets', () => {
    expect(
      collectPetAssetsFromBooking({
        customerPet: {
          name: 'Buddy',
          species: 'Hamster',
          breed: 'Syrian',
          size: 'Small',
        },
        jobPets: [{ name: 'Milo', species: 'Cat', breed: '', size: 'Small' }],
      })
    ).toEqual([]);
  });
});
