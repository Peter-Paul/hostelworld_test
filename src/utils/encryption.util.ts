import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EncryptionService {
  algorithm = 'aes-192-cbc';
  password = 'bf3c199c2470cb477d907b1e0917c17b';
  salt = '5183666c72eec9e4';
  constructor() {}

  encrypt(val) {
    // Use the async `crypto.scrypt()` instead.
    const key = crypto.scryptSync(this.password, this.salt, 24);
    // Use `crypto.randomBytes` to generate a random iv instead of the static iv
    // shown here.
    const iv = Buffer.alloc(16, 0); // Initialization vector.

    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    let encrypted = cipher.update(val, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    // Prints: e5f79c5915c02171eec6b212d5520d44480993d7d622a7c4c2da32f6efda0ffa
    return encrypted;
  }

  decrypt(encrypted) {
    // Use the async `crypto.scrypt()` instead.
    const key = crypto.scryptSync(this.password, this.salt, 24);
    // The IV is usually passed along with the ciphertext.
    const iv = Buffer.alloc(16, 0); // Initialization vector.

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);

    // Encrypted using same algorithm, key and iv.
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    // Prints: some clear text data

    return decrypted;
  }

  async compare(encryptedText: string, plainText: string): Promise<boolean> {
    const decryptedText = this.decrypt(encryptedText);
    return decryptedText === plainText;
  }

  async create(data: string) {
    const secret = this.salt;
    return await crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  async verify(computed, retrieved) {
    const computedSignature = await Buffer.from(computed, 'hex');
    const retrievedSignature = await Buffer.from(retrieved, 'hex');
    return crypto.timingSafeEqual(computedSignature, retrievedSignature);
  }
}
