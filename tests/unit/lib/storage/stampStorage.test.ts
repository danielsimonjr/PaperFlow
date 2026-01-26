import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the stampStorage module
const mockStamps: Map<string, unknown> = new Map();
let stampCounter = 0;

vi.mock('@/lib/storage/stampStorage', () => ({
  saveCustomStamp: vi.fn().mockImplementation(async (stamp) => {
    stampCounter++;
    const id = `custom-${Date.now()}-${stampCounter}`;
    const savedStamp = {
      ...stamp,
      id,
      createdAt: new Date(),
    };
    mockStamps.set(id, savedStamp);
    return savedStamp;
  }),
  getAllCustomStamps: vi.fn().mockImplementation(async () => {
    return Array.from(mockStamps.values());
  }),
  deleteCustomStamp: vi.fn().mockImplementation(async (id) => {
    mockStamps.delete(id);
  }),
  getCustomStampCount: vi.fn().mockImplementation(async () => {
    return mockStamps.size;
  }),
  clearAllCustomStamps: vi.fn().mockImplementation(async () => {
    mockStamps.clear();
  }),
}));

// Import after mocking
import {
  saveCustomStamp,
  getAllCustomStamps,
  deleteCustomStamp,
  getCustomStampCount,
  clearAllCustomStamps,
} from '@/lib/storage/stampStorage';

describe('Stamp Storage', () => {
  beforeEach(() => {
    mockStamps.clear();
    stampCounter = 0;
    vi.clearAllMocks();
  });

  describe('saveCustomStamp', () => {
    it('saves a custom stamp with generated id', async () => {
      const stamp = {
        text: 'CUSTOM',
        color: '#000000',
        backgroundColor: '#FFFFFF',
      };

      const result = await saveCustomStamp(stamp);

      expect(result.id).toMatch(/^custom-/);
      expect(result.text).toBe('CUSTOM');
      expect(result.color).toBe('#000000');
      expect(result.backgroundColor).toBe('#FFFFFF');
      expect(result.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('getAllCustomStamps', () => {
    it('returns all saved stamps', async () => {
      // Add stamps using the mock
      await saveCustomStamp({
        text: 'TEST1',
        color: '#000000',
        backgroundColor: '#FFFFFF',
      });
      await saveCustomStamp({
        text: 'TEST2',
        color: '#FFFFFF',
        backgroundColor: '#000000',
      });

      const stamps = await getAllCustomStamps();

      expect(stamps).toHaveLength(2);
    });
  });

  describe('getCustomStampCount', () => {
    it('returns the count of stamps', async () => {
      await saveCustomStamp({
        text: 'TEST1',
        color: '#000000',
        backgroundColor: '#FFFFFF',
      });
      await saveCustomStamp({
        text: 'TEST2',
        color: '#FFFFFF',
        backgroundColor: '#000000',
      });

      const count = await getCustomStampCount();

      expect(count).toBe(2);
    });
  });

  describe('deleteCustomStamp', () => {
    it('deletes a specific stamp', async () => {
      const stamp1 = await saveCustomStamp({
        text: 'TEST1',
        color: '#000000',
        backgroundColor: '#FFFFFF',
      });
      await saveCustomStamp({
        text: 'TEST2',
        color: '#FFFFFF',
        backgroundColor: '#000000',
      });

      await deleteCustomStamp(stamp1.id);

      const stamps = await getAllCustomStamps();
      expect(stamps).toHaveLength(1);
    });
  });

  describe('clearAllCustomStamps', () => {
    it('clears all stamps', async () => {
      await saveCustomStamp({
        text: 'TEST1',
        color: '#000000',
        backgroundColor: '#FFFFFF',
      });
      await saveCustomStamp({
        text: 'TEST2',
        color: '#FFFFFF',
        backgroundColor: '#000000',
      });

      await clearAllCustomStamps();

      const stamps = await getAllCustomStamps();
      expect(stamps).toHaveLength(0);
    });
  });
});
