/**
 * Role-based access for CrisisLens.
 * - admin: full access + Kubeflow retrain
 * - analyst: dashboard + reports + settings
 * - viewer: read-only dashboard (optional)
 */

export type Role = "admin" | "analyst" | "viewer";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const ANALYST_EMAILS = (process.env.ANALYST_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export function roleForEmail(email: string | null | undefined): Role {
  if (!email) return "viewer";
  const e = email.toLowerCase();
  if (ADMIN_EMAILS.includes(e)) return "admin";
  if (ANALYST_EMAILS.includes(e)) return "analyst";
  return "analyst";
}

export function credentialsRoleForEmail(email: string): Role {
  if (email.toLowerCase() === "admin@crisislens.local") return "admin";
  if (email.toLowerCase() === "viewer@crisislens.local") return "viewer";
  return "analyst";
}
