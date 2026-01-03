/**
 * Encryption utility for sensitive data (passwords)
 * Uses AES-256-GCM encryption
 */

import crypto from 'crypto';

// Get encryption key from environment variable
// In production, this should be a strong random key stored securely
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32b';

// Ensure key is 32 bytes for AES-256
const getKey = (): Buffer => {
  const key = ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32);
  return Buffer.from(key, 'utf-8');
};

/**
 * Encrypt a string using AES-256-GCM
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: iv:authTag:encryptedData (all hex encoded)
 */
export function encrypt(text: string): string {
  try {
    // Generate random initialization vector
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    // Return iv:authTag:encrypted (all hex encoded)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt a string encrypted with encrypt()
 * @param encryptedText - Encrypted string in format: iv:authTag:encryptedData
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
  try {
    // Split the encrypted text into components
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }
    
    const [ivHex, authTagHex, encryptedHex] = parts;
    
    // Convert from hex
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Check if a string is encrypted (has the expected format)
 * @param text - Text to check
 * @returns True if text appears to be encrypted
 */
export function isEncrypted(text: string): boolean {
  const parts = text.split(':');
  return parts.length === 3 && parts.every(part => /^[0-9a-f]+$/i.test(part));
}
