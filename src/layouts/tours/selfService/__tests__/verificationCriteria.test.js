import { computeVerificationCriteria } from "../verificationCriteria";

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}
const complete = () => ({ firstName: "Ana", firstSurname: "Perez", identification: "1-2345-6789", email: "ana@example.com", passportNumber: "CR1234567", passportExpiry: daysFromNow(200), hasVisa: true, visaExpiry: daysFromNow(200) });

test("passes when every field is complete and current", () => {
  expect(computeVerificationCriteria(complete()).passed).toBe(true);
});
test("fails when the passport expires within 60 days", () => {
  const result = computeVerificationCriteria({ ...complete(), passportExpiry: daysFromNow(30) });
  expect(result.criteria.passport).toBe(false);
  expect(result.passed).toBe(false);
});
test("fails when visa is missing", () => {
  const result = computeVerificationCriteria({ ...complete(), hasVisa: false, visaExpiry: null });
  expect(result.criteria.visa).toBe(false);
  expect(result.passed).toBe(false);
});
test("does not require a visa for a foreign passport nationality", () => {
  const result = computeVerificationCriteria(
    { ...complete(), hasVisa: false, visaExpiry: null },
    "CAN"
  );
  expect(result.visaRequired).toBe(false);
  expect(result.criteria.visa).toBe(true);
  expect(result.passed).toBe(true);
});
test("fails when required identity fields are blank", () => {
  expect(computeVerificationCriteria({}).passed).toBe(false);
});
