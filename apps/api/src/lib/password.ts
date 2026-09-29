import { compare, hash } from "bcrypt";

const SALT_ROUNDS = 12;

export function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, encoded: string) {
  try {
    return await compare(password, encoded);
  } catch {
    return false;
  }
}
