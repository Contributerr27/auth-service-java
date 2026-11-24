import { describe, expect, it } from "vitest";
import { decodeAccessToken } from "../jwt";

function makeToken(payload: object): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.signature`;
}

describe("decodeAccessToken", () => {
  it("returns the user id, email and expiry in milliseconds", () => {
    const token = makeToken({ sub: "42", email: "user@example.com", exp: 1_900_000_000 });
    expect(decodeAccessToken(token)).toEqual({
      userId: 42,
      email: "user@example.com",
      expiresAtMs: 1_900_000_000_000,
    });
  });

  it("throws when the token does not have three parts", () => {
    expect(() => decodeAccessToken("only.two")).toThrow("Malformed access token");
  });

  it("throws when a required claim is missing", () => {
    const token = makeToken({ sub: "42", exp: 1_900_000_000 });
    expect(() => decodeAccessToken(token)).toThrow("Access token payload missing required claims");
  });
});
