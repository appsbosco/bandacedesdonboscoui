export const DOCUMENT_ADMIN_ROLES = new Set(["Admin", "CEDES Financiero"]);
export const RECEIPT_REVIEW_ROLES = new Set(["Staff"]);

export const SENSITIVE_DOCUMENT_TYPES = ["PASSPORT", "VISA", "PERMISO_SALIDA"];

export function isDocumentAdmin(user) {
  if (!user) return false;

  return Boolean(
    DOCUMENT_ADMIN_ROLES.has(user.role) ||
    user?.roles?.some((role) => DOCUMENT_ADMIN_ROLES.has(role))
  );
}

export function canReviewReceipts(user) {
  if (!user) return false;

  return Boolean(
    isDocumentAdmin(user) ||
    RECEIPT_REVIEW_ROLES.has(user.role) ||
    user?.roles?.some((role) => RECEIPT_REVIEW_ROLES.has(role))
  );
}
