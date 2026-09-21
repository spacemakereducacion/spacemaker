import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Ingrese un correo válido."),
  password: z.string().min(1, "Ingrese su contraseña."),
});

export const forgotSchema = z.object({
  email: z.string().email("Ingrese un correo válido."),
});

export const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(10, "La contraseña debe tener al menos 10 caracteres."),
});

export const verifySchema = z.object({
  token: z.string().min(10),
});
