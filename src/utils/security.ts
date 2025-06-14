
// IPC Security and Storage Protection utilities

interface IPCChannel {
  name: string;
  validator?: (data: any) => boolean;
  sanitizer?: (data: any) => any;
}

// Define allowed IPC channels with validation
export const SECURE_IPC_CHANNELS: IPCChannel[] = [
  {
    name: 'widgets:getAll',
    validator: () => true // No params needed
  },
  {
    name: 'widgets:updateOrder',
    validator: (data) => Array.isArray(data) && data.every(item => 
      typeof item === 'object' && 
      typeof item.id === 'string' && 
      typeof item.order === 'number'
    )
  },
  {
    name: 'theme:get',
    validator: () => true
  },
  {
    name: 'theme:save',
    validator: (data) => 
      typeof data === 'object' && 
      typeof data.name === 'string'
  },
  {
    name: 'notifications:show',
    validator: (data) => 
      typeof data === 'object' && 
      typeof data.title === 'string' && 
      typeof data.message === 'string'
  },
  {
    name: 'timer:start',
    validator: (data) => 
      typeof data === 'object' && 
      typeof data.duration === 'number' && 
      data.duration > 0 && 
      data.duration <= 7200 // Max 2 hours
  },
  {
    name: 'spotify:authenticate',
    validator: () => true
  },
  {
    name: 'analytics:track',
    validator: (data) => 
      typeof data === 'object' && 
      typeof data.event === 'string' && 
      data.event.length <= 50
  }
];

export class SecureStorage {
  private static encryptionKey: string | null = null;

  static async getEncryptionKey(): Promise<string> {
    if (!this.encryptionKey) {
      // In a real app, this would come from a secure keystore
      this.encryptionKey = await this.generateKey();
    }
    return this.encryptionKey;
  }

  private static async generateKey(): Promise<string> {
    // Simple key generation for demo - use proper crypto in production
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  static async encryptData(data: string): Promise<string> {
    try {
      // Simple encryption for demo - use AES in production
      const key = await this.getEncryptionKey();
      const encoded = btoa(data + '|' + key.slice(0, 16));
      return encoded;
    } catch (error) {
      console.error('Encryption failed:', error);
      return data; // Fallback to unencrypted
    }
  }

  static async decryptData(encryptedData: string): Promise<string> {
    try {
      const decoded = atob(encryptedData);
      const [data] = decoded.split('|');
      return data;
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedData; // Fallback to treating as unencrypted
    }
  }

  static async setSecureItem(key: string, value: any): Promise<void> {
    try {
      const jsonString = JSON.stringify(value);
      const encrypted = await this.encryptData(jsonString);
      localStorage.setItem(`secure_${key}`, encrypted);
    } catch (error) {
      console.error('Failed to store secure item:', error);
      // Fallback to regular storage with warning
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  static async getSecureItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const encrypted = localStorage.getItem(`secure_${key}`);
      if (!encrypted) return defaultValue;
      
      const decrypted = await this.decryptData(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to retrieve secure item:', error);
      // Fallback to regular storage
      const fallback = localStorage.getItem(key);
      return fallback ? JSON.parse(fallback) : defaultValue;
    }
  }
}

// URL sanitization
export const sanitizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    // Only allow https and http protocols
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }
    return parsed.toString();
  } catch (error) {
    console.warn('Invalid URL provided:', url);
    return '';
  }
};

// Input validation helpers
export const validateInput = {
  isString: (value: any, maxLength = 1000): boolean => 
    typeof value === 'string' && value.length <= maxLength,
  
  isNumber: (value: any, min = -Infinity, max = Infinity): boolean => 
    typeof value === 'number' && !isNaN(value) && value >= min && value <= max,
  
  isBoolean: (value: any): boolean => 
    typeof value === 'boolean',
  
  isArray: (value: any, maxLength = 1000): boolean => 
    Array.isArray(value) && value.length <= maxLength,
  
  isObject: (value: any): boolean => 
    typeof value === 'object' && value !== null && !Array.isArray(value)
};

// IPC message validator
export const validateIPCMessage = (channel: string, data: any): boolean => {
  const channelConfig = SECURE_IPC_CHANNELS.find(c => c.name === channel);
  
  if (!channelConfig) {
    console.warn(`Unknown IPC channel: ${channel}`);
    return false;
  }
  
  if (channelConfig.validator) {
    return channelConfig.validator(data);
  }
  
  return true;
};
