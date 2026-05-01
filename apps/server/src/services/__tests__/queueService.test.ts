import { describe, expect, it } from 'vitest';

import { reorderQueueEntries } from '../queueService.js';

const entries = [
  { id: 'queue-1', characterId: 'character-1', position: 1 },
  { id: 'queue-2', characterId: 'character-2', position: 2 },
  { id: 'queue-3', characterId: 'character-3', position: 3 }
];

describe('reorderQueueEntries', () => {
  it('moves an item to a requested 1-based position', () => {
    expect(reorderQueueEntries(entries, 'character-3', 1)).toEqual([
      { id: 'queue-3', characterId: 'character-3', position: 1 },
      { id: 'queue-1', characterId: 'character-1', position: 2 },
      { id: 'queue-2', characterId: 'character-2', position: 3 }
    ]);
  });

  it('clamps positions below and above the queue bounds', () => {
    expect(reorderQueueEntries(entries, 'character-2', -10).map((entry) => entry.characterId)).toEqual([
      'character-2',
      'character-1',
      'character-3'
    ]);

    expect(reorderQueueEntries(entries, 'character-2', 99).map((entry) => entry.characterId)).toEqual([
      'character-1',
      'character-3',
      'character-2'
    ]);
  });

  it('throws when the character is not in the queue', () => {
    expect(() => reorderQueueEntries(entries, 'missing-character', 1)).toThrow('Character not in queue');
  });
});
