import { z } from "zod";

export const codigoSchema = z
  .string()
  .trim()
  .min(1, "Ingresá tu código")
  .transform((v) => v.toUpperCase().replace(/\s/g, ""));
