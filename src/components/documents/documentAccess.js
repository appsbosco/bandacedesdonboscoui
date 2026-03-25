export const DOCUMENT_ADMIN_ROLES = new Set(["Admin", "CEDES Financiero"]);

export const SENSITIVE_DOCUMENT_TYPES = ["PASSPORT", "VISA", "PERMISO_SALIDA"];

export function isDocumentAdmin(user) {
  if (!user) return false;

  return (
    DOCUMENT_ADMIN_ROLES.has(user.role) ||
    user?.roles?.some((role) => DOCUMENT_ADMIN_ROLES.has(role))
  );
}
