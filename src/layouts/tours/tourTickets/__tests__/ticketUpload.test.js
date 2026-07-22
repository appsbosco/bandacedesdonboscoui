import { mapWithConcurrency, resolveBackendUrl } from "../ticketUpload";

describe("ticketUpload", () => {
  test("mantiene el orden al procesar con concurrencia limitada", async () => {
    const result = await mapWithConcurrency([3, 1, 2], 2, async (value) => {
      await Promise.resolve();
      return value * 2;
    });
    expect(result).toEqual([6, 2, 4]);
  });

  test("conserva URLs remotas firmadas", () => {
    expect(resolveBackendUrl("https://api.cloudinary.com/private.pdf")).toBe(
      "https://api.cloudinary.com/private.pdf"
    );
  });

  test("resuelve rutas privadas locales contra el origen del API", () => {
    const previous = process.env.REACT_APP_GRAPHQL_URL;
    process.env.REACT_APP_GRAPHQL_URL = "https://api.example.test/api/graphql";
    expect(resolveBackendUrl("/api/tour-participant-tickets/local-download?token=x")).toBe(
      "https://api.example.test/api/tour-participant-tickets/local-download?token=x"
    );
    process.env.REACT_APP_GRAPHQL_URL = previous;
  });
});
