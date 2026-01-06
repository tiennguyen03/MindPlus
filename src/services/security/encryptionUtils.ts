import crypto from 'crypto';

export interface HashedPasscode {
  hash: string;
  salt: string;
}

/**
 * Hash a passcode using PBKDF2 with SHA-256
 * @param passcode - Plain text passcode
 * @returns Hashed passcode with salt
 */
export async function hashPasscode(passcode: string): Promise<HashedPasscode> {
  return new Promise((resolve, reject) => {
    // Generate random salt
    const salt = crypto.randomBytes(32).toString('hex');

    // Hash with PBKDF2
    crypto.pbkdf2(passcode, salt, 100000, 64, 'sha256', (err, derivedKey) => {
      if (err) reject(err);
      else {
        resolve({
          hash: derivedKey.toString('hex'),
          salt,
        });
      }
    });
  });
}

/**
 * Verify a passcode against stored hash
 * @param passcode - Plain text passcode to verify
 * @param storedHash - Stored hash object
 * @returns True if passcode matches
 */
export async function verifyPasscode(
  passcode: string,
  storedHash: HashedPasscode
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(passcode, storedHash.salt, 100000, 64, 'sha256', (err, derivedKey) => {
      if (err) reject(err);
      else {
        const hash = derivedKey.toString('hex');
        resolve(hash === storedHash.hash);
      }
    });
  });
}
