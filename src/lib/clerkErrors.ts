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
  "form_password_pwned": "Essa senha é muito comum ou foi encontrada em vazamentos de dados. Escolha uma senha mais segura e única.",
  "form_password_not_strong_enough": "Sua senha não é forte o suficiente. Use letras maiúsculas, minúsculas, números ou símbolos.",
  "form_password_size_in_bytes_exceeded": "Senha muito longa. Use no máximo 72 caracteres.",
  "Password has been found in an online data breach": "Essa senha foi encontrada em vazamentos de dados. Por segurança, escolha uma senha diferente.",
  "password_found_in_data_breach": "Essa senha foi encontrada em vazamentos de dados. Por segurança, escolha uma senha diferente.",
  "Password must contain": "A senha não atende aos requisitos de segurança. Use letras maiúsculas, minúsculas e números.",

  // Sessão
  "session_exists": "Você já está logado. Redirecionando...",

  // Login
  "Couldn't find your account.": "Conta não encontrada. Verifique seu e-mail.",
  "Invalid verification code": "Código de verificação inválido.",
  "Verification code expired": "Código expirado. Solicite um novo.",
  "Too many requests": "Muitas tentativas. Aguarde alguns minutos.",
  "is incorrect": "E-mail ou senha incorretos.",
  "identifier_not_found": "E-mail ou senha incorretos.",
  "form_password_incorrect": "Senha incorreta. Tente novamente.",
  "form_identifier_not_found": "E-mail ou senha incorretos.",

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
