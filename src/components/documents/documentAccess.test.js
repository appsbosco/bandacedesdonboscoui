import { canReviewReceipts, isDocumentAdmin } from "./documentAccess";

describe("document access for Staff", () => {
  test("allows receipt review without granting document administration", () => {
    const staff = { role: "Staff" };

    expect(canReviewReceipts(staff)).toBe(true);
    expect(isDocumentAdmin(staff)).toBe(false);
  });

  test("does not grant receipt review to unrelated roles", () => {
    expect(canReviewReceipts({ role: "Musico" })).toBe(false);
  });
});
