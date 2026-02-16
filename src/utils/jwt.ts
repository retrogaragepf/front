// src/utils/jwt.ts
import { jwtDecode } from "jwt-decode";

type JwtPayload = {
  isAdmin?: boolean;
  exp?: number;
};

export function getIsAdminFromToken(token: string | null): boolean {
  if (!token) return false;

  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded?.isAdmin === true;
  } catch {
    return false;
  }
}
