// Simple storage wrapper - uses in-memory fallback
// In production, replace with @react-native-async-storage/async-storage

let memoryStore: Record<string, string> = {};

export const storage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      // Try AsyncStorage if available
      const AS = require('@react-native-async-storage/async-storage');
      const mod = AS.default || AS;
      return await mod.getItem(key);
    } catch {
      return memoryStore[key] || null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    memoryStore[key] = value;
    try {
      const AS = require('@react-native-async-storage/async-storage');
      const mod = AS.default || AS;
      await mod.setItem(key, value);
    } catch {}
  },
  removeItem: async (key: string): Promise<void> => {
    delete memoryStore[key];
    try {
      const AS = require('@react-native-async-storage/async-storage');
      const mod = AS.default || AS;
      await mod.removeItem(key);
    } catch {}
  },
};
