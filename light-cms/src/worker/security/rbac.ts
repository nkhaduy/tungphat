import type { UserRole } from "../../contracts/content";

export type Permission =
  | "content:read" | "content:create" | "content:update" | "content:delete" | "content:publish"
  | "settings:read" | "settings:update" | "media:read" | "media:create" | "media:delete"
  | "version:read" | "version:restore" | "preview:create" | "users:read" | "audit:read";

const editor = new Set<Permission>(["content:read", "content:create", "content:update", "settings:read", "media:read", "media:create", "version:read", "preview:create"]);
const admin = new Set<Permission>([...editor, "content:delete", "content:publish", "settings:update", "media:delete", "version:restore", "users:read", "audit:read"]);
const superAdmin = new Set<Permission>(admin);

export function authorize(role: UserRole, permission: Permission) {
  const permissions = role === "super-admin" ? superAdmin : role === "admin" ? admin : editor;
  return permissions.has(permission);
}
