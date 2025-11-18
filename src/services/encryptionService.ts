import CryptoJS from 'crypto-js';
import { getEnv } from '../config/environment.js';
import { logger } from '../utils/logger.js';

export interface EncryptedData {
  encrypted: string;
  iv: string;
}

export function encrypt(text: string): EncryptedData {
  const { ENCRYPTION_KEY } = getEnv();
  
  if (ENCRYPTION_KEY.length !== 32) {
    throw new Error('Encryption key must be exactly 32 characters');
  }

  const iv = CryptoJS.lib.WordArray.random(128 / 8);
  const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return {
    encrypted: encrypted.toString(),
    iv: iv.toString(CryptoJS.enc.Hex),
  };
}

export function decrypt(encryptedData: EncryptedData): string {
  const { ENCRYPTION_KEY } = getEnv();
  
  if (ENCRYPTION_KEY.length !== 32) {
    throw new Error('Encryption key must be exactly 32 characters');
  }

  try {
    const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);
    const decrypted = CryptoJS.AES.decrypt(encryptedData.encrypted, ENCRYPTION_KEY, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedText) {
      throw new Error('Decryption failed - invalid encrypted data');
    }

    return decryptedText;
  } catch (error) {
    logger.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

