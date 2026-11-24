import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "../validation";

describe("signupSchema", () => {
  it("accepts a valid email and an 8 character password", () => {
    const result = signupSchema.safeParse({ email: "user@example.com", password: "12345678" });
    expect(result.success).toBe(true);
  });

  it("trims the email", () => {
    const result = signupSchema.parse({ email: "  user@example.com  ", password: "12345678" });
    expect(result.email).toBe("user@example.com");
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = signupSchema.safeParse({ email: "user@example.com", password: "1234567" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Password must be at least 8 characters");
  });

  it("rejects an empty email", () => {
    const result = signupSchema.safeParse({ email: "   ", password: "12345678" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Email is required");
  });

  it("rejects a malformed email", () => {
    const result = signupSchema.safeParse({ email: "not-an-email", password: "12345678" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Enter a valid email address");
  });
});

describe("loginSchema", () => {
  it("accepts any non-empty password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "x" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Password is required");
  });

  it("rejects a malformed email", () => {
    const result = loginSchema.safeParse({ email: "nope", password: "x" });
    expect(result.success).toBe(false);
  });
});
