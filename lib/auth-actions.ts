"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  assertSession,
  createSession,
  destroySession,
  getLoginUser,
  registerFailedLogin,
  registerSuccessfulLogin,
  setSessionCookie,
  updatePassword,
  verifyPassword,
} from "./auth";
import { query } from "./db";

export type LoginState = { error?: string } | undefined;
export type PasswordState = { error?: string; success?: string } | undefined;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");

  if (!password) return { error: "Ingresa la contraseña" };
  if (password.length > 200) return { error: "Contraseña incorrecta" };

  const user = await getLoginUser();
  if (!user) return { error: "No hay un usuario configurado" };

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    return { error: "Demasiados intentos fallidos. Intenta de nuevo en 15 minutos." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    await registerFailedLogin(user);
    return { error: "Contraseña incorrecta" };
  }

  await registerSuccessfulLogin(user.id);
  const token = await createSession(user.id);
  await setSessionCookie(token);

  redirect("/");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}

export async function changePassword(
  _prevState: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const user = await assertSession();

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "Completa todos los campos" };
  }

  if (newPassword.length < 8) {
    return { error: "La nueva contraseña debe tener al menos 8 caracteres" };
  }

  if (newPassword.length > 200) {
    return { error: "La nueva contraseña es demasiado larga" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "La nueva contraseña y la confirmación no coinciden" };
  }

  if (newPassword === currentPassword) {
    return { error: "La nueva contraseña debe ser diferente a la actual" };
  }

  const rows = await query<{ password_hash: string }>(
    "select password_hash from users where id = $1",
    [user.id]
  );

  if (!rows[0] || !(await verifyPassword(currentPassword, rows[0].password_hash))) {
    return { error: "La contraseña actual no es correcta" };
  }

  await updatePassword(user.id, user.sessionId, newPassword);

  revalidatePath("/mas");
  revalidatePath("/mas/seguridad");

  return { success: "Contraseña actualizada correctamente" };
}
