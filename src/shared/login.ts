import { z } from "zod";

export const loginSchema = z.strictObject({
  email: z.string().trim().max(254).email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha.").max(4096),
});
export type LoginInput = z.infer<typeof loginSchema>;
export const LOGIN_FAILURE =
  "Não foi possível entrar. Verifique seu e-mail e senha.";
export const AUTHENTICATED_PATH = "/app";
