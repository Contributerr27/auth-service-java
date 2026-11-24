import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthApiError, login, logout, refresh, signup } from "../auth-api";

const pair = { token: "access", tokenType: "Bearer", refreshToken: "refresh" };

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("auth-api", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubEnv("AUTH_API_URL", "http://auth.test");
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("posts signup credentials as JSON and returns the token pair", async () => {
    fetchMock.mockResolvedValue(jsonResponse(pair));

    await expect(signup("user@example.com", "12345678")).resolves.toEqual(pair);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://auth.test/auth/signup");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ email: "user@example.com", password: "12345678" });
  });

  it("posts login credentials to /auth/login", async () => {
    fetchMock.mockResolvedValue(jsonResponse(pair));
    await login("user@example.com", "pw");
    expect(fetchMock.mock.calls[0][0]).toBe("http://auth.test/auth/login");
  });

  it("posts the refresh token to /auth/refresh", async () => {
    fetchMock.mockResolvedValue(jsonResponse(pair));
    await refresh("old-refresh");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://auth.test/auth/refresh");
    expect(JSON.parse(init.body)).toEqual({ refreshToken: "old-refresh" });
  });

  it("throws an AuthApiError with the error message and details", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: "Validation failed", details: ["email: invalid"] }, { status: 400 }),
    );

    const error = await login("bad", "pw").catch((e) => e);
    expect(error).toBeInstanceOf(AuthApiError);
    expect(error.status).toBe(400);
    expect(error.message).toBe("Validation failed");
    expect(error.details).toEqual(["email: invalid"]);
  });

  it("reads Retry-After from a rate limited response", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "30" } }),
    );

    const error = await login("user@example.com", "pw").catch((e) => e);
    expect(error.status).toBe(429);
    expect(error.retryAfterSeconds).toBe(30);
  });

  it("falls back to a generic message when the error body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("Bad gateway", { status: 502 }));

    const error = await login("user@example.com", "pw").catch((e) => e);
    expect(error.status).toBe(502);
    expect(error.message).toBe("Request failed");
  });

  it("treats a 401 on logout as success but surfaces other failures", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
    await expect(logout("refresh")).resolves.toBeUndefined();

    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "Boom" }, { status: 500 }));
    await expect(logout("refresh")).rejects.toBeInstanceOf(AuthApiError);
  });

  it("requires AUTH_API_URL to be set", async () => {
    vi.stubEnv("AUTH_API_URL", "");
    await expect(login("user@example.com", "pw")).rejects.toThrow("AUTH_API_URL env var must be set");
  });
});
