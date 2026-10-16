export type OwnerLoginFailureCode =
  | "OWNER_CONFIG_MISSING"
  | "OWNER_UID_UNAUTHORIZED"
  | "AUTH_PASSWORD_INCORRECT"
  | "AUTH_USER_NOT_FOUND"
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_EMAIL_PASSWORD_DISABLED"
  | "AUTH_USER_DISABLED"
  | "AUTH_NETWORK_ERROR"
  | "OWNER_SERVER_CONFIG"
  | "OWNER_SERVER_UID_UNAUTHORIZED"
  | "OWNER_SERVER_TOKEN_INVALID"
  | "AUTH_UNKNOWN";

export class OwnerLoginError extends Error {
  readonly code: OwnerLoginFailureCode;

  constructor(code: OwnerLoginFailureCode) {
    super(code);
    this.name = "OwnerLoginError";
    this.code = code;
  }
}

const errorCode = (error: unknown) =>
  error && typeof error === "object" && "code" in error && typeof error.code === "string"
    ? error.code
    : "";

export function classifyOwnerLoginError(error: unknown): OwnerLoginError {
  if (error instanceof OwnerLoginError) return error;
  switch (errorCode(error)) {
    case "auth/wrong-password":
      return new OwnerLoginError("AUTH_PASSWORD_INCORRECT");
    case "auth/user-not-found":
      return new OwnerLoginError("AUTH_USER_NOT_FOUND");
    case "auth/operation-not-allowed":
      return new OwnerLoginError("AUTH_EMAIL_PASSWORD_DISABLED");
    case "auth/user-disabled":
      return new OwnerLoginError("AUTH_USER_DISABLED");
    case "auth/network-request-failed":
      return new OwnerLoginError("AUTH_NETWORK_ERROR");
    case "auth/invalid-credential":
    case "auth/invalid-email":
      return new OwnerLoginError("AUTH_INVALID_CREDENTIALS");
    default:
      return new OwnerLoginError("AUTH_UNKNOWN");
  }
}

export function ownerLoginMessage(error: unknown): string {
  const code = classifyOwnerLoginError(error).code;
  switch (code) {
    // Firebase may deliberately collapse a missing account and a wrong password.
    // Keep the public message generic while tests and diagnostics retain the category.
    case "AUTH_PASSWORD_INCORRECT":
    case "AUTH_USER_NOT_FOUND":
    case "AUTH_INVALID_CREDENTIALS":
      return "No se pudo autenticar. Revisa el correo y la contraseña.";
    case "AUTH_EMAIL_PASSWORD_DISABLED":
      return "Email/Password está deshabilitado en el proyecto Firebase de Preview.";
    case "AUTH_USER_DISABLED":
      return "La cuenta Owner está deshabilitada en Firebase Authentication.";
    case "OWNER_UID_UNAUTHORIZED":
      return "La cuenta se autenticó, pero su UID no está autorizado para FLOES Preview.";
    case "OWNER_CONFIG_MISSING":
      return "Falta configurar el UID Owner en la candidata Preview de FLOES.";
    case "OWNER_SERVER_CONFIG":
      return "La autenticación Owner del servidor Preview está incompleta o apunta a otro proyecto.";
    case "OWNER_SERVER_UID_UNAUTHORIZED":
      return "Firebase autenticó la cuenta, pero el servidor Preview no la reconoce como Owner.";
    case "OWNER_SERVER_TOKEN_INVALID":
      return "El servidor Preview no pudo validar la sesión Firebase. Cierra sesión e inténtalo de nuevo.";
    case "AUTH_NETWORK_ERROR":
      return "No se pudo conectar con Firebase Authentication. Revisa la conexión e inténtalo de nuevo.";
    default:
      return "No se pudo completar el acceso Owner. Revisa la configuración de Preview.";
  }
}

export interface OwnerLoginUser {
  uid: string;
  getIdToken?: () => Promise<string>;
}

export interface OwnerLoginDependencies<TUser extends OwnerLoginUser> {
  expectedUid: string | undefined;
  signIn: (email: string, password: string) => Promise<{ user: TUser }>;
  signOut: () => Promise<unknown>;
  verifyServerAccess?: (user: TUser) => Promise<void>;
}

export async function authenticateOwner<TUser extends OwnerLoginUser>(
  email: string,
  password: string,
  dependencies: OwnerLoginDependencies<TUser>,
): Promise<TUser> {
  const expectedUid = dependencies.expectedUid?.trim();
  if (!expectedUid) throw new OwnerLoginError("OWNER_CONFIG_MISSING");

  let user: TUser;
  try {
    user = (await dependencies.signIn(email.trim(), password)).user;
  } catch (error) {
    throw classifyOwnerLoginError(error);
  }

  if (user.uid !== expectedUid) {
    try { await dependencies.signOut(); } catch { /* the rejected session is never accepted */ }
    throw new OwnerLoginError("OWNER_UID_UNAUTHORIZED");
  }

  try {
    await dependencies.verifyServerAccess?.(user);
  } catch (error) {
    try { await dependencies.signOut(); } catch { /* the rejected session is never accepted */ }
    throw classifyOwnerLoginError(error);
  }

  return user;
}
