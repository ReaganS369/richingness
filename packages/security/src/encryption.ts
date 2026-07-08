import { ISecurityProvider } from './interfaces.js';

export class MockSecurityProvider implements ISecurityProvider {
  /**
   * Mock encrypt using base64 and appending key ID.
   */
  public async encrypt(data: string, keyId: string): Promise<string> {
    const rawString = `${keyId}::${data}`;
    if (typeof btoa !== 'undefined') {
      return btoa(rawString);
    }
    return Buffer.from(rawString).toString('base64');
  }

  /**
   * Mock decrypt using base64.
   */
  public async decrypt(cipher: string, _keyId: string): Promise<string> {
    let decoded = '';
    if (typeof atob !== 'undefined') {
      decoded = atob(cipher);
    } else {
      decoded = Buffer.from(cipher, 'base64').toString('utf-8');
    }
    const parts = decoded.split('::');
    return parts.slice(1).join('::');
  }

  /**
   * Mock key derivation returning a dummy ArrayBuffer.
   */
  public async deriveKey(passphrase: string, salt: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(passphrase + salt);
    return bytes.buffer;
  }
}
