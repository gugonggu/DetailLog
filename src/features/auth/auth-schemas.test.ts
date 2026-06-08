import { describe, expect, it } from "vitest";

import {
  createSignupProfileMetadata,
  getLoginRedirectPath,
  loginSchema,
  signupSchema,
} from "./schemas";
import { prepareProfileCreation } from "./profile-service";

describe("auth schemas", () => {
  it("rejects invalid email values", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });

    expect(result.success).toBe(false);
  });

  it("rejects short passwords", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      password: "short",
      nickname: "Detailer",
    });

    expect(result.success).toBe(false);
  });

  it("includes a trimmed nickname in signup profile metadata", () => {
    const metadata = createSignupProfileMetadata("  Detailer  ");

    expect(metadata).toEqual({ nickname: "Detailer" });
  });

  it("prepares a profile payload after signup", () => {
    const profile = prepareProfileCreation({
      userId: "user-id",
      email: "user@example.com",
      nickname: "  Detailer  ",
    });

    expect(profile).toEqual({
      id: "user-id",
      email: "user@example.com",
      nickname: "Detailer",
    });
  });

  it("uses redirectedFrom after login when it is an internal path", () => {
    expect(getLoginRedirectPath("/cars")).toBe("/cars");
    expect(getLoginRedirectPath("/routine/new?mode=create")).toBe(
      "/routine/new?mode=create",
    );
  });

  it("falls back to dashboard after login without a safe redirectedFrom path", () => {
    expect(getLoginRedirectPath(null)).toBe("/dashboard");
    expect(getLoginRedirectPath("https://example.com")).toBe("/dashboard");
    expect(getLoginRedirectPath("//example.com")).toBe("/dashboard");
  });
});
