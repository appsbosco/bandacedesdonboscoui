import { buildLoginPath, resolveSafeReturnPath } from "../authRedirect";

describe("authRedirect", () => {
  test("conserva la gira y el tab del tiquete al enviar al login", () => {
    const loginPath = buildLoginPath("/tours/tour-1", "?tab=flight-ticket");
    const search = loginPath.slice(loginPath.indexOf("?"));

    expect(resolveSafeReturnPath(search)).toBe("/tours/tour-1?tab=flight-ticket");
  });

  test.each(["https://evil.example/path", "//evil.example/path", "/\\evil.example/path"])(
    "rechaza el destino externo %s",
    (returnTo) => {
      const search = `?returnTo=${encodeURIComponent(returnTo)}`;
      expect(resolveSafeReturnPath(search, "/dashboard")).toBe("/dashboard");
    }
  );
});
