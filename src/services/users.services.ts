// src/services/users.services.ts

export type AdminUser = {
  id: string;
  name?: string | null;
  email: string;

  role?: string;
  isBanned?: boolean;
  isBlocked?: boolean;

  // ✅ NUEVO (no rompe nada, opcional)
  avatarPublicId?: string | null;
  avatarUrl?: string | null;
};

export type AdminUIUser = AdminUser & { isBanned: boolean };

// ✅ NUEVO (perfil del usuario logueado; flexible para no romper)
export type UserProfile = {
  id: string;
  name?: string | null;
  email?: string | null;
  avatarPublicId?: string | null;
  avatarUrl?: string | null;
  [key: string]: any;
};

// ✅ NUEVO (payload PATCH avatar)
export type UpdateMyAvatarPayload = {
  avatarPublicId?: string | null;
  avatarUrl?: string | null;
};

// ✅ NUEVO (response PATCH avatar, según back)
export type UpdateMyAvatarResponse = {
  avatarPublicId?: string | null;
  avatarUrl?: string | null;
};

//const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL; SE MUEVE DENTOR DE. LA. FUNC. REQUEST PAAR EVITAER ERRORES DE IMPORTACION EN EL SERVIDOR

// ✅ IMPORTANTE: misma key que usa authService (no rompemos nada)
const TOKEN_KEY = process.env.NEXT_PUBLIC_JWT_TOKEN_KEY || "retrogarage_auth";

// ✅ La única ruta confirmada que existe es /users (401 cuando no hay token)
const ENDPOINTS = {
  all: "/users",
  profile: "/users/profile", // ✅ NUEVO
  meAvatar: "/users/me/avatar", // ✅ NUEVO

  // ⚠️ dejo block/unblock alineados a /users para no volver a /admin (que 404)
  block: (id: string) => `/users/${id}/block`,
  unblock: (id: string) => `/users/${id}/unblock`,
  delete: (id: string) => `/users/${id}`,
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;

    // ✅ Compatibilidad: JWT plano
    if (raw.startsWith("eyJ")) return raw;

    // ✅ JSON con { user, token }
    const parsed = JSON.parse(raw);

    if (typeof parsed?.token === "string") return parsed.token;
    if (typeof parsed?.dataUser?.token === "string")
      return parsed.dataUser.token;
    if (typeof parsed?.userSession?.token === "string")
      return parsed.userSession.token;

    return null;
  } catch {
    return null;
  }
}

async function parseJsonSafe(response: Response) {
  const text = await response.text();
  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");

  let data: any = text;
  try {
    data = isJson && text ? JSON.parse(text) : text;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const msg =
      (typeof data === "object" && data && "message" in data
        ? (data as any).message
        : null) ||
      (typeof data === "string" ? data : null) ||
      `HTTP ${response.status}`;

    throw new Error(Array.isArray(msg) ? msg.join(", ") : String(msg));
  }

  return data;
}

function normalizeUser(u: AdminUser): AdminUIUser {
  return {
    ...u,
    isBanned: Boolean(u.isBanned ?? u.isBlocked),
  };
}

async function request<T>(
  path: string,
  init?: RequestInit,
  tokenFromContext?: string | null,
): Promise<T> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL)
    throw new Error("NEXT_PUBLIC_API_BASE_URL no está configurado.");

  const token = tokenFromContext ?? getToken();
  if (!token) throw new Error("Unauthorized: no hay token guardado.");

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  return parseJsonSafe(res) as Promise<T>;
}

/** ✅ Ya devuelve isBanned normalizado */
export async function getAllUsers(
  token?: string | null,
): Promise<AdminUIUser[]> {
  const data = await request<AdminUser[]>(
    ENDPOINTS.all,
    { method: "GET" },
    token,
  );
  return (data ?? []).map(normalizeUser);
}

export async function blockUser(
  id: string,
  token?: string | null,
): Promise<AdminUIUser> {
  const data = await request<any>(
    ENDPOINTS.block(id),
    { method: "PATCH" },
    token,
  );
  const user: AdminUser = (data?.user ?? data) as AdminUser;
  return normalizeUser(user);
}

export async function unblockUser(
  id: string,
  token?: string | null,
): Promise<AdminUIUser> {
  const data = await request<any>(
    ENDPOINTS.unblock(id),
    { method: "PATCH" },
    token,
  );
  const user: AdminUser = (data?.user ?? data) as AdminUser;
  return normalizeUser(user);
}

export async function deleteUser(
  id: string,
  token?: string | null,
): Promise<void> {
  await request<unknown>(ENDPOINTS.delete(id), { method: "DELETE" }, token);
}

/* =========================================================
   ✅ NUEVO: Avatar del usuario autenticado (NO rompe nada)
   ========================================================= */

/** PATCH /users/me/avatar */
export async function updateMyAvatar(
  payload: UpdateMyAvatarPayload,
  token?: string | null,
): Promise<UpdateMyAvatarResponse> {
  return request<UpdateMyAvatarResponse>(
    ENDPOINTS.meAvatar,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token,
  );
}

/** (Opcional pero útil) GET /users/profile para hidratar avatar desde DB */
export async function getMyProfile(
  token?: string | null,
): Promise<UserProfile> {
  return request<UserProfile>(ENDPOINTS.profile, { method: "GET" }, token);
}
