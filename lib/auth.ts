import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { query } from "./db";

/**
 * Autenticación simple: un usuario (alison) y sesiones opacas en base de datos.
 * El navegador recibe un token aleatorio; en `sessions` solo se guarda su SHA-256.
 */

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: string,
  keylen: number
) => Promise<Buffer>;

export const SESSION_COOKIE = "ft_session";

/** No escribir en BD en cada request: renovar como máximo una vez por hora. */
const SESSION_REFRESH_MS = 60 * 60 * 1000;
/**
 * La cookie se conserva más tiempo en el navegador, pero la BD es la fuente
 * de verdad: pasadas 72 h sin actividad la sesión se rechaza igualmente.
 */
const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export const LOGIN_USERNAME = "alison";
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;

export interface SessionUser {
  id: string;
  sessionId: string;
  username: string;
  name: string;
  passwordChangedAt: Date | null;
}

interface SessionRow {
  id: string;
  session_id: string;
  username: string;
  name: string;
  password_changed_at: Date | string | null;
  last_used_at: Date | string;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;

  const [, salt, hashHex] = parts;
  const expected = Buffer.from(hashHex, "hex");
  if (expected.length === 0) return false;

  const derived = await scrypt(password, salt, expected.length);
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export interface LoginUser {
  id: string;
  passwordHash: string;
  failedAttempts: number;
  lockedUntil: Date | null;
}

export async function getLoginUser(): Promise<LoginUser | null> {
  const rows = await query<{
    id: string;
    password_hash: string;
    failed_login_attempts: number;
    locked_until: Date | string | null;
  }>(
    `select id, password_hash, failed_login_attempts, locked_until
     from users
     where username = $1 and is_active = true
     limit 1`,
    [LOGIN_USERNAME]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    passwordHash: row.password_hash,
    failedAttempts: Number(row.failed_login_attempts),
    lockedUntil: row.locked_until == null ? null : new Date(row.locked_until),
  };
}

export async function registerFailedLogin(user: LoginUser): Promise<void> {
  const nextAttempts = user.failedAttempts + 1;

  if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
    await query(
      `update users
       set failed_login_attempts = 0,
           locked_until = now() + ($1 || ' minutes')::interval,
           updated_at = now()
       where id = $2`,
      [String(LOCK_MINUTES), user.id]
    );
    return;
  }

  await query(
    "update users set failed_login_attempts = $1, updated_at = now() where id = $2",
    [nextAttempts, user.id]
  );
}

export async function registerSuccessfulLogin(userId: string): Promise<void> {
  await query(
    `update users
     set failed_login_attempts = 0,
         locked_until = null,
         last_login_at = now(),
         updated_at = now()
     where id = $1`,
    [userId]
  );
}

export async function createSession(userId: string): Promise<string> {
  // Limpieza oportunista de sesiones vencidas del usuario.
  await query("delete from sessions where user_id = $1 and expires_at <= now()", [userId]);

  const token = randomBytes(32).toString("base64url");
  await query(
    `insert into sessions (user_id, token_hash, expires_at, last_used_at)
     values ($1, $2, now() + interval '72 hours', now())`,
    [userId, hashToken(token)]
  );

  return token;
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

/**
 * Devuelve el usuario de la sesión actual o null.
 * Renueva la expiración deslizante (máximo una escritura por hora).
 * `cache` evita repetir la consulta dentro del mismo render/action.
 */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await query<SessionRow>(
    `select u.id, u.username, u.name, u.password_changed_at,
            s.id as session_id, s.last_used_at
     from sessions s
     join users u on u.id = s.user_id
     where s.token_hash = $1
       and s.expires_at > now()
       and u.is_active = true
     limit 1`,
    [hashToken(token)]
  );

  const row = rows[0];
  if (!row) return null;

  const lastUsed = new Date(row.last_used_at).getTime();
  if (Date.now() - lastUsed > SESSION_REFRESH_MS) {
    await query(
      `update sessions
       set expires_at = now() + interval '72 hours',
           last_used_at = now()
       where id = $1`,
      [row.session_id]
    );
  }

  return {
    id: row.id,
    sessionId: row.session_id,
    username: row.username,
    name: row.name,
    passwordChangedAt:
      row.password_changed_at == null ? null : new Date(row.password_changed_at),
  };
});

/** Para páginas y layouts: redirige a /login si no hay sesión. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}

/** Para server actions y route handlers: lanza error si no hay sesión. */
export async function assertSession(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) throw new Error("No autorizado");
  return user;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await query("delete from sessions where token_hash = $1", [hashToken(token)]);
  }

  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Cambia la contraseña y cierra las demás sesiones del usuario.
 * La sesión actual se conserva para no expulsar a quien hizo el cambio.
 */
export async function updatePassword(
  userId: string,
  currentSessionId: string,
  newPassword: string
): Promise<void> {
  const passwordHash = await hashPassword(newPassword);

  await query(
    `update users
     set password_hash = $1,
         password_changed_at = now(),
         failed_login_attempts = 0,
         locked_until = null,
         updated_at = now()
     where id = $2`,
    [passwordHash, userId]
  );

  await query("delete from sessions where user_id = $1 and id <> $2", [
    userId,
    currentSessionId,
  ]);
}
