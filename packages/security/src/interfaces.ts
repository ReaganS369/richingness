export interface ISecurityProvider {
  /**
   * Encrypts plain text using key derived for the specified key ID.
   */
  encrypt(data: string, keyId: string): Promise<string>;

  /**
   * Decrypts cipher text using key derived for the specified key ID.
   */
  decrypt(cipher: string, keyId: string): Promise<string>;

  /**
   * Derives a cryptographic key from a passphrase and salt.
   */
  deriveKey(passphrase: string, salt: string): Promise<ArrayBuffer>;
}
