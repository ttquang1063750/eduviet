import { createHmac } from 'crypto';
import { Prisma } from '@prisma/client';

const HASH_SALT = process.env.PII_HASH_SALT || 'default-salt-do-not-use-in-prod-min-32-chars!!';
const ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY || 'default-key-do-not-use-in-prod-min-32-chars!!';

/**
 * Generates a blind index (HMAC-SHA256) for a PII value.
 * Used for searching encrypted fields.
 */
export function hashPII(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return createHmac('sha256', HASH_SALT).update(normalized).digest('hex');
}

/**
 * Returns a Prisma SQL fragment for encrypting a value using pgp_sym_encrypt.
 */
export function encryptPIISql(value: string | null | undefined): Prisma.Sql {
  if (value === null || value === undefined) return Prisma.sql`NULL`;
  return Prisma.sql`pgp_sym_encrypt(${value}, ${ENCRYPTION_KEY})`;
}

/**
 * Returns a Prisma SQL fragment for decrypting a column using pgp_sym_decrypt.
 */
export function decryptPIISql(columnName: string): Prisma.Sql {
  // Use Prisma.raw for the column name to prevent it from being escaped as a string literal
  return Prisma.sql`pgp_sym_decrypt(${Prisma.raw(columnName)}, ${ENCRYPTION_KEY})`;
}
