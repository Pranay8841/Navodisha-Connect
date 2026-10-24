import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Universal key-value storage adapter.
 * Uses encrypted hardware SecureStore on iOS/Android, and localStorage on Web.
 */
export const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
      } catch (e) {
        return null;
      }
      return null;
    }

    try {
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch (e) {}
      return;
    }

    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {}
  },

  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch (e) {}
      return;
    }

    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {}
  },
};
