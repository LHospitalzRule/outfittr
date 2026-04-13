const TOKEN_KEY = "token_data";
const USER_KEY = "user_data";

export type StoredUser = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

type JwtPayload = {
  userId: string;
  firstName?: string;
  lastName?: string;
};

export function storeAccessToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeUser(user: StoredUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): StoredUser | null {
  const rawUser = localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as StoredUser;
  } catch (error) {
    clearSession();
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function decodeToken(token: string): JwtPayload {
  const [, payload] = token.split(".");

  if (!payload) {
    throw new Error("Invalid token payload");
  }

  return JSON.parse(atob(payload)) as JwtPayload;
}
