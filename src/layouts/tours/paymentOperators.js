export function getEligiblePaymentOperators(users) {
  if (!Array.isArray(users)) return [];
  return users.filter((user) => user?.role === "Staff" && user?.id);
}

export function reconcilePaymentOperatorIds(selectedIds, eligibleUsers) {
  const eligibleIds = new Set(
    getEligiblePaymentOperators(eligibleUsers).map((user) => String(user.id))
  );

  return [
    ...new Set(
      (Array.isArray(selectedIds) ? selectedIds : []).filter(Boolean).map((id) => String(id))
    ),
  ].filter((id) => eligibleIds.has(id));
}
