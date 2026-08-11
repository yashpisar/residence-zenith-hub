/**
 * A safe wrapper around browser localStorage to prevent SSR crashes
 * and handle private/incognito mode storage quota restrictions gracefully.
 */

export const storage = {
  isAvailable: (): boolean => {
    if (typeof window === "undefined") return false;
    try {
      const test = "__storage_test__";
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  },

  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      console.warn(`[Storage] Failed to read ${key} from localStorage`, e);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[Storage] Failed to write ${key} to localStorage`, e);
    }
  },

  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[Storage] Failed to remove ${key} from localStorage`, e);
    }
  },
  
  clear: (): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.clear();
    } catch (e) {
      console.warn(`[Storage] Failed to clear localStorage`, e);
    }
  }
};
