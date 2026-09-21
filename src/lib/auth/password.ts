import bcrypt from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export function passwordPolicy(plain: string) {
  const errors: string[] = [];
  if (plain.length < 10) errors.push("La contraseña debe tener al menos 10 caracteres.");
  if (!/[A-Z]/.test(plain)) errors.push("Debe incluir una mayúscula.");
  if (!/[a-z]/.test(plain)) errors.push("Debe incluir una minúscula.");
  if (!/[0-9]/.test(plain)) errors.push("Debe incluir un número.");
  return errors;
}
