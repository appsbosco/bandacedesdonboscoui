import { getEligiblePaymentOperators, reconcilePaymentOperatorIds } from "../paymentOperators";

const users = [
  { id: "staff-1", role: "Staff" },
  { id: "staff-2", role: "Staff" },
  { id: "admin-1", role: "Admin" },
  { id: "logistics-1", role: "Dirección Logística" },
];

test("payment operator candidates use the same exact Staff contract as the API", () => {
  expect(getEligiblePaymentOperators(users).map(({ id }) => id)).toEqual(["staff-1", "staff-2"]);
});

test("payment operator payload removes hidden stale and non-Staff IDs", () => {
  expect(
    reconcilePaymentOperatorIds(["staff-1", "admin-1", "deleted-user", "staff-1"], users)
  ).toEqual(["staff-1"]);
});

test("payment operator payload is empty until authoritative candidates are loaded", () => {
  expect(reconcilePaymentOperatorIds(["staff-1"], undefined)).toEqual([]);
});
