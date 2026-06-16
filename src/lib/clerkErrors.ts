const CLERK_ERROR_MAP: Record<string, string> = {
  // Email
  "That email address is taken. Please try another.": "Este e-mail já está em uso. Tente outro.",
  "email_address_taken": "Este e-mail já está em uso. Tente outro.",
  "is already taken": "Este e-mail já está em uso. Tente outro.",
  "Enter a valid email address.": "Digite um endereço de e-mail válido.",

  // Senha
  "Passwords must be 8 characters or more.": "A senha deve ter no mínimo 8 caracteres.",
  "Password is incorrect. Try again, or use another method.": "Senha incorreta. Tente novamente.",
  "Password must be at least 8 characters long.": "A senha deve ter no mínimo 8 caracteres.",

  // Login
  "Couldn't find your account.": "Conta não encontrada. Verifique seu e-mail.",
  "Invalid verification code": "Código de verificação inválido.",
  "Verification code expired": "Código expirado. Solicite um novo.",
  "Too many requests": "Muitas tentativas. Aguarde alguns minutos.",
  "is incorrect": "E-mail ou senha incorretos.",
  "identifier_not_found": "Conta não encontrada.",
  "form_password_incorrect": "Senha incorreta. Tente novamente.",
  "form_identifier_not_found": "Conta não encontrada. Verifique seu e-mail.",

  // Verificação
  "is invalid": "Código inválido. Verifique e tente novamente.",
  "has expired": "Código expirado. Solicite um novo.",
};

export function translateClerkError(msg: string): string {
  if (!msg) return msg;
  for (const [key, value] of Object.entries(CLERK_ERROR_MAP)) {
    if (msg.includes(key)) return value;
  }
  return msg;
}
