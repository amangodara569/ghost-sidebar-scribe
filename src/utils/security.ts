
export class SecureStorage {
  private static readonly ENCRYPTION_KEY = 'vibemind-secure-key';

  static async setSecureItem(key: string, value: string): Promise<void> {
    try {
      // In a real app, you'd use proper encryption here
      // For now, we'll use base64 encoding as a placeholder
      const encoded = btoa(value);
      localStorage.setItem(`secure_${key}`, encoded);
    } catch (error) {
      console.error('Failed to store secure item:', error);
      throw error;
    }
  }

  static async getSecureItem(key: string, defaultValue: string | null): Promise<string | null> {
    try {
      const stored = localStorage.getItem(`secure_${key}`);
      if (!stored) return defaultValue;
      
      // In a real app, you'd use proper decryption here
      return atob(stored);
    } catch (error) {
      console.error('Failed to retrieve secure item:', error);
      return defaultValue;
    }
  }

  static async removeSecureItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(`secure_${key}`);
    } catch (error) {
      console.error('Failed to remove secure item:', error);
      throw error;
    }
  }

  static async clearAllSecureItems(): Promise<void> {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('secure_'));
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear secure items:', error);
      throw error;
    }
  }
}

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>'"&]/g, '')
    .trim()
    .slice(0, 1000); // Limit length
};

export const validateUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};
